import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { generateUUID } from "../utils";

export const user = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$default(() => generateUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  portfolios: many(portfolio),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const currenciesEnum = pgEnum("currencies", [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
]);

export const portfolio = pgTable("portfolio", {
  id: text("id")
    .primaryKey()
    .$default(() => generateUUID()),
  name: text("name").notNull(),
  gradientUrl: text("gradient_url").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  currency: currenciesEnum("currency").notNull().default("USD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastBalanceInCurrency: text("last_balance_in_currency")
    .notNull()
    .default("0"),
  lastBalanceInCurrencyUpdatedAt: timestamp("balance_in_currency_updated_at")
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const bitcoinWallet = pgTable("bitcoin_wallet", {
  id: text("id")
    .primaryKey()
    .$default(() => generateUUID()),
  name: text("name").notNull(),
  tokenType: text("token_type").notNull().default("BTC"),
  gradientUrl: text("gradient_url").notNull(),
  icon: text("icon"),
  publicKey: text("public_key").notNull(),
  derivationPath: text("derivation_path").notNull(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => portfolio.id, { onDelete: "cascade" }),
  lastBalanceInSatoshis: text("last_balance_in_satoshis")
    .notNull()
    .default("0"),
  lastBalanceInSatoshisUpdatedAt: timestamp("balance_in_satoshis_updated_at")
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const portfolioRelations = relations(portfolio, ({ one, many }) => ({
  user: one(user, {
    fields: [portfolio.userId],
    references: [user.id],
  }),
  bitcoinWallets: many(bitcoinWallet),
}));

export const bitcoinWalletRelations = relations(
  bitcoinWallet,
  ({ one, many }) => ({
    portfolio: one(portfolio, {
      fields: [bitcoinWallet.portfolioId],
      references: [portfolio.id],
    }),
    transactions: many(bitcoinTransaction),
  }),
);

export const bitcoinTransactionTypeEnum = pgEnum("bitcoin_transaction_type", [
  "received",
  "sent",
  "internal",
]);

export const bitcoinTransaction = pgTable(
  "bitcoin_transaction",
  {
    id: text("id")
      .primaryKey()
      .$default(() => generateUUID()),
    walletId: text("wallet_id")
      .notNull()
      .references(() => bitcoinWallet.id, { onDelete: "cascade" }),
    txid: text("txid").notNull(),
    blockHeight: text("block_height"),
    confirmations: text("confirmations").notNull().default("0"),
    blockTime: timestamp("block_time"),
    type: bitcoinTransactionTypeEnum("type").notNull(),
    amountInSatoshis: text("amount_in_satoshis").notNull(),
    feeInSatoshis: text("fee_in_satoshis"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("bitcoin_transaction_walletId_idx").on(table.walletId),
    index("bitcoin_transaction_txid_idx").on(table.txid),
  ],
);

export const bitcoinTransactionRelations = relations(
  bitcoinTransaction,
  ({ one }) => ({
    wallet: one(bitcoinWallet, {
      fields: [bitcoinTransaction.walletId],
      references: [bitcoinWallet.id],
    }),
  }),
);
