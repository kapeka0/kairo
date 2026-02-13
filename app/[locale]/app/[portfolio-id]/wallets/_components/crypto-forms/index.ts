import BitcoinWalletForm from "./BitcoinWalletForm";

export const CRYPTO_FORM_MAP = {
  BTC: BitcoinWalletForm,
} as const;

export type CryptoType = keyof typeof CRYPTO_FORM_MAP;
