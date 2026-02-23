import bs58check from "bs58check";
import type { BipType } from "@/lib/types";

const VERSION_BYTES = {
  mainnet: {
    xpub: 0x0488b21e,
    ypub: 0x049d7cb2,
    zpub: 0x04b24746,
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

export function toDescriptor(extendedKey: string, bipType: BipType): string {
  const prefix = extendedKey.slice(0, 4);

  if (prefix !== "xpub" && prefix !== "ypub" && prefix !== "zpub") {
    throw new Error("Extended key must be xpub, ypub, or zpub");
  }

  try {
    const decoded = Buffer.from(bs58check.decode(extendedKey));
    const currentVersion = decoded.readUInt32BE(0);
    const payload = decoded.subarray(4);

    const { xpub: xpubVersion, ypub: ypubVersion, zpub: zpubVersion } =
      VERSION_BYTES.mainnet;

    if (
      currentVersion !== xpubVersion &&
      currentVersion !== ypubVersion &&
      currentVersion !== zpubVersion
    ) {
      throw new Error("Invalid extended public key version");
    }

    const xpubVersionBuffer = Buffer.alloc(4);
    xpubVersionBuffer.writeUInt32BE(xpubVersion, 0);
    const normalizedXpub = bs58check.encode(
      Buffer.concat([xpubVersionBuffer, payload]),
    );

    switch (bipType) {
      case "BIP44":
        return `pkh(${normalizedXpub})`;
      case "BIP49":
        return `sh(wpkh(${normalizedXpub}))`;
      case "BIP86":
        return `tr(${normalizedXpub})`;
      default:
        return `wpkh(${normalizedXpub})`;
    }
  } catch (error) {
    throw new Error(
      `Failed to build descriptor: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
