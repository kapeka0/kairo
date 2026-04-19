"use client";

import ScreenLoader from "@/components/global/ScreenLoader";
import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";

export default function LogOutPage() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await authClient.signOut();
      } finally {
        if (!cancelled) {
          window.location.href = "/";
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <ScreenLoader />;
}
