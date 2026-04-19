CREATE TABLE "address_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"address" text NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "address_tag_portfolio_address_unique" UNIQUE("portfolio_id","address")
);
--> statement-breakpoint
ALTER TABLE "bitcoin_wallet" ADD COLUMN "token_type" text DEFAULT 'BTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "bitcoin_wallet" ADD COLUMN "bip_type" text DEFAULT 'BIP84' NOT NULL;--> statement-breakpoint
ALTER TABLE "address_tag" ADD CONSTRAINT "address_tag_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "address_tag_portfolioId_idx" ON "address_tag" USING btree ("portfolio_id");--> statement-breakpoint
ALTER TABLE "bitcoin_wallet" DROP COLUMN "derivation_path";--> statement-breakpoint
ALTER TABLE "bitcoin_wallet" DROP COLUMN "last_balance";--> statement-breakpoint
ALTER TABLE "bitcoin_wallet" DROP COLUMN "balance_updated_at";--> statement-breakpoint
ALTER TABLE "portfolio" DROP COLUMN "last_balance";--> statement-breakpoint
ALTER TABLE "portfolio" DROP COLUMN "balance_updated_at";