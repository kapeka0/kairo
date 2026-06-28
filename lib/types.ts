import type { Session, User as UserBO } from "better-auth";

export type User = UserBO;

export interface AuthActionContext {
  user: UserBO;
  session: Session;
}

export interface ActionMetadata {
  actionName: string;
}

export type Portfolio = {
  id: string;
  name: string;
  gradientUrl: string;
  userId: string;
  currency: "USD" | "EUR" | "GBP" | "JPY" | "CNY";
  createdAt: Date;
  updatedAt: Date;
};
export enum TokenType {
  BTC = "BTC",
  ETH = "ETH",
}

export type BipType = "BIP44" | "BIP49" | "BIP84" | "BIP86";

export type Erc20Token = {
  type: string;
  name: string;
  symbol: string;
  contract: string;
  decimals: number;
  balance: string;
};

export type Wallet = {
  id: string;
  walletId: string;
  name: string;
  gradientUrl: string;
  icon: string | null;
  publicKey: string;
  bipType?: string | null;
  portfolioId: string;
  lastBalanceInTokens?: string;
  erc20Tokens?: Erc20Token[];
  createdAt: Date;
  updatedAt: Date;
  tokenType: TokenType;
};

export type PhysicalWallet = {
  id: string;
  name: string;
  gradientUrl: string;
  icon: string | null;
  portfolioId: string;
  assets: Wallet[];
};

export type PortfoliosResponse = Portfolio[];

export type Period = "7d" | "30d" | "90d" | "180d" | "365d";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CNY";

export type ExchangeRates = Record<CurrencyCode, number>;

export interface FrankfurterResponse {
  amount: number;
  base: CurrencyCode;
  date: string;
  rates: Partial<Record<CurrencyCode, number>>;
}

export interface FrankfurterTimeSeriesResponse {
  base: CurrencyCode;
  start_date: string;
  end_date: string;
  rates: Record<string, Partial<Record<CurrencyCode, number>>>;
}
