import bs58check from "bs58check";

const VERSION_BYTES = {
  mainnet: {
    xpub: 0x0488b21e, // P2PKH/P2SH
    ypub: 0x049d7cb2, // P2SH/SegWit
    zpub: 0x04b24746, // P2WPKH/SegWit native
  },
};

const SATOSHIS_PER_BTC = 100_000_000;

export function satoshisToBtc(satoshis: string | number): number {
  const satoshisNum =
    typeof satoshis === "string" ? parseFloat(satoshis) : satoshis;
  return satoshisNum / SATOSHIS_PER_BTC;
}

export function formatBtc(btc: number, decimals: number = 8): string {
  return btc.toFixed(decimals);
}

export function convertToZpub(extendedKey: string): string {
  if (extendedKey.startsWith("zpub")) {
    return extendedKey;
  }

  if (!extendedKey.startsWith("xpub") && !extendedKey.startsWith("ypub")) {
    throw new Error("Extended key must be xpub, ypub, or zpub");
  }

  try {
    const decoded = Buffer.from(bs58check.decode(extendedKey));
    // Extract version bytes and payload
    const versionBytes = decoded.subarray(0, 4);
    const payload = decoded.subarray(4);

    const xpubVersion = VERSION_BYTES.mainnet.xpub;
    const ypubVersion = VERSION_BYTES.mainnet.ypub;
    const zpubVersion = VERSION_BYTES.mainnet.zpub;

    // Read decimal version from the first 4 bytes
    const currentVersion = versionBytes.readUInt32BE(0);

    if (
      currentVersion !== xpubVersion &&
      currentVersion !== ypubVersion &&
      currentVersion !== zpubVersion
    ) {
      throw new Error("Invalid extended public key version");
    }

    const zpubVersionBuffer = Buffer.alloc(4);
    zpubVersionBuffer.writeUInt32BE(zpubVersion, 0);

    const zpubPayload = Buffer.concat([zpubVersionBuffer, payload]);

    return bs58check.encode(zpubPayload);
  } catch (error) {
    throw new Error(
      `Failed to convert to zpub: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
