<p align="center">
  <img src="/public/images/logos/logo-square-light.svg" width="200" />
</p>

# Kairo

Kairo is a **privacy-first, self-hosted** crypto portfolio tracker. Keep your keys, your node, and your data under your own control.

Track multiple portfolios, wallets and tokens without exposing your XPUB to third-party vendors.

**Currently supported:**

- Bitcoin

---

## Requirements

- Docker and Docker Compose
- A Blockbook endpoint (see [Blockbook setup](#blockbook) below)

---

## Quick start (Docker)

```bash
git clone https://github.com/<your-fork>/kairo.git
cd kairo
cp .env.example .env
# edit .env with your values
docker compose up -d --build
```

Open <http://localhost:3000> and create your account.

The compose stack spins up:

- `postgres` — database
- `migrate` — runs `pnpm db:generate && pnpm db:migrate` once at startup
- `kairo` — the Next.js app on port `3000`

To stop everything:

```bash
docker compose down
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable                             | Required | Description                                    |
| ------------------------------------ | -------- | ---------------------------------------------- |
| `DB_HOST`                            | yes      | Postgres host (`postgres` inside compose)      |
| `DB_PORT`                            | yes      | Postgres port (default `5432`)                 |
| `POSTGRES_USER`                      | yes      | Postgres user                                  |
| `POSTGRES_PASSWORD`                  | yes      | Postgres password                              |
| `POSTGRES_DB`                        | yes      | Database name (default `kairo`)                |
| `BETTER_AUTH_SECRET`                 | yes      | Auth signing key (min. 20 chars, random)       |
| `NEXT_PUBLIC_URL`                    | yes      | Public base URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_BTC_HTTP_BLOCKBOOK_URL` | yes      | HTTP URL of your Blockbook instance            |

Generate a strong secret:

```bash
openssl rand -hex 32
```

---

## Local development

Requires **pnpm** (mandatory).

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm dev
```

App runs at <http://localhost:3000>.

---

## Blockbook

Kairo needs a Blockbook HTTP endpoint to index blockchain data. Blockbook is not bundled with this repo — set it up separately and point `NEXT_PUBLIC_BTC_HTTP_BLOCKBOOK_URL` at it.

If you trust Trezor, you can start with their public Blockbook endpoints (used by Trezor Suite frontend) such as **https://btc.trezor.io**, but this will expose your master public keys to a third party. A self-hosted Blockbook instance is recommended.

For setup and self-hosting instructions, see the official project: **<https://github.com/trezor/blockbook>**.
