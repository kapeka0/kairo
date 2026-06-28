import BitcoinWalletForm from "./BitcoinWalletForm";
import EthereumWalletForm from "./EthereumWalletForm";

export const CRYPTO_FORM_MAP = {
  BTC: BitcoinWalletForm,
  ETH: EthereumWalletForm,
} as const;

export type CryptoType = keyof typeof CRYPTO_FORM_MAP;
