# Consolidation Architecture

## 1. Purpose
This document defines the production architecture for multi-entity financial consolidation across the Israeli parent (IL) and US subsidiary (US). It specifies deterministic data flow, traceability requirements, engine boundaries, and reporting outputs. This document is normative for consolidation design decisions and is complemented by [consolidation-db-schema.md](./consolidation-db-schema.md), [consolidation-guardrails.md](./consolidation-guardrails.md), [consolidation-roadmap.md](./consolidation-roadmap.md), and [consolidation-adr-log.md](./consolidation-adr-log.md).

## 2. Scope Boundaries
### 2.1 What we are doing
1. Implementing a single consolidation engine for IL and US financial data.
2. Standardizing all reporting inputs as `CanonicalEntry` records.
3. Producing consolidated outputs for:
   1. Balance Sheet
   2. Income Statement
   3. Cash Flow
   4. Budget vs Actual
   5. Revenue Recognition (US GAAP structured support)
4. Enforcing deterministic, reproducible, traceable results.
5. Isolating engine logic from IO and UI.

### 2.2 What we are NOT doing
1. Replacing application language/runtime.
2. Splitting into microservices now.
3. Replacing the database technology now.
4. Building a parallel aggregation path per report.
5. Implementing ad hoc report-specific business rules outside the engine.

## 3. Canonical Data Model
### 3.1 CanonicalEntry (single source of financial facts)
Every consolidated number must be derived from `CanonicalEntry`.

`CanonicalEntry`
1. `period` (YYYY-MM)
2. `entityId` (nullable for consolidated-level entries)
3. `canonicalAccountKey`
4. `amount`
5. `currency`
6. `dimensions`
   1. `department`
   2. `counterpartyEntityId`
7. `sourceRefs`
8. `mappingVersionId`
9. `adjustmentId`

### 3.2 Canonical rules
1. All reports consume canonical entries only.
2. All transformations are versioned and replayable.
3. Consolidation-level adjustments are explicit records, not implicit math.
4. No report can bypass the canonical pipeline.

## 4. Engine and IO Boundary
### 4.1 Engine location and responsibility
1. Engine implementation path: `src/lib/finance/consolidation/*`.
2. Engine responsibilities:
   1. Mapping normalization
   2. Elimination logic
   3. Aggregation
   4. Validation checks
   5. Deterministic report model construction

### 4.2 IO location and responsibility
1. IO implementation path: `src/server/consolidation-repository/*`.
2. IO responsibilities:
   1. Persistence
   2. Query orchestration
   3. Import ingestion
   4. Retrieval of mapping versions, FX sets, periods, and runs

### 4.3 Forbidden boundary violations
1. No Prisma usage in engine code.
2. No business logic in UI.
3. No report-specific aggregation in API route handlers.

## 5. Single Aggregation Pipeline
### 5.1 Deterministic flow
1. Source statement rows are imported and fingerprinted.
2. Mapping version is selected.
3. Source rows are converted into canonical entries.
4. Adjustments and eliminations are applied.
5. Invariants are validated.
6. Consolidated report models are generated from the same canonical set.

### 5.2 Pipeline constraints
1. Single pipeline for all reports.
2. Shared period semantics across all report models.
3. Shared entity scope semantics across all report models.
4. No alternate logic branches per report type.

## 6. Traceability and Reproducibility
1. Each numeric output must resolve to one or more source references.
2. Each output must bind to a mapping version and consolidation run.
3. Re-running the same inputs must produce identical outputs.
4. Run metadata must include deterministic fingerprints.

## 7. Period and Revision Model
1. Month (`YYYY-MM`) is the atomic period unit.
2. Consolidation operates on closed periods only.
3. Revisions are explicit and immutable snapshots by run.
4. Re-open requires a new revision cycle and new run lineage.

## 8. Canonical COA Strategy
1. Canonical COA is statement-level in V1.
2. Initial domain includes:
   1. Balance Sheet: Assets, Liabilities, Equity
   2. Income Statement: Revenue, Expenses
3. Expansion is additive and versioned; no destructive key migration in-place.
4. Rationale and examples are defined in [consolidation-db-schema.md](./consolidation-db-schema.md).

## 9. Extractability Constraint
1. Consolidation engine must be detachable into an external service without refactor of business logic.
2. Adapters may change; consolidation contracts must remain stable.
3. Transport concerns cannot leak into engine modules.

## 10. Critical Infrastructure Decision Summary
1. Language/runtime remains TypeScript/Node/Next.
2. No Go adoption.
3. No C# adoption.
4. No microservice split now.
5. No database replacement now.
6. Mandatory now:
   1. Entity model
   2. Month period model
   3. Period close and revision model
   4. Canonical COA dictionary
   5. ConsolidationRun tracking
   6. Mapping versioning
7. Deferral of these foundations introduces compounded migration and audit cost; details in [consolidation-infrastructure-decision.md](./consolidation-infrastructure-decision.md).
