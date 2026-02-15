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

export type Wallet = {
  id: string;
  name: string;
  gradientUrl: string;
  icon: string | null;
  publicKey: string;
  portfolioId: string;
  lastBalanceInTokens: string;
  lastBalanceInTokensUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  tokenType: TokenType;
};

export type BitcoinWallet = {
  id: string;
  name: string;
  gradientUrl: string;
  icon: string | null;
  publicKey: string;
  portfolioId: string;
  lastBalanceInSatoshis: string;
  lastBalanceInSatoshisUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  tokenType: TokenType.BTC;
};

export type PortfoliosResponse = Portfolio[];
