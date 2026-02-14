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
  lastBalanceInCurrency: string;
  lastBalanceInCurrencyUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type BitcoinWallet = {
  id: string;
  name: string;
  gradientUrl: string;
  icon: string | null;
  publicKey: string;
  derivationPath: string;
  portfolioId: string;
  lastBalanceInSatoshis: string;
  lastBalanceInSatoshisUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PortfoliosResponse = Portfolio[];
