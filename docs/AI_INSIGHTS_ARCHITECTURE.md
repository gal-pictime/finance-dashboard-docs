# AI Insights Architecture

## Goals

- Provide deterministic, auditable insight generation over finance data products.
- Support insights from both import artifacts and final report models.
- Keep finance numbers authoritative in report models and aggregation outputs.
- Keep architecture internal-first and adapter-driven for future evolution.

## Non-goals

- AI-generated values replacing finance model outputs.
- UI-side financial computation or scoring logic.
- External data egress by default.

## Insight Contract

Each insight should follow a stable contract:
- `id`
- `stage`: `import` | `aggregation` | `report`
- `sourceSystem`: `IL` | `US` | `CONSOLIDATED` | `SYSTEM`
- `severity`: `info` | `warning` | `critical`
- `title`
- `summary`
- `evidenceRefs`: array of references (`fileId`, `rowId`, `accountKey`, `period`, `reportRowKey`)
- `recommendedActions`: array of actionable steps
- `confidence`: numeric score with deterministic rule-based floor semantics

## Three-Stage Insights Model

1. Import-stage insights
- Run on ingestion/parse/normalize outputs.
- Detect malformed inputs, mapping gaps, and structural anomalies.

2. Aggregation-stage insights
- Run on normalized/aggregated finance outputs before report presentation.
- Detect cross-module totals mismatches, period/compare inconsistencies, and consolidation anomalies.

3. Report-stage insights
- Run on final report models (IS/BVA/BS/CF/Dashboard model).
- Provide narrative context and risk flags tied to exact model rows and periods.

## Security & Privacy

- Internal-only operation by default.
- Role-gated access to insights and evidence payloads.
- Redaction policy required for sensitive free-text content and imported raw artifacts.
- Logging must avoid leaking sensitive row-level data outside approved telemetry boundaries.

## Execution Model

- Support on-demand generation and asynchronous background generation.
- Cache insight payloads by deterministic input fingerprint (import artifact + period + scope).
- Invalidate cached insights when imports, mapping rules, or finance write paths change relevant source data.

## Rollout Plan

1. Rules-based deterministic insights first.
2. Evidence-reference coverage and audit trail validation.
3. Optional LLM narrative layer later, behind an explicit feature flag.
4. Preserve deterministic fallback behavior when optional LLM layer is disabled or unavailable.
