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
  lastBalance: string;
  balanceUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PortfoliosResponse = Portfolio[];
