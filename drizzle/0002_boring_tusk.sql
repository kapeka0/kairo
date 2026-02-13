ALTER TABLE "portfolio" ALTER COLUMN "currency" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "portfolio" ALTER COLUMN "currency" SET DEFAULT 'USD'::text;--> statement-breakpoint
DROP TYPE "public"."currencies";--> statement-breakpoint
CREATE TYPE "public"."currencies" AS ENUM('USD', 'EUR', 'GBP', 'JPY', 'CNY');--> statement-breakpoint
ALTER TABLE "portfolio" ALTER COLUMN "currency" SET DEFAULT 'USD'::"public"."currencies";--> statement-breakpoint
ALTER TABLE "portfolio" ALTER COLUMN "currency" SET DATA TYPE "public"."currencies" USING "currency"::"public"."currencies";