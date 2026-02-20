# Consolidation & FX Roadmap

## Goals

- Support multi-entity consolidation (parent + subsidiaries) while preserving current single-entity behavior.
- Keep finance engine extractable (pure domain logic + stable DTO contracts).
- No FX logic in UI. UI never computes FX or currency conversions.
- Maintain determinism and guardrails (seed invariance, stable aggregation semantics).

## Non-goals (for initial phases)

- No UI changes for consolidation selection yet.
- No intercompany eliminations implementation yet (design only).
- No FX conversion behavior changes in Phase 1 (schema/infrastructure only).

---

## Current baseline dataset

The current seeded dataset represents a consolidated (already-unified) baseline view.  
It is not yet ingesting per-entity subsidiary source inputs for consolidation processing.  
Future phases will ingest entity-level inputs and compute consolidated outputs (and later eliminations), while preserving current `single(primary)` behavior until explicitly enabled.

---

## Consolidation vs FX scope

Consolidation assumes USD inputs and operates on USD-normalized datasets.  
FX is used for per-entity currency analytics and reporting views.  
FX does not alter consolidation logic or consolidation mechanics.

---

## Entity Model

We introduce an explicit Entity dimension.

### Entity
- `id` (stable slug; contract-safe identifier)
- `name`
- `parentId` (nullable; defines consolidation tree)
- `functionalCurrency` (ISO 4217, e.g. USD/EUR)
- `isActive`

### Consolidation Scope
- `single`: one entity (default: primary entity)
- `consolidated`: root entity + all descendants (future selection; default remains single)

Key invariant:
- When scope = `single(primary)`, outputs MUST remain identical to the current baseline.

---

## FX Model (Infrastructure)

FX data is reference data. It is loaded via repository/adapters, never via UI logic.

### FxMonthlyRate
- `month` (YYYY-MM)
- `fromCurrency`
- `toCurrency` (reporting currency)
- `rateType` (`AVG` | `EOM`)
- `rate`

Planned semantics:
- Income Statement: `AVG`
- Balance Sheet: `EOM`
- Cash Flow: TBD (documented explicitly when implemented)

---

## Aggregation Pipeline (Future-ready)

Current engine remains single entrypoint. The pipeline becomes entity-aware:

1. Load facts with filters: `period`, `entityIds[]` (default `[primary]`)
2. Partition by entity (enables eliminations later)
3. (Future) Apply FX conversion: functional → reporting (by month + rateType)
4. Aggregate to report lines using existing rules/config
5. Build report models (Income Statement / BvA / Balance Sheet / Cash Flow)

Intercompany eliminations (future):
- Applied after partitioning and before final aggregation.
- Requires explicit matching keys/mapping (not implemented in initial phases).

---

## Database Strategy (Phased)

### Phase 1 (Additive / No behavior change)
- Add `Entity` table.
- Add `entityId` to all fact tables used by the finance engine.
- Backfill all existing rows with the `primary` entityId.
- Optional: introduce `FxMonthlyRate` table with no runtime usage yet.

Invariant:
- With `entityId = primary` everywhere, all report outputs remain unchanged.

### Phase 2 (Structural / Consolidation-ready)
- Introduce `entityScope` param to engine use-cases:
  - `single(entityId)`
  - `consolidated(rootEntityId)`
- Resolve `entityIds[]` in repository layer; engine remains extractable and Prisma-free.

### Phase 3 (FX behavior)
- Add currency semantics (controlled):
  - facts may gain `currencyCode` (default = entity functional currency)
- Engine applies FX conversion only when functional ≠ reporting currency.
- Identity guarantee:
  - If functional == reporting, FX step must be a strict no-op (bit-for-bit parity).

---

## Guardrails Impact

- DB fingerprint guardrails must be updated for schema changes (new tables/columns).
- Add parity guardrail:
  - `single(primary)` must match baseline outputs exactly.
- Determinism must hold:
  - Stable ordering, stable rounding rules, and stable FX rate selection when implemented.
- Config coverage guardrails must remain intact; consolidation must not create divergent rule paths.

---

## Migration & Reversibility

Migration approach:
- Additive schema changes + deterministic backfill to primary entity.
- Default scope remains `single(primary)`.

Reversibility:
- Phase 1 is highly reversible (additive + backfill; can rollback migration if needed).
- Phase 3 (FX behavior) may require feature-flag style activation to allow safe rollback.

---

## Extraction Impact

- Engine contracts evolve via DTO params (`entityScope`, `reportingCurrency`), not via Prisma.
- Data access stays in server repository/adapters.
- Finance domain logic remains in `src/lib/finance` only.
