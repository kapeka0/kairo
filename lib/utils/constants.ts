import { IconDefinition } from "@/components/IconPicker";
import { client_env } from "../env/client";

export const BASE_IMAGE_URL = client_env.NEXT_PUBLIC_URL + "/api/avatar?name=";

// Updating this list requires updating the `currencies` enum in `lib/db/schema.ts` and the `currency` field in the `portfolio` table
export const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "GBP", label: "GBP - British Pound", symbol: "£" },
  { value: "JPY", label: "JPY - Japanese Yen", symbol: "¥" },
  { value: "CNY", label: "CNY - Chinese Yuan", symbol: "¥" },
] as const;

export const SUPPORTED_CRYPTOCURRENCIES = [
  { value: "BTC", logo: "/images/logos/crypto/btc.svg", label: "Bitcoin" },
];

export const WALLET_ICONS: IconDefinition[] = [
  {
    name: "Bybit",
    src: "/images/logos/crypto/bybit.svg",
  },
  {
    name: "Kucoin",
    src: "/images/logos/crypto/kucoin.jpeg",
  },
  {
    name: "Kraken",
    src: "/images/logos/crypto/kraken.jpeg",
  },
  {
    name: "Coinbase",
    src: "/images/logos/crypto/coinbase.svg",
  },
  {
    name: "Binance",
    src: "/images/logos/crypto/binance.svg",
  },
  {
    name: "Ledger",
    src: "/images/logos/crypto/ledger.jpeg",
  },
  {
    name: "Trezor",
    src: "/images/logos/crypto/trezor.jpeg",
  },
  {
    name: "MetaMask",
    src: "/images/logos/crypto/metamask.svg",
  },
  {
    name: "Trust Wallet",
    src: "/images/logos/crypto/trust-wallet.svg",
  },
  {
    name: "Bitcoin",
    src: "/images/logos/crypto/btc.svg",
  },
  {
    name: "Ethereum",
    src: "/images/logos/crypto/eth.svg",
  },
  {
    name: "Tether",
    src: "/images/logos/crypto/usdt.svg",
  },
  {
    name: "USD Coin",
    src: "/images/logos/crypto/usdc.svg",
  },
  {
    name: "Binance Coin",
    src: "/images/logos/crypto/bnb.svg",
  },
  {
    name: "Ripple",
    src: "/images/logos/crypto/xrp.svg",
  },
  {
    name: "Cardano",
    src: "/images/logos/crypto/ada.svg",
  },
  {
    name: "Solana",
    src: "/images/logos/crypto/sol.svg",
  },
  {
    name: "Dogecoin",
    src: "/images/logos/crypto/doge.svg",
  },
  {
    name: "Polkadot",
    src: "/images/logos/crypto/dot.svg",
  },
  {
    name: "Polygon",
    src: "/images/logos/crypto/matic.svg",
  },
  {
    name: "Litecoin",
    src: "/images/logos/crypto/ltc.svg",
  },
  {
    name: "Bitcoin Cash",
    src: "/images/logos/crypto/bch.svg",
  },
  {
    name: "Chainlink",
    src: "/images/logos/crypto/link.svg",
  },
  {
    name: "Avalanche",
    src: "/images/logos/crypto/avax.svg",
  },
  {
    name: "Stellar",
    src: "/images/logos/crypto/xlm.svg",
  },
  {
    name: "Uniswap",
    src: "/images/logos/crypto/uni.svg",
  },
  {
    name: "Monero",
    src: "/images/logos/crypto/xmr.svg",
  },
  {
    name: "Cosmos",
    src: "/images/logos/crypto/atom.svg",
  },
  {
    name: "Ethereum Classic",
    src: "/images/logos/crypto/etc.svg",
  },
  {
    name: "Filecoin",
    src: "/images/logos/crypto/fil.svg",
  },
  {
    name: "Tron",
    src: "/images/logos/crypto/trx.svg",
  },
  {
    name: "Shiba Inu",
    src: "/images/logos/crypto/shib.svg",
  },
  {
    name: "Dai",
    src: "/images/logos/crypto/dai.svg",
  },
  {
    name: "Aave",
    src: "/images/logos/crypto/aave.svg",
  },
  {
    name: "VeChain",
    src: "/images/logos/crypto/vet.svg",
  },
  {
    name: "Algorand",
    src: "/images/logos/crypto/algo.svg",
  },
  {
    name: "Tezos",
    src: "/images/logos/crypto/xtz.svg",
  },
  {
    name: "EOS",
    src: "/images/logos/crypto/eos.svg",
  },
  {
    name: "Maker",
    src: "/images/logos/crypto/mkr.svg",
  },
  {
    name: "NEO",
    src: "/images/logos/crypto/neo.svg",
  },
  {
    name: "IOTA",
    src: "/images/logos/crypto/iota.svg",
  },
  {
    name: "Dash",
    src: "/images/logos/crypto/dash.svg",
  },
  {
    name: "Zcash",
    src: "/images/logos/crypto/zec.svg",
  },
  {
    name: "Compound",
    src: "/images/logos/crypto/comp.svg",
  },
  {
    name: "yearn.finance",
    src: "/images/logos/crypto/yfi.svg",
  },
  {
    name: "SushiSwap",
    src: "/images/logos/crypto/sushi.svg",
  },
  {
    name: "PancakeSwap",
    src: "/images/logos/crypto/cake.svg",
  },
  {
    name: "Curve",
    src: "/images/logos/crypto/crv.svg",
  },
  {
    name: "Synthetix",
    src: "/images/logos/crypto/snx.svg",
  },
];
