CREATE TYPE "public"."currencies" AS ENUM('USD', 'EUR', 'GBP', 'JPY', 'GBP', 'CNY');--> statement-breakpoint
CREATE TABLE "portfolio" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"gradient_url" text NOT NULL,
	"user_id" text NOT NULL,
	"currency" "currencies" DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;