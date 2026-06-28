export interface Erc20Metadata {
  coingeckoId: string;
  logoPath: string;
  name: string;
}

export const ERC20_METADATA: Record<string, Erc20Metadata> = {
  USDC: { coingeckoId: "usd-coin", logoPath: "/images/logos/crypto/usdc.svg", name: "USD Coin" },
  USDT: { coingeckoId: "tether", logoPath: "/images/logos/crypto/usdt.svg", name: "Tether" },
  DAI: { coingeckoId: "dai", logoPath: "/images/logos/crypto/dai.svg", name: "Dai" },
  WBTC: { coingeckoId: "wrapped-bitcoin", logoPath: "/images/logos/crypto/wbtc.svg", name: "Wrapped Bitcoin" },
  LINK: { coingeckoId: "chainlink", logoPath: "/images/logos/crypto/link.svg", name: "Chainlink" },
  UNI: { coingeckoId: "uniswap", logoPath: "/images/logos/crypto/uni.svg", name: "Uniswap" },
  AAVE: { coingeckoId: "aave", logoPath: "/images/logos/crypto/aave.svg", name: "Aave" },
  MKR: { coingeckoId: "maker", logoPath: "/images/logos/crypto/mkr.svg", name: "Maker" },
  CRV: { coingeckoId: "curve-dao-token", logoPath: "/images/logos/crypto/crv.svg", name: "Curve" },
  SHIB: { coingeckoId: "shiba-inu", logoPath: "/images/logos/crypto/shib.svg", name: "Shiba Inu" },
};

export function getErc20Metadata(symbol: string): Erc20Metadata | undefined {
  return ERC20_METADATA[symbol.toUpperCase()];
}
