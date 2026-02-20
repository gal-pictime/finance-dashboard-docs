# Consolidation ADR Log

## 1. Purpose
This ADR log records consolidation architecture decisions that are binding for implementation and review. It complements [consolidation-architecture.md](./consolidation-architecture.md), [consolidation-db-schema.md](./consolidation-db-schema.md), and [consolidation-infrastructure-decision.md](./consolidation-infrastructure-decision.md).

## ADR-001 — CanonicalEntry as single source of truth
### Context
IL and US source systems differ, and manual consolidation is not reproducible.

### Decision
All financial outputs must derive from `CanonicalEntry`; no report reads raw source rows directly.

### Consequences
1. Positive: one auditable transformation chain.
2. Positive: cross-report consistency by design.
3. Constraint: every source import requires explicit mapping coverage.

## ADR-002 — Month-atomic period model
### Context
Consolidation cycles require deterministic close/reopen controls.

### Decision
`YYYY-MM` is the atomic period unit. All runs reference period + revision.

### Consequences
1. Positive: deterministic reruns.
2. Positive: clear close governance.
3. Constraint: no ad hoc partial-period mutability.

## ADR-003 — Statement-level canonical COA in V1
### Context
Immediate GL-level standardization across systems introduces high mapping complexity.

### Decision
Start with statement-level canonical COA keys (BS/IS), versioned for additive expansion.

### Consequences
1. Positive: accelerated implementation with controlled complexity.
2. Positive: manageable mapping governance.
3. Constraint: future GL granularity requires versioned additive extension.

## ADR-004 — FX interface V1 is versioned input, not implicit lookup
### Context
Consolidation reproducibility fails when FX rates are implicitly sourced at runtime.

### Decision
Each run must bind an explicit `FxRateSet` with deterministic identity.

### Consequences
1. Positive: rerun determinism.
2. Positive: clear auditability for translation effects.
3. Constraint: runs cannot execute with unspecified FX source.

## ADR-005 — Single aggregation pipeline for all consolidated reports
### Context
Parallel report logic creates drift, reconciliation failures, and maintenance cost.

### Decision
Use one aggregation pipeline for BS, IS, CF, and BvA from canonical entries.

### Consequences
1. Positive: invariant enforcement in one place.
2. Positive: reduced divergence risk.
3. Constraint: report additions must use pipeline contracts, not custom calculators.

## ADR-006 — Period close is mandatory for production consolidation
### Context
Open-period mutation makes outputs non-reproducible and weakens governance.

### Decision
Production consolidation runs require closed period status and explicit revision.

### Consequences
1. Positive: deterministic run lineage.
2. Positive: stronger change control.
3. Constraint: late entries require revision workflow.

## ADR-007 — No language/runtime change in consolidation program
### Context
Language replacement creates operational and organizational overhead without immediate risk reduction.

### Decision
Remain on TypeScript/Node/Next. Do not move to Go or C# now.

### Consequences
1. Positive: execution velocity and lower migration risk.
2. Positive: infrastructure continuity.
3. Constraint: architecture quality must deliver extractability without runtime replacement.

## ADR-008 — Engine boundary isolation for future extraction
### Context
Future externalization requires strict separation between business logic and transport/IO concerns.

### Decision
Consolidation engine logic remains isolated from Prisma, Next.js transport concerns, and UI logic.

### Consequences
1. Positive: detachable engine with stable contracts.
2. Positive: simpler service migration path.
3. Constraint: boundary violations are treated as architecture defects.
