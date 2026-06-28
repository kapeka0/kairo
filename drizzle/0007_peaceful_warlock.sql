CREATE TABLE "ethereum_wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"token_type" text DEFAULT 'ETH' NOT NULL,
	"gradient_url" text NOT NULL,
	"icon" text,
	"public_key" text NOT NULL,
	"portfolio_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ethereum_wallet" ADD CONSTRAINT "ethereum_wallet_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;