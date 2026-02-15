import { useEffect, useRef, useState } from "react";
import { client_env } from "../env/client";
import { devLog } from "../utils";
import { convertToZpub } from "../utils/bitcoin";

export interface UseBlockbookWebSocketResult {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  getAccountInfo: (
    descriptor: string,
    options?: { details?: string; page?: number; pageSize?: number },
  ) => Promise<any>;
  subscribeToAddress: (
    addresses: string[],
    callback: (data: any) => void,
  ) => void;
  unsubscribeFromAddress: (addresses: string[]) => void;
}

interface PendingRequest {
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

let sharedSocket: WebSocket | null = null;
let connectionCount = 0;
let messageId = 0;
const pendingRequests = new Map<string, PendingRequest>();
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;
let isReconnecting = false;
let shouldReconnect = true;
const activeSubscriptions = new Map<string, string[]>();
const subscriptionCallbacksRef = new Map<string, (data: any) => void>();

function calculateReconnectDelay(attempt: number): number {
  const BASE_DELAY = 1000;
  const MAX_DELAY = 30000;
  const BACKOFF_MULTIPLIER = 2;
  const JITTER_FACTOR = 0.25;

  const exponentialDelay = Math.min(
    BASE_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt),
    MAX_DELAY,
  );

  const jitter = exponentialDelay * JITTER_FACTOR;
  const randomJitter = (Math.random() - 0.5) * 2 * jitter;

  return Math.floor(exponentialDelay + randomJitter);
}

function shouldRetryOnCloseCode(code: number): boolean {
  const NO_RETRY_CODES = [1000, 1001, 1002, 1003, 1007, 1008, 1009, 1010];

  return !NO_RETRY_CODES.includes(code);
}

function resubscribeAll() {
  if (!sharedSocket || sharedSocket.readyState !== WebSocket.OPEN) {
    return;
  }

  const allAddresses = new Set<string>();
  activeSubscriptions.forEach((addresses) => {
    addresses.forEach((addr) => allAddresses.add(addr));
  });

  if (allAddresses.size === 0) {
    devLog("[Blockbook WS] No subscriptions to restore");
    return;
  }

  const addressArray = Array.from(allAddresses);
  devLog(`[Blockbook WS] Re-subscribing to ${addressArray.length} addresses`);

  sendRequest("subscribeAddresses", { addresses: addressArray })
    .then(() => devLog("[Blockbook WS] Re-subscribed successfully"))
    .catch((err) => devLog("[Blockbook WS] Re-subscription failed:", err));
}

function setupSocketHandlers() {
  if (!sharedSocket) return;

  sharedSocket.onopen = () => {
    devLog("[Blockbook WS] Connected");
    reconnectAttempts = 0;
    isReconnecting = false;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    resubscribeAll();
  };

  sharedSocket.onmessage = (event: MessageEvent) => {
    try {
      const response = JSON.parse(event.data);
      devLog("[Blockbook WS] Received response:", response);

      if (response.id) {
        const pending = pendingRequests.get(response.id);
        if (pending) {
          clearTimeout(pending.timeout);
          pendingRequests.delete(response.id);

          if (response.data?.error) {
            pending.reject(new Error(response.data.error));
          } else {
            pending.resolve(response.data);
          }
        }
      } else if (response.data) {
        subscriptionCallbacksRef.forEach((callback) => {
          callback(response.data);
        });
      }
    } catch (err) {
      devLog("[Blockbook WS] Failed to parse message:", err);
    }
  };

  sharedSocket.onclose = (event) => {
    devLog(
      `[Blockbook WS] Disconnected: code=${event.code}, reason=${event.reason}`,
    );

    pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error("WebSocket disconnected"));
    });
    pendingRequests.clear();

    const shouldRetry = shouldRetryOnCloseCode(event.code);

    if (shouldRetry && shouldReconnect) {
      attemptReconnection();
    } else {
      devLog(`[Blockbook WS] Not reconnecting: shouldRetry=${shouldRetry}`);
      isReconnecting = false;
    }
  };

  sharedSocket.onerror = (event) => {
    devLog("[Blockbook WS] Error:", event);
  };
}

function connectWebSocket() {
  if (
    sharedSocket &&
    (sharedSocket.readyState === WebSocket.CONNECTING ||
      sharedSocket.readyState === WebSocket.OPEN)
  ) {
    devLog("[Blockbook WS] Socket already connected/connecting");
    isReconnecting = false;
    return;
  }

  const wsUrl =
    client_env.NEXT_PUBLIC_BTC_WSS_BLOCKBOOK_URL.replace(
      "https://",
      "wss://",
    ).replace("http://", "ws://") + "/websocket";

  devLog(
    `[Blockbook WS] ${
      isReconnecting ? "Reconnecting" : "Connecting"
    } to ${wsUrl}`,
  );

  try {
    sharedSocket = new WebSocket(wsUrl);
    setupSocketHandlers();
  } catch (error) {
    devLog("[Blockbook WS] Connection error:", error);
    isReconnecting = false;
    attemptReconnection();
  }
}

function attemptReconnection() {
  if (!shouldReconnect || connectionCount === 0) {
    devLog("[Blockbook WS] Reconnection stopped: no active hooks");
    return;
  }

  if (isReconnecting) {
    devLog("[Blockbook WS] Reconnection already in progress");
    return;
  }

  if (reconnectAttempts >= 10) {
    devLog("[Blockbook WS] Max reconnection attempts (10) reached");
    isReconnecting = false;
    return;
  }

  if (typeof window !== "undefined" && !navigator.onLine) {
    devLog("[Blockbook WS] Device offline, waiting for online event");
    return;
  }

  const delay = calculateReconnectDelay(reconnectAttempts);
  devLog(
    `[Blockbook WS] Reconnecting in ${delay}ms (attempt ${
      reconnectAttempts + 1
    }/10)`,
  );

  reconnectTimer = setTimeout(() => {
    reconnectAttempts++;
    isReconnecting = true;
    connectWebSocket();
  }, delay);
}

function sendRequest(method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!sharedSocket || sharedSocket.readyState !== WebSocket.OPEN) {
      reject(new Error("WebSocket not connected"));
      return;
    }

    const id = String(++messageId);
    const request = { id, method, params };

    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error("Request timeout"));
    }, 30000);

    pendingRequests.set(id, { resolve, reject, timeout });

    devLog("[Blockbook WS] Sending request:", request);
    sharedSocket.send(JSON.stringify(request));
  });
}

export function useBlockbookWebSocket(): UseBlockbookWebSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const instanceIdRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    connectionCount++;
    devLog(
      `[Blockbook WS] Hook mounted. Active connections: ${connectionCount}`,
    );

    if (!sharedSocket) {
      shouldReconnect = true;
      setIsConnecting(true);
      connectWebSocket();
    } else {
      setIsConnected(sharedSocket.readyState === WebSocket.OPEN);
      setIsConnecting(
        sharedSocket.readyState === WebSocket.CONNECTING || isReconnecting,
      );
    }

    const handleOnline = () => {
      devLog("[Blockbook WS] Network online, attempting reconnection");
      if (!sharedSocket || sharedSocket.readyState !== WebSocket.OPEN) {
        reconnectAttempts = Math.max(0, reconnectAttempts - 2);
        attemptReconnection();
      }
    };

    const handleOffline = () => {
      devLog("[Blockbook WS] Network offline");
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }
    const instanceId = instanceIdRef.current;

    return () => {
      connectionCount--;
      devLog(
        `[Blockbook WS] Hook unmounted. Active connections: ${connectionCount}`,
      );

      activeSubscriptions.delete(instanceId);

      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }

      if (connectionCount === 0) {
        devLog("[Blockbook WS] Last hook unmounted. Closing connection.");
        shouldReconnect = false;

        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }

        if (sharedSocket) {
          sharedSocket.close(1000, "No active consumers");
          sharedSocket = null;
        }

        pendingRequests.clear();
        messageId = 0;
        reconnectAttempts = 0;
        isReconnecting = false;
        activeSubscriptions.clear();
        subscriptionCallbacksRef.clear();
      }
    };
  }, []);

  useEffect(() => {
    if (!sharedSocket) {
      setIsConnected(false);
      setIsConnecting(isReconnecting);
      return;
    }

    const checkState = () => {
      setIsConnected(sharedSocket?.readyState === WebSocket.OPEN);
      setIsConnecting(
        sharedSocket?.readyState === WebSocket.CONNECTING || isReconnecting,
      );
    };

    const interval = setInterval(checkState, 500);
    checkState();

    return () => clearInterval(interval);
  }, []);

  const getAccountInfo = async (
    descriptor: string,
    options?: { details?: string; page?: number; pageSize?: number },
  ): Promise<any> => {
    if (!sharedSocket || sharedSocket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    // If we use xpub or ypub as is, Blockbook can asume BIP44 or BIP49 and return incorrect balance. Converting to zpub forces it to use BIP84 which is what we want for all our wallets. In a future we could change it to use descriptors, see https://github.com/trezor/blockbook/blob/master/docs/api.md#get-xpub
    const zpub = convertToZpub(descriptor);
    const params = {
      descriptor: zpub,
      details: options?.details || "basic",
      ...(options?.page && { page: options.page }),
      ...(options?.pageSize && { pageSize: options.pageSize }),
    };

    return sendRequest("getAccountInfo", params);
  };

  const subscribeToAddress = (
    addresses: string[],
    callback: (data: any) => void,
  ) => {
    if (!sharedSocket || sharedSocket.readyState !== WebSocket.OPEN) {
      devLog("[Blockbook WS] Cannot subscribe: not connected");
      return;
    }

    const subscriptionKey = addresses.join(",");
    subscriptionCallbacksRef.set(subscriptionKey, callback);
    activeSubscriptions.set(instanceIdRef.current, addresses);

    devLog("[Blockbook WS] Subscribing to addresses:", addresses);

    sendRequest("subscribeAddresses", { addresses })
      .then(() => devLog("[Blockbook WS] Subscribed"))
      .catch((err) => devLog("[Blockbook WS] Subscription error:", err));
  };

  const unsubscribeFromAddress = (addresses: string[]) => {
    if (!sharedSocket || sharedSocket.readyState !== WebSocket.OPEN) {
      devLog("[Blockbook WS] Cannot unsubscribe: not connected");
      return;
    }

    const subscriptionKey = addresses.join(",");
    subscriptionCallbacksRef.delete(subscriptionKey);
    activeSubscriptions.delete(instanceIdRef.current);

    devLog("[Blockbook WS] Unsubscribing from addresses:", addresses);

    sendRequest("unsubscribeAddresses", { addresses })
      .then(() => devLog("[Blockbook WS] Unsubscribed"))
      .catch((err) => devLog("[Blockbook WS] Unsubscription error:", err));
  };

  return {
    isConnected,
    isConnecting,
    error,
    getAccountInfo,
    subscribeToAddress,
    unsubscribeFromAddress,
  };
}
