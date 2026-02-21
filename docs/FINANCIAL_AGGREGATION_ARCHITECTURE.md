# Financial Aggregation Architecture

## Purpose

This document defines:
- Where aggregation logic currently exists
- Where duplication and drift risks exist
- The target single-entry aggregation model
- The structural requirements for Full Financial Unification

This document was created as part of Phase 2 (Aggregation Convergence) and is a permanent architectural reference.

---

## Current Aggregation Map

| File / Module | Responsibility | Used By | Drift Risk Level |
|---|---|---|---|
| `src/lib/finance/aggregation.ts` | Core monthly aggregation of actuals, budget, and detail breakdowns by scope and month | BVA | Low |
| `src/lib/finance/report-models.ts` | BVA row tree assembly, per-row totals, and model cell generation | BVA | Medium |
| `src/lib/finance/budget-vs-actual-model.ts` | Period selection and period-level BVA metrics from model cells | BVA UI | Medium |
| `src/lib/finance/income-statement.ts` | Income Statement report-model assembly and compare handling | IS | Medium |
| `src/lib/finance/balance-sheet-report.ts` | Balance Sheet report-model assembly, section totals, compare boundary handling | BS | Medium |
| `src/lib/finance/cash-flow-report.ts` | Cash Flow report-model assembly and compare merge logic | CF | Medium |
| `src/lib/finance/cash-flow/cash-flow-engine.ts` | Cash Flow domain aggregation from P&L + detail + balance deltas | CF | Medium |
| `src/lib/finance/period.ts` | Canonical period/compare resolution entry point, plus shared labels and summation helpers | IS, BVA, BS, CF, Dashboard | High |
| `src/lib/finance/pnl-totals.ts` | Shared P&L totals and computed-series helpers | Dashboard | Medium |
| `src/lib/finance/dashboard-model.ts` | Dashboard model assembly and KPI period rollups | Dashboard | High |
| `src/lib/finance/dashboard-kpis.ts` | Dashboard KPI projection from prepared series/ranges | Dashboard | Medium |
| `src/lib/finance/variance.ts` | Common variance and variance-percent computation primitive | IS, BVA, BS, CF, Dashboard | Low |

---

## Duplication & Drift Zones

- Multiple helpers perform overlapping summation behavior (period totals, category totals, section totals) across report-specific modules.
- Period resolution appears in shared helpers (`period.ts`) and report-specific snapshot handling (for example Balance Sheet snapshot month resolution), which creates drift risk if rules diverge.
- Totals are still computed in several report-model builders instead of a single canonical aggregation output tree.
- Report-specific math exists where each report assembles totals/derived values independently, even when based on common source data.
- Compare logic is fragmented across Income Statement, Balance Sheet, and Cash Flow report-model modules, including local fallback handling.

---

## Current Drift Risks (Known Gaps)

- Dashboard model assembly diverges from report models (parallel totals/variance assembly path).
- Duplicate helper drift risk exists for known helpers (for example `filterBudgetByScope`, `zeroMonths`) when re-implemented in multiple modules.
- Non-determinism risk remains where `getDefaultMonthSelection` uses wall-clock time; this behavior must stay outside finance core invariants.
- Cache correctness risk: write endpoints must invalidate repository/TTL cache keys to prevent stale finance reads.
- Canonical formulas are still duplicated in places (for example revenue and gross-profit-derived computations).

---

## Canonical Totals Policy

- Revenue, Gross Profit, Operating Income, and Net Income must be derived from canonical helpers only.
- Ad-hoc re-implementation of these formulas is not allowed once canonical helpers exist.
- First concrete step (planned): introduce a single canonical revenue helper (for example `computeRevenue(series)`) under `src/lib/finance`, and route existing consumers to it in a dedicated follow-up PR.

---

## Dashboard Server Alignment Plan (Eliminate N+1 + Client-side Finance)

- Introduce `/api/finance/dashboard` returning a server-built `DashboardModel`.
- Dashboard UI must consume a single endpoint and avoid N+1 data waterfalls.
- Dashboard UI must not assemble finance math in the client.
- `DashboardModel` must be composed from report models (IS/BS/CF/BVA) or from unified aggregation outputs, not from a parallel totals pipeline.

---

## Guardrails To Add (Planned)

- Totals Agreement Guardrail: IS/BVA/Dashboard KPI totals must agree for the same dataset and period.
- No Duplicate Finance Helpers Guardrail: prevent duplicate implementations of canonical helpers (`zeroMonths`, `filterBudgetByScope`, revenue formula).
- No Direct Aggregation In Routes Guardrail: prevent importing `buildFinanceAggregates` directly from API routes (temporary exceptions only until legacy routes migrate).

---

## Safe PR Sequencing

1. Add dashboard-model unit/contract tests first.
2. Deduplicate helpers (`filterBudgetByScope`, `zeroMonths`, revenue formula path).
3. Add cache invalidation on finance write endpoints.
4. Move nondeterministic defaults out of finance core paths.
5. Add server-side dashboard endpoint.
6. Migrate dashboard UI to single-endpoint consumption.
7. Migrate legacy budget route to FinanceEngine.
8. Add strict guardrails for totals agreement and duplication prevention.

---

## Target Architecture (Post-Unification Model)

Repository  
→ Core Aggregation Layer (single entry point)  
→ Normalized Financial Tree  
→ Reports (IS / BVA / BS / CF)  
→ UI

Structural requirements:
- No report may compute totals independently.
- No UI may perform financial math.
- Period resolution must be centralized.
- Compare logic must be centralized.
- Totals must originate from a single aggregation pipeline.

---

## Phase 2 Exit Criteria

- Single aggregation entry point verified.
- No duplicate totals logic outside core aggregation.
- Period selection unified across all report models.
- Compare resolution unified across all report models.
- Guardrail test coverage preventing aggregation drift.

---

## Long-Term Structural Considerations

- Consolidation: a normalized aggregation tree enables multi-entity rollups and eliminations without report-specific forks.
- FX: centralized aggregation boundaries allow a controlled pre-aggregation conversion stage.
- Extractability: a single deterministic aggregation entry point strengthens migration of the finance engine into an external service boundary.

---

## AI Insights Readiness

- AI never computes authoritative numbers; it generates narrative and diagnostics over deterministic report models and import artifacts.
- Insights are produced at three stages: import (input), aggregation/consolidation (mid-pipeline), and report (output).
- Every insight must include evidence references (`fileId`, `rowId`, `accountKey`, `period`, `reportRowKey`) for auditability.
- The architecture remains internal-only by default (no external egress assumed), while keeping adapter boundaries ready for future transport/runtime changes.
