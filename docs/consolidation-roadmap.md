# Consolidation Roadmap

## 1. Purpose
This document defines phased delivery for multi-entity consolidation infrastructure and controls. It is execution-focused and aligned with [consolidation-architecture.md](./consolidation-architecture.md), [consolidation-db-schema.md](./consolidation-db-schema.md), and [consolidation-guardrails.md](./consolidation-guardrails.md).

## 2. Scope Boundaries
### 2.1 What we are doing
1. Sequencing deterministic consolidation capabilities from foundations to production readiness.
2. Defining explicit phase gates and non-goals.

### 2.2 What we are NOT doing
1. Mixing feature backlog and architectural runway into one uncontrolled stream.
2. Advancing phases without exit criteria closure.

## 3. Phase 0 — Foundations
### 3.1 Scope
Establish mandatory data and control primitives.

### 3.2 Deliverables
1. Entity model (IL, US).
2. Month-atomic Period model.
3. Period close and revision model.
4. Canonical COA dictionary V1.
5. Mapping version model.
6. ConsolidationRun metadata and fingerprint model.

### 3.3 Non-goals
1. Full elimination automation.
2. Revenue recognition rollout.

### 3.4 Risks
1. Ambiguous period closure ownership.
2. Mapping ownership gaps.

### 3.5 Exit criteria
1. All foundation tables and invariants approved.
2. One deterministic dry run reproducible from stored inputs.

## 4. Phase 1 — Canonical Ingestion and Mapping
### 4.1 Scope
Create deterministic pipeline from imported statements to canonical entries.

### 4.2 Deliverables
1. ImportBatch with fileHash idempotency.
2. SourceStatementRow ingestion contract.
3. Mapping rule evaluator with version pinning.
4. CanonicalEntry generation contract.
5. Coverage validation for unmapped accounts.

### 4.3 Non-goals
1. UI workflow redesign.
2. Parallel report-specific transformations.

### 4.4 Risks
1. Source account drift across systems.
2. Hidden manual transformations outside pipeline.

### 4.5 Exit criteria
1. Mapping coverage invariant enforced in CI.
2. Canonical outputs reproducible across repeat runs.

## 5. Phase 2 — Consolidation Core Reports
### 5.1 Scope
Build consolidated report models from canonical entries using one aggregation pipeline.

### 5.2 Deliverables
1. Consolidated Balance Sheet model.
2. Consolidated Income Statement model.
3. Consolidated Cash Flow model.
4. Consolidated Budget vs Actual model.
5. Run-linked traceability from output rows to sourceRefs.

### 5.3 Non-goals
1. Alternate pipelines per report.
2. Entity-specific custom report engines.

### 5.4 Risks
1. Sign convention drift across models.
2. Cross-report total inconsistencies.

### 5.5 Exit criteria
1. Core accounting invariants pass on every run.
2. Cross-report parity checks stable.

## 6. Phase 3 — Adjustments, Eliminations, and Close Discipline
### 6.1 Scope
Operationalize adjustment journals and close controls.

### 6.2 Deliverables
1. AdjustmentJournal and AdjustmentLine lifecycle.
2. Intercompany elimination framework.
3. Period close gating for consolidation execution.
4. Revisioned rerun procedure.
5. Audit-ready run ledger.

### 6.3 Non-goals
1. Free-form post-close mutations.
2. Untracked manual consolidating entries.

### 6.4 Risks
1. Unbalanced adjustments.
2. Late close changes without revision control.

### 6.5 Exit criteria
1. Journal balancing invariant enforced.
2. Closed periods immutable without explicit revision.

## 7. Phase 4 — Revenue Recognition and US GAAP Structured Support
### 7.1 Scope
Integrate structured support for revenue recognition requirements.

### 7.2 Deliverables
1. Canonical revenue recognition dimensions.
2. Deferred revenue rollforward controls.
3. Recognition-to-cash linkage checks.
4. Consolidated disclosure-ready support models.

### 7.3 Non-goals
1. Ad hoc recognition logic outside canonical contracts.
2. Manual spreadsheet dependency for recognition controls.

### 7.4 Risks
1. Contract interpretation inconsistencies.
2. Data granularity mismatch with current source feeds.

### 7.5 Exit criteria
1. Deferred revenue rollforward invariant passes.
2. Recognition transformations versioned and reproducible.

## 8. Phase 5 — Production Hardening and Service Extractability
### 8.1 Scope
Harden reliability and prepare for optional external service extraction.

### 8.2 Deliverables
1. Deterministic replay harness for consolidation runs.
2. Contract conformance suite for engine inputs/outputs.
3. Explicit adapter boundary for detached service mode.
4. Operational runbook for incident and rollback.

### 8.3 Non-goals
1. Immediate microservice deployment.
2. Runtime/language replacement.

### 8.4 Risks
1. Boundary leaks between IO and engine.
2. Contract drift during rollout.

### 8.5 Exit criteria
1. In-process and detached modes produce identical results for reference datasets.
2. Extractability checks pass without engine refactor.
