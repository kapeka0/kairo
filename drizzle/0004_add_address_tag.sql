DROP TABLE IF EXISTS "bitcoin_transaction" CASCADE;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."bitcoin_transaction_type";--> statement-breakpoint
ALTER TABLE "portfolio" DROP COLUMN IF EXISTS "last_balance";--> statement-breakpoint
ALTER TABLE "portfolio" DROP COLUMN IF EXISTS "balance_updated_at";--> statement-breakpoint
ALTER TABLE "bitcoin_wallet" DROP COLUMN IF EXISTS "derivation_path";--> statement-breakpoint
ALTER TABLE "bitcoin_wallet" ADD COLUMN IF NOT EXISTS "token_type" text NOT NULL DEFAULT 'BTC';--> statement-breakpoint
ALTER TABLE "bitcoin_wallet" RENAME COLUMN "last_balance" TO "last_balance_in_satoshis";--> statement-breakpoint
ALTER TABLE "bitcoin_wallet" RENAME COLUMN "balance_updated_at" TO "balance_in_satoshis_updated_at";--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "address_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"address" text NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "address_tag_portfolio_address_unique" UNIQUE("portfolio_id","address")
);
--> statement-breakpoint
ALTER TABLE "address_tag" ADD CONSTRAINT "address_tag_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "address_tag_portfolioId_idx" ON "address_tag" USING btree ("portfolio_id");
