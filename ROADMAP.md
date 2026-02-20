# Finance Dashboard Roadmap

The Finance Dashboard is an internal system today, with one immediate objective: leadership can trust it for decision-making, closes, and board communication. This roadmap prioritizes deterministic outputs, auditable workflows, and incremental hardening over disruptive rewrites, while creating a clear path to broader productization once trust and operational excellence are proven.

This document is a planning roadmap, not a policy document. Binding rules remain in `WORKFLOW.md` and boundary/contracts remain in `docs/ARCHITECTURE.md`.

## Guiding Principles

- Determinism first: the same inputs must always produce the same outputs.
- Auditability by default: every meaningful change should be traceable, explainable, and reproducible.
- Single source of truth: all finance computation remains in `src/lib/finance` with unified aggregation and rule layers.
- Minimal diffs over rewrites: favor incremental hardening that preserves working behavior.
- No finance logic in UI: components remain fetch + render only.
- CI as gatekeeper: lint, tests, and build are non-negotiable merge requirements.
- Governance discipline: PR-only, rebase-only history, and explicit review accountability.

## Current Baseline

- Unified aggregation pipeline is established and guarded by tests.
- Architecture guardrails are in place (finance logic under `src/lib/finance`, no Prisma in finance lib, no debug artifacts).
- Cash Flow engine/model exists and is aligned to the same source-of-truth principles.
- Generic XLSX infrastructure exists under `src/lib/finance/export`.
- Budget vs Actual XLSX is already exposed as an API route.
- Repository governance is strict (PR + rebase workflow, CI checks).

## Phase Gate Rule

Phases do not advance until trust gates are met:

- Reconciliation metrics meet target thresholds for the current phase.
- UI↔XLSX parity checks pass for in-scope reports.
- No open Sev-1 finance correctness incidents.
- Phase Definition of Done criteria are satisfied and documented.

## Phased Roadmap

### Phase 1: Executive Trust (0–6 weeks)

#### Objectives

- Make leadership confidence explicit, measurable, and repeatable.
- Eliminate reconciliation ambiguity across all core reports.
- Guarantee export consistency with on-screen values.
- Harden close-critical workflows without changing core behavior.

#### Key Deliverables

- [ ] Cross-report consistency suite (Income Statement, Balance Sheet, Cash Flow, Budget vs Actual).
- [ ] Export/UI parity tests for all Budget vs Actual modes and scopes.
- [ ] Extend XLSX API exposure to Income Statement, Balance Sheet, and Cash Flow using existing export infrastructure.
- [ ] Board-ready XLSX formatting baseline (headers, totals emphasis, percent clarity) with no structural contract breaks.
- [ ] Snapshot versioning for month-end and quarter-end report states.
- [ ] Reproducibility command/runbook to regenerate snapshots from pinned inputs.
- [ ] Data import validation hardening (schema checks, category/line-item guardrails, fail-fast messaging).
- [ ] Cash Flow-specific reconciliation checks aligned to basis rules and balance transitions.
- [ ] Automated guardrail for “no finance logic in UI” expansion coverage.
- [ ] Leadership-facing release notes template for every finance-impacting change.

#### Definition of Done

- [ ] Reconciliation pass rate >= 99% on CI fixtures and seeded scenarios.
- [ ] 100% parity between UI totals and XLSX totals for all supported report exports.
- [ ] Snapshot regeneration is deterministic (no numeric drift across reruns).
- [ ] Cash Flow and P&L linked checks pass for all supported period modes.
- [ ] No debug endpoints/logs in runtime code.
- [ ] All finance PRs pass lint + test + build with required approvals.
- [ ] Zero unresolved Sev-1/Sev-2 finance correctness defects.

#### Risks & Mitigations

- Risk: Hidden edge cases in imported data cause trust regressions.
  - Mitigation: Add strict import validation + quarantine mode for invalid rows.
- Risk: Export expansion introduces subtle formatting/ordering drift.
  - Mitigation: Golden-file parity tests and contract snapshots.
- Risk: Cash Flow basis confusion in executive usage.
  - Mitigation: Explicit basis labels, test fixtures, and reconciliation annotations.
- Risk: Scope creep into redesign work.
  - Mitigation: Enforce minimal-diff policy and phase gates.

### Phase 2: Operational Excellence (6–12 weeks)

#### Objectives

- Reduce close-cycle friction and manual reconciliation effort.
- Improve reliability, observability, and performance under real usage.
- Standardize finance operations around repeatable runbooks.

#### Key Deliverables

- [ ] Unified `/api/finance/export` orchestrator for single/multi/all-report export selection.
- [ ] Compare mode implementation across report models (current, previous period, previous year).
- [ ] Board pack export composition (multi-sheet workbook bundles with consistent naming).
- [ ] Snapshot diff tooling (period-over-period and snapshot-to-live variance checks).
- [ ] Import template suite with strict versioning and compatibility checks.
- [ ] Validation error catalog with deterministic error codes and operator guidance.
- [ ] Performance pass: cache policy tuning and query scope optimization by months/filters.
- [ ] Consistency suite expansion for cross-report ties (e.g., Net Income to Equity movement assumptions where applicable).
- [ ] Cash Flow snapshot consistency checks tied to Balance Sheet cut points.
- [ ] Operational dashboard for reconciliation status and export health (internal only).

#### Definition of Done

- [ ] Month-end close prep time reduced by at least 30% from current baseline.
- [ ] 95th percentile export generation time within agreed SLA for board packs.
- [ ] Compare mode outputs validated against fixtures across all reports.
- [ ] Import validation catches >= 99% known invalid patterns before aggregation.
- [ ] Snapshot diffs available and reproducible for every closed period.
- [ ] Cash Flow consistency checks included in release gate.

#### Risks & Mitigations

- Risk: Operational tooling adds complexity faster than adoption.
  - Mitigation: Roll out with runbooks and owner training.
- Risk: Performance tuning changes behavior inadvertently.
  - Mitigation: Contract tests and parity checks before/after optimization.
- Risk: Compare logic divergence across reports.
  - Mitigation: Shared compare helpers and unified test matrix.
- Risk: Export API overreach.
  - Mitigation: Keep orchestrator thin; retain model logic in finance lib.

### Phase 3: Enterprise Readiness (3–6 months)

#### Objectives

- Strengthen controls for compliance, security, and audit-readiness.
- Formalize data governance and ownership boundaries.
- Make the platform resilient for larger teams and broader reporting scope.

#### Key Deliverables

- [ ] Immutable audit log for data imports, overrides, rule/config changes, and export events.
- [ ] Role/permission hardening with least-privilege matrix and sensitive action controls.
- [ ] Approval workflow for high-impact changes (imports, mappings, rule updates).
- [ ] Data lineage map from source ingest to report cell output.
- [ ] Security hardening pass (authz checks, secret hygiene, dependency policy, route review).
- [ ] Backup/restore runbooks and disaster recovery rehearsal.
- [ ] Environment parity hardening (dev/staging/prod consistency checks).
- [ ] Reconciliation exception workflow with assignee + SLA tracking.
- [ ] Extended export retention policy and signed artifact metadata.
- [ ] Cash Flow governance controls aligned with same approval/audit policy.

#### Definition of Done

- [ ] All finance-impacting actions are audit logged with actor + timestamp + diff context.
- [ ] Permission matrix documented, tested, and enforced.
- [ ] Security review passes with no critical unresolved findings.
- [ ] Recovery drill executed successfully within target RTO/RPO.
- [ ] Data lineage for executive-visible cells is documented and queryable.
- [ ] Audit and approval controls apply equally to Cash Flow, P&L, Balance Sheet, and BvA.

#### Risks & Mitigations

- Risk: Governance controls slow down delivery.
  - Mitigation: Automate approvals/checks where possible; keep workflows lightweight.
- Risk: Audit scope balloons without clear ownership.
  - Mitigation: Define control owners per domain early.
- Risk: Security hardening conflicts with internal usability.
  - Mitigation: Phase rollout with feature flags and stakeholder feedback.
- Risk: Incomplete lineage undermines trust.
  - Mitigation: Prioritize executive-critical metrics first.

### Phase 4: Productization Options (6–12 months)

#### Objectives

- Evaluate and enable pathways from internal tool to broader platform.
- Preserve trust guarantees while expanding capability surface.
- Build optionality without committing to premature re-architecture.

#### Key Deliverables

- [ ] Multi-entity architecture assessment (shared engine, isolated datasets).
- [ ] Tenant boundary design options and cost model.
- [ ] Externalized configuration strategy for report structures/rules with guardrails.
- [ ] API product surface proposal (read/export/report-model endpoints with contracts).
- [ ] Enterprise SSO + advanced RBAC roadmap.
- [ ] Usage analytics for feature adoption and operational value.
- [ ] Commercialization feasibility brief (packaging, support, implementation effort).
- [ ] Migration plan options from internal-first to managed multi-tenant model.
- [ ] Cash Flow feature expansion feasibility (scenario and forecasting hooks).

#### Definition of Done

- [ ] Productization decision memo approved (go/no-go or staged pilot).
- [ ] Multi-entity and tenancy risks quantified with mitigation plans.
- [ ] API contract proposal validated against existing internal workflows.
- [ ] Operational support model defined (ownership, SLAs, incident process).
- [ ] No regression to trust metrics from earlier phases.

#### Risks & Mitigations

- Risk: Product ambitions compromise correctness guarantees.
  - Mitigation: Trust metrics remain release gates.
- Risk: Premature multi-tenant investment.
  - Mitigation: Stage-gated architecture spikes with ROI checkpoints.
- Risk: Overgeneralization of internal finance logic.
  - Mitigation: Keep core engine stable; layer optional capabilities.
- Risk: Organizational ownership gaps.
  - Mitigation: Define product, finance, and platform accountability early.

## North Star Features

These are aspirational and explicitly gated by successful completion of earlier phases.

- Scenario modeling (best/base/worst) with assumption libraries.
- Rolling forecasting with variance learning loops.
- Multi-entity consolidation and intercompany eliminations.
- Industry benchmarking overlays and KPI comparatives.
- Advanced permissions matrix (metric-level visibility and action-level controls).
- Multi-tenant deployment model with tenant-level governance.
- Automated board narrative generation grounded in audited numbers.
- Cash Flow planning workspace with driver-based what-if analysis.

## Metrics of Trust

- Reconciliation pass rate (per report, per release).
- Export/UI parity rate across all supported scopes and compare modes.
- Snapshot reproducibility success rate.
- Finance incident rate (correctness defects by severity).
- Mean time to detect and resolve report inconsistencies.
- Time-to-close improvement (monthly/quarterly).
- Cash Flow consistency pass rate versus source-of-truth checks.
- Change failure rate for finance-impacting PRs.

## Operating Model

- PR-only, rebase-only merge policy.
- CI gates are mandatory: lint, tests, build.
- Minimal-diff implementation rule for finance-critical changes.
- Helper placement rules enforced: finance logic in `src/lib/finance`, export infra in `src/lib/finance/export`.
- No debug endpoints/logs in runtime code.
- Documentation updates required for new report/export capabilities.
- Guardrail tests expanded with every new finance surface area.

## Open Questions

- What are the authoritative upstream data sources and refresh SLAs?
- What close cadence is the target baseline (monthly only vs monthly + quarterly acceleration)?
- Which team owns finance rule/config changes and approvals?
- What audit/compliance standard is the near-term target?
- What is the timeline for database and environment maturity beyond current internal setup?
- Should export artifacts be retained, versioned, and signed for formal board workflows?
- What level of compare-mode behavior is required per report for executive use?
- How should Cash Flow basis defaults be selected and communicated to stakeholders?
- What permission granularity is required before broader organizational rollout?
- What criteria determine readiness for multi-entity or multi-tenant expansion?
