<p align="center">
  <img src="/public/images/logos/logo-square-light.svg" width="120" />
</p>

<h1 align="center">Kairo</h1>

Kairo is a **privacy-first, self-hosted** crypto portfolio tracker. Keep your keys, your node, and your data under your own control.

Track multiple portfolios, wallets and tokens without exposing your XPUB to third-party vendors.

**Currently supported:**

- Bitcoin

---

## Requirements

- Node.js +20 or Docker
- A reachable PostgreSQL 14+ instance
- A Blockbook endpoint (see [Blockbook](#blockbook) below)

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable                             | Required | Description                                    |
| ------------------------------------ | -------- | ---------------------------------------------- |
| `DB_HOST`                            | yes      | Host of your Postgres instance                 |
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

`DB_HOST` must point to a Postgres instance reachable from the container. If Postgres runs on the Docker host machine, use `host.docker.internal` on Docker Desktop, or pass `--add-host=host.docker.internal:host-gateway` on Linux.

---

## 1. Configure `.env`

```bash
git clone https://github.com/<your-fork>/kairo.git
cd kairo
cp .env.example .env
# edit .env with your values
```

---

## 2. Run database migrations

Create an empty database on your Postgres instance matching `POSTGRES_DB`, then apply the schema.

**Option A — locally (requires pnpm + Node 22):**

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
```

**Option B — in Docker (no local Node needed):**

```bash
docker build --target migrator -t kairo-migrator .
docker run --rm --env-file .env kairo-migrator
```

---

## 3. Build and run the app

```bash
docker build -t kairo .
docker run -d -p 3000:3000 --env-file .env --name kairo kairo
```

Open <http://localhost:3000> and create your account.

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
