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
    name: "Exodus",
    src: "/images/logos/crypto/exodus.svg",
  },
  {
    name: "Phantom",
    src: "/images/logos/crypto/phantom.jpeg",
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
    tags: ["BTC"],
  },
  {
    name: "Ethereum",
    src: "/images/logos/crypto/eth.svg",
    tags: ["ETH"],
  },
  {
    name: "Tether",
    src: "/images/logos/crypto/usdt.svg",
    tags: ["USDT"],
  },
  {
    name: "USD Coin",
    src: "/images/logos/crypto/usdc.svg",
    tags: ["USDC"],
  },
  {
    name: "Binance Coin",
    src: "/images/logos/crypto/bnb.svg",
    tags: ["BNB"],
  },
  {
    name: "Ripple",
    src: "/images/logos/crypto/xrp.svg",
    tags: ["XRP"],
  },
  {
    name: "Cardano",
    src: "/images/logos/crypto/ada.svg",
    tags: ["ADA"],
  },
  {
    name: "Solana",
    src: "/images/logos/crypto/sol.svg",
    tags: ["SOL"],
  },
  {
    name: "Dogecoin",
    src: "/images/logos/crypto/doge.svg",
    tags: ["DOGE"],
  },
  {
    name: "Polkadot",
    src: "/images/logos/crypto/dot.svg",
    tags: ["DOT"],
  },
  {
    name: "Polygon",
    src: "/images/logos/crypto/matic.svg",
    tags: ["MATIC", "POL"],
  },
  {
    name: "Litecoin",
    src: "/images/logos/crypto/ltc.svg",
    tags: ["LTC"],
  },
  {
    name: "Bitcoin Cash",
    src: "/images/logos/crypto/bch.svg",
    tags: ["BCH"],
  },
  {
    name: "Chainlink",
    src: "/images/logos/crypto/link.svg",
    tags: ["LINK"],
  },
  {
    name: "Avalanche",
    src: "/images/logos/crypto/avax.svg",
    tags: ["AVAX"],
  },
  {
    name: "Stellar",
    src: "/images/logos/crypto/xlm.png",
    tags: ["XLM"],
  },
  {
    name: "Uniswap",
    src: "/images/logos/crypto/uni.svg",
    tags: ["UNI"],
  },
  {
    name: "Monero",
    src: "/images/logos/crypto/xmr.svg",
    tags: ["XMR"],
  },
  {
    name: "Cosmos",
    src: "/images/logos/crypto/atom.svg",
    tags: ["ATOM"],
  },
  {
    name: "Ethereum Classic",
    src: "/images/logos/crypto/etc.svg",
    tags: ["ETC"],
  },
  {
    name: "Filecoin",
    src: "/images/logos/crypto/fil.svg",
    tags: ["FIL"],
  },
  {
    name: "Tron",
    src: "/images/logos/crypto/trx.svg",
    tags: ["TRX"],
  },
  {
    name: "Shiba Inu",
    src: "/images/logos/crypto/shib.svg",
    tags: ["SHIB"],
  },
  {
    name: "Dai",
    src: "/images/logos/crypto/dai.svg",
    tags: ["DAI"],
  },
  {
    name: "Aave",
    src: "/images/logos/crypto/aave.svg",
    tags: ["AAVE"],
  },
  {
    name: "VeChain",
    src: "/images/logos/crypto/vet.svg",
    tags: ["VET"],
  },
  {
    name: "Algorand",
    src: "/images/logos/crypto/algo.jpeg",
    tags: ["ALGO"],
  },
  {
    name: "Tezos",
    src: "/images/logos/crypto/xtz.svg",
    tags: ["XTZ"],
  },
  {
    name: "EOS",
    src: "/images/logos/crypto/eos.svg",
    tags: ["EOS"],
  },
  {
    name: "Maker",
    src: "/images/logos/crypto/mkr.svg",
    tags: ["MKR"],
  },
  {
    name: "NEO",
    src: "/images/logos/crypto/neo.svg",
    tags: ["NEO"],
  },
  {
    name: "IOTA",
    src: "/images/logos/crypto/iota.png",
    tags: ["IOTA", "MIOTA"],
  },
  {
    name: "Dash",
    src: "/images/logos/crypto/dash.svg",
    tags: ["DASH"],
  },
  {
    name: "Zcash",
    src: "/images/logos/crypto/zec.svg",
    tags: ["ZEC"],
  },
  {
    name: "Compound",
    src: "/images/logos/crypto/comp.svg",
    tags: ["COMP"],
  },
  {
    name: "yearn.finance",
    src: "/images/logos/crypto/yfi.svg",
    tags: ["YFI"],
  },
  {
    name: "SushiSwap",
    src: "/images/logos/crypto/sushi.svg",
    tags: ["SUSHI"],
  },
  {
    name: "PancakeSwap",
    src: "/images/logos/crypto/cake.svg",
    tags: ["CAKE"],
  },
  {
    name: "Curve",
    src: "/images/logos/crypto/crv.svg",
    tags: ["CRV"],
  },
  {
    name: "Synthetix",
    src: "/images/logos/crypto/snx.svg",
    tags: ["SNX"],
  },
  {
    name: "Wrapped Bitcoin",
    src: "/images/logos/crypto/wbtc.svg",
    tags: ["WBTC"],
  },
  {
    name: "Near Protocol",
    src: "/images/logos/crypto/near.jpeg",
    tags: ["NEAR"],
  },
  {
    name: "Internet Computer",
    src: "/images/logos/crypto/icp.svg",
    tags: ["ICP"],
  },
  {
    name: "The Graph",
    src: "/images/logos/crypto/grt.jpeg",
    tags: ["GRT"],
  },
  {
    name: "Flow",
    src: "/images/logos/crypto/flow.svg",
    tags: ["FLOW"],
  },
  {
    name: "Hedera",
    src: "/images/logos/crypto/hbar.jpeg",
    tags: ["HBAR"],
  },
  {
    name: "Theta Network",
    src: "/images/logos/crypto/theta.svg",
    tags: ["THETA"],
  },
  {
    name: "1inch",
    src: "/images/logos/crypto/1inch.svg",
    tags: ["1INCH"],
  },
  {
    name: "Quant",
    src: "/images/logos/crypto/qnt.svg",
    tags: ["QNT"],
  },
  {
    name: "Kusama",
    src: "/images/logos/crypto/ksm.svg",
    tags: ["KSM"],
  },
];
