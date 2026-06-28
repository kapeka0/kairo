CREATE TABLE "bitcoin_wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"gradient_url" text NOT NULL,
	"icon" text,
	"public_key" text NOT NULL,
	"derivation_path" text NOT NULL,
	"portfolio_id" text NOT NULL,
	"last_balance" text DEFAULT '0' NOT NULL,
	"balance_updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portfolio" ADD COLUMN "last_balance" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio" ADD COLUMN "balance_updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "bitcoin_wallet" ADD CONSTRAINT "bitcoin_wallet_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;