# Money Units

## Overview
This project moved seed storage from USD-thousands to full USD in the database while preserving the same user-facing display in `$K`.

## Decision
- Database values are stored in full USD.
- UI/report display remains in `$K` formatting.
- The goal is deterministic storage semantics with unchanged visual UX.

## Implementation Details
- `prisma/seed.ts` derives `MONEY_SCALE` from DB name:
  - `finance_dashboard_seed_baseline` => scale `1` (baseline units)
  - any other DB => scale `1000` (full USD)
- `usdFullFromK(...)` is applied only at the persistence boundary (`createMany` payloads).
- Determinism hardening:
  - stable IDs for `DepartmentGroup` / `Department`
  - id-based jitter keys replaced with name-based jitter keys
- Format helpers for USD storage + `$K` display:
  - `formatUsdThousandsKFromUsd`
  - `formatUsdCompactFromUsd`
- Dashboard/reports/chart behavior: values are stored in USD and rendered as `$K`.

## Guardrails / Tests
- `npm run test:db` includes:
  - `src/server/guardrails/money-units-policy.test.ts`
  - `src/server/guardrails/seed-scale-invariance.test.ts`
- DB guardrails are gated by `RUN_DB_FINGERPRINT=1`.
- Invariance test behavior:
  - derives baseline DB URL by replacing `finance_dashboard` -> `finance_dashboard_seed_baseline`
  - if baseline DB is missing, test skips by default with a warning
  - set `RUN_SEED_INVARIANCE_STRICT=1` to fail on missing baseline DB

## Local Workflow
```bash
npm run db:up
```

```bash
DATABASE_URL="postgresql://finance:finance@localhost:5432/finance_dashboard_seed_baseline?schema=public" npm run db:reset
```

```bash
npm run db:reset
```

```bash
npm run test:db
```

## Operational Notes
This removes money-unit ambiguity for future FX/import work and prevents unit confusion between storage and presentation layers.

## Rollback / Migration Notes
If rollback is required, revert the money-unit change and reseed. Do not mix baseline-unit and full-USD datasets in the same database.
