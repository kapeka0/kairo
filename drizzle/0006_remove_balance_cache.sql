ALTER TABLE "bitcoin_wallet" DROP COLUMN IF EXISTS "last_balance_in_satoshis";--> statement-breakpoint
ALTER TABLE "bitcoin_wallet" DROP COLUMN IF EXISTS "balance_in_satoshis_updated_at";
