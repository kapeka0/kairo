# Kairo — Project Overview

Kairo is a self-hosted platform for tracking crypto portfolios and analyzing blockchain wallets, built with privacy as a core principle.

The system prioritizes security, scalability, and reliability to ensure accurate and efficient crypto asset management.

---

## Architecture

- Blockchain data is indexed using **Blockbook (by Trezor)**.
- Blockbook documentation is available in `BLOCKBOOK-DOCS.md`.
- The system must remain **crypto and token agnostic**.
  No feature should be tightly coupled to a specific chain, token, or implementation detail.

---

## Engineering Principles

- Privacy-first design.
- Secure by default.
- Horizontally scalable architecture.
- Deterministic and reproducible behavior.
- Clear separation between indexing, domain logic, and presentation layers.

---

## Development Rules

- **PNPM** is the mandatory package manager for all dependencies and scripts.
- Code must not include inline comments.
- Avoid chain-specific assumptions.
- Design abstractions around assets, networks, and balances — not specific tokens.
