# Consolidation Guardrails

## 1. Purpose
This document defines mandatory accounting and engineering guardrails for consolidation. It is designed for CI enforcement and run-time validation determinism. It complements [consolidation-architecture.md](./consolidation-architecture.md), [consolidation-db-schema.md](./consolidation-db-schema.md), and [consolidation-adr-log.md](./consolidation-adr-log.md).

## 2. Scope Boundaries
### 2.1 What we are doing
1. Defining invariant checks that must pass before consolidation output is accepted.
2. Defining CI-style validation philosophy with deterministic failure semantics.

### 2.2 What we are NOT doing
1. Treating reconciliations as manual spot checks.
2. Allowing warnings to substitute for failed accounting invariants.

## 3. Invariants (Mandatory)
## 3.1 Mapping coverage invariant
1. Every imported source account must map to a canonicalAccountKey under a declared mapping version.
2. No unmapped source rows are allowed in successful runs.
3. Failure mode: run status must be failed with explicit missing keys.

## 3.2 Balance Sheet equation invariant
1. For each entity and consolidated output:
   1. `Assets - Liabilities - Equity = 0` within defined precision.
2. Failure mode: run status failed; output marked non-publishable.

## 3.3 Journal balancing invariant
1. Every AdjustmentJournal must satisfy sum of AdjustmentLine amounts = 0.
2. Unbalanced journals are rejected before run execution.

## 3.4 Cash reconciliation invariant
1. Cash movement implied by cash flow must reconcile with beginning and ending cash basis definitions.
2. Basis definitions must be explicit and consistent per run.

## 3.5 Net income to equity tie invariant
1. Period net income must tie to equity movement after approved adjustments and distributions.
2. Exceptions must be explicit adjustment journals, never implicit offsets.

## 3.6 Deferred revenue rollforward invariant (future mandatory)
1. Deferred revenue opening + additions - recognitions = closing.
2. Rollforward control will be activated with revenue recognition rollout.

## 4. Determinism Guardrails
1. Same inputs, same mapping version, same FX set, same period revision must produce same outputFingerprint.
2. No nondeterministic timestamps/random values in aggregation outcomes.
3. Output ordering must be stable and contract-defined.

## 5. Data Integrity Guardrails
1. ImportBatch idempotency by fileHash is mandatory.
2. Duplicate imports with identical hash and scope must no-op or be rejected deterministically.
3. Period close prevents mutable post-close data changes without revision.

## 6. CI Validation Philosophy
1. Invariants are treated as release gates, not informational checks.
2. CI validation layers:
   1. Static contract checks
   2. Deterministic replay checks
   3. Accounting invariants
3. Any invariant breach blocks promotion of consolidation outputs.

## 7. Boundary Guardrails
1. Engine logic remains within consolidation engine boundary.
2. IO remains in repository boundary.
3. UI and API adapters must not implement accounting transformations.
4. Boundary violations are classified as structural defects.

## 8. Explicit Exclusions
1. Manual spreadsheet-only reconciliations are not accepted as system controls.
2. Parallel report calculators are not accepted as fallback logic.
3. Silent auto-corrections are not accepted; all corrections must be explicit adjustments.
