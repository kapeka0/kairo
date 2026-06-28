CREATE TABLE "wallet" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "gradient_url" text NOT NULL,
    "icon" text,
    "portfolio_id" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "wallet_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE "wallet_asset" (
    "id" text PRIMARY KEY NOT NULL,
    "wallet_id" text NOT NULL,
    "token_type" text NOT NULL,
    "public_key" text NOT NULL,
    "bip_type" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "wallet_asset_wallet_id_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

INSERT INTO "wallet" ("id", "name", "gradient_url", "icon", "portfolio_id", "created_at", "updated_at")
SELECT "id", "name", "gradient_url", "icon", "portfolio_id", "created_at", "updated_at"
FROM "bitcoin_wallet";

INSERT INTO "wallet_asset" ("id", "wallet_id", "token_type", "public_key", "bip_type", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "id", "token_type", "public_key", "bip_type", "created_at", "updated_at"
FROM "bitcoin_wallet";

INSERT INTO "wallet" ("id", "name", "gradient_url", "icon", "portfolio_id", "created_at", "updated_at")
SELECT "id", "name", "gradient_url", "icon", "portfolio_id", "created_at", "updated_at"
FROM "ethereum_wallet";

INSERT INTO "wallet_asset" ("id", "wallet_id", "token_type", "public_key", "bip_type", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "id", "token_type", "public_key", NULL, "created_at", "updated_at"
FROM "ethereum_wallet";

DROP TABLE IF EXISTS "bitcoin_wallet";
DROP TABLE IF EXISTS "ethereum_wallet";
