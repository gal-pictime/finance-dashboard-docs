# Finance Dashboard Architecture

The Finance Dashboard is an internal Next.js system today, designed under an explicit assumption: the finance engine may be extracted into an external service in the future. This document defines practical boundaries, stable contracts, and migration steps so the current architecture stays trustworthy now while remaining ready for service extraction later.

## Current Architecture (Today)

- Next.js app (`src/app`): UI + API routes.
- Finance core (`src/lib/finance`): pure finance logic (aggregation, rules, period semantics, report models, cash-flow logic, formatting helpers).
- Server/repository boundaries (`src/server`): Prisma and IO orchestration (repository + HTTP parsing helpers).
- Exports (`src/lib/finance/export`): generic XLSX infrastructure (catalog, sheet factories, workbook builders).
- Currently exposed export endpoint: Budget vs Actual XLSX (`/api/finance/export/budget-vs-actual`).

## Consolidation & FX Roadmap

### Goals
- Support multi-entity consolidation while preserving current single-entity behavior.
- Keep finance engine extractable with stable DTO contracts.
- Keep deterministic finance behavior with guardrail parity.

### Non-goals (initial phases)
- No consolidation selector UI changes yet.
- No intercompany elimination behavior implementation yet.
- No FX behavior changes in Phase 1.

### Invariants
- `single(primary)` output must remain identical to current baseline.
- Determinism must remain intact (stable ordering, stable semantics, reproducible outputs).
- UI must not implement FX or conversion logic.
- FX data (rates) is loaded via repository/adapters; UI never sees or computes FX inputs.
- Finance domain logic stays in `src/lib/finance`; Prisma/IO remains outside finance engine modules.
- Extractability boundary remains unchanged.

### Phased plan summary
- Phase 1 (additive schema): introduce entity dimension (`entityId` on fact tables) with deterministic backfill to primary entity, and optional FX reference tables, with no behavior change.
- Phase 2 (consolidation-ready scope): introduce entity scope contracts (`single` / `consolidated`) while keeping engine Prisma-free.
- Phase 3 (FX behavior): add controlled conversion semantics with strict no-op identity when functional equals reporting currency.

FX is logically independent from consolidation. Consolidation operates on USD-normalized datasets. FX is primarily used for per-entity currency analysis (for example ILS vs USD) and does not affect consolidation mechanics.

Note: the current seeded dataset represents the consolidated (already-unified) baseline view. Future phases will ingest per-entity subsidiary inputs and compute consolidated outputs (and later eliminations), while preserving current single(primary) behavior until explicitly enabled.

Phase status (Budget vs Actual path):
- Phase 1 completed: entity dimension added with deterministic backfill to `PIC_TIME_PRIMARY`.
- Phase 2 completed: repository entity scoping (`entityIds`) with deterministic normalization and cache-key scoping.
- Phase 3 completed: Budget vs Actual contract accepts optional `entityIds`; engine defaults to `PIC_TIME_PRIMARY` when omitted/empty.
- Phase 3/4 hardening: finance read routes are entity-scoped and Budget vs Actual export route accepts optional `entityIds`.
- Write guardrails: finance write routes explicitly reject scoped writes and remain primary-only.

See: `docs/consolidation-fx-roadmap.md`

## Target Architecture (Future: Extracted Engine Service)

### Components

- Web App
  - Owns auth/session/RBAC, routing, UI rendering, and user workflows.
- Engine Service
  - Owns finance computation contracts, report models, and export orchestration.
- Shared Contracts
  - Typed request/response contracts and invariants shared between app and service.

### Responsibilities / Non-Responsibilities

- Web App responsibilities:
  - Authentication, authorization, user context, request validation, presentation.
- Web App non-responsibilities:
  - Core finance math, period/compare semantics, aggregation rules.
- Engine Service responsibilities:
  - Finance use-cases, deterministic model building, export assembly.
- Engine Service non-responsibilities:
  - Session management, UI behavior, browser concerns.

## Service Boundary

### Belongs in the engine

- Aggregation and scope semantics (company/department/group/unallocated).
- Department/company rule layers and reclassification invariants.
- Report model building and period/compare semantics.
- Cash Flow model computation and reconciliation semantics.
- Export model assembly and workbook definition/building.

### Stays in the web app

- Auth/session and RBAC checks.
- Route composition and transport-level concerns.
- UI state, rendering, and interaction logic.
- Data entry UX and import workflow UX.

## Stable Contracts

Use-cases are the contract surface. Inputs/outputs must be explicit and stable.

- `getBudgetVsActualModel(params) -> BudgetVsActualModel`
  - Inputs: year, scope, optional department/group, optional months.
  - Outputs: rows/cells/meta for UI and export.
  - Invariants: period semantics preserved; totals semantics preserved; `meta.totalRowKey` identifies canonical total row.

- `getIncomeStatementModel(params) -> IncomeStatementModel`
  - Inputs: year, period type, compare mode/target.
  - Outputs: model rows with current/compare/delta fields.
  - Invariants: compare semantics consistent with shared period helpers.

- `getBalanceSheetReportModel(params) -> BalanceSheetReportModel`
  - Inputs: year, period selection (`periodType`, `selectedMonth`, `selectedQuarter`), compare mode.
  - Outputs: section rows and totals with current/compare/variance fields and resolved snapshot metadata.
  - Invariants: if compare target is outside dataset boundary, compare is downgraded to `NONE` and compare/variance fields are null.

- Legacy snapshot endpoint `/api/finance/balance-sheet` has been removed; balance sheet access must use the report-model contract endpoint `/api/finance/balance-sheet-report`.

- `getCashFlowReportModel(params) -> CashFlowReportModel`
  - Inputs: year, period selection, compare mode, basis.
  - Outputs: report-model rows and reconciliation fields with compare/variance support.
  - Invariants: reconciliation semantics deterministic and basis-aware.

- `buildXlsxWorkbook(params) -> Buffer`
  - Inputs: report selection + report models/sheet definitions.
  - Outputs: workbook buffer.
  - Invariants: sheet order, row order, and structural contracts stable per report model.

## Contract Stability Policy

- Additive changes are preferred (new optional fields, new endpoints, new export presets).
- Breaking changes (field removal/rename, semantic shifts, ordering contract changes) require:
  - Explicit declaration in PR.
  - Migration/deprecation notes.
  - Versioning or compatibility adapter plan.
- No silent contract changes are allowed.
- `meta.totalRowKey` and period/compare semantics are stability-sensitive and must be treated as contract-level behavior.

## Migration Plan (Strangler)

1. Preserve current in-process engine path as baseline.
2. Introduce engine adapter interface in API layer.
3. Add env flag (`FINANCE_ENGINE_MODE=inprocess|service`).
4. Route use-case calls through adapter; default remains `inprocess`.
5. Implement service client path behind flag for selected endpoints.
6. Run parity checks (service vs in-process) in CI fixtures and staged runs.
7. Expand service path endpoint-by-endpoint once parity is proven.
8. Keep dual-run/parity mode during rollout windows for critical reports (including Cash Flow).
9. Rollback strategy: flip env flag to `inprocess` immediately, no data migration required for compute-only failures.

## Parity & Migration Discipline

- Default runtime remains in-process until parity is demonstrated.
- Service-path rollout must use dual-run/parity checks against in-process output for critical report models and exports.
- Migration success criteria include reconciliation pass rate and UI↔XLSX parity, not just API availability.
- Rollback must be immediate and low-risk (adapter/env-flag controlled).

## Guardrails & Rules

- Follow the Extractable Finance Engine Principle in `README.md`.
- Follow the Engine Extractability Checklist in `WORKFLOW.md`.
- No framework/runtime dependencies inside engine modules.
- No Prisma/DB/network access in engine modules.
- API routes remain thin adapters over engine contracts.
- Tests and guardrails are required for invariants and parity.

## Governance & Roadmap Alignment

- `docs/MASTER_EXECUTION_ROADMAP.md` is the authoritative execution document.
- Finance-critical changes must map to a roadmap phase and be logged in its Change Log.
- CI guardrails enforce this alignment and fail PRs that introduce finance-critical changes without a roadmap Change Log update.
- Guardrail: `roadmap-changelog-required` (`src/guardrails/roadmap-changelog-required.test.ts`) requires roadmap Change Log updates in the same PR when finance-critical paths change, including finance API type paths (`src/types/finance-api.ts`, `src/types/public/finance-api.ts`, and any `src/types/**` path containing `finance-api`).

## Money Units

- Database values are stored as full USD; UI/report surfaces render `$K`.
- See `docs/MONEY-UNITS.md` for seed scaling rules and DB guardrail workflow.

## Public Docs Mirror

- Public mirror coverage is limited to governance/docs artifacts and `src/types/public/**` contract shapes.
- Implementation code and Prisma-dependent types are forbidden from the mirror.
- Decision record: `docs/adr/ADR-001-public-docs-mirror.md`.

## Report Models Boundary Note

`src/lib/finance/report-models` currently contains executable logic in addition to model structures.  
Target direction: move report DTO/types into a dedicated finance types module and then remove UI allowlist dependence on `report-models` imports.
