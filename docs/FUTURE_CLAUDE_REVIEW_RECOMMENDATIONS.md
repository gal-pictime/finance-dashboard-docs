# Future Claude Review Recommendations

This document records recommendations intentionally deferred for staged adoption.

## 1) Immediate full migration of all finance routes to FinanceEngine

- What it is: migrate every remaining finance API route to FinanceEngine abstraction in one pass.
- Why not now: high migration surface and regression risk while Phase 2/4 convergence is still active.
- When to adopt: after dashboard server alignment and period/totals guardrails are fully enforced.

## 2) Aggressive ESLint allowlist tightening immediately

- What it is: enforce stricter import and boundary rules across all modules in one policy step.
- Why not now: may create noisy failures while transitional dashboard/server endpoint work is in progress.
- When to adopt: once `/api/finance/dashboard` is established and client-side finance paths are removed.

## 3) Advanced DB indexing strategy

- What it is: broaden index coverage for finance-heavy query paths and import analytics patterns.
- Why not now: current scale and query profile do not justify complexity and migration overhead yet.
- When to adopt: when measured query latency, row volumes, or CI/runtime performance cross defined thresholds.

## 4) Full audit trail / event sourcing

- What it is: append-only finance event stream with replayable state and full lineage.
- Why not now: significant infrastructure and contract complexity beyond current phase scope.
- When to adopt: during dedicated audit/compliance phase or when governance requires immutable event-level replay.

## 5) Hard isolation into a separate service process

- What it is: run finance engine as an independent service process/runtime boundary.
- Why not now: extraction boundary exists, but full service split adds operational overhead before parity milestones complete.
- When to adopt: during engine extraction phase after adapter parity and contract stability gates are met.

## 6) FX conversion layer implementation details

- What it is: full FX conversion rules (rate selection semantics, fallback handling, reporting currency policies).
- Why not now: FX behavior is explicitly deferred behind current consolidation-readiness phases.
- When to adopt: when FX phase starts and functional/reporting currency use-cases are activated.

## 7) Consolidation eliminations layer intercept strategy

- What it is: explicit intercept layer for intercompany eliminations before final report assembly.
- Why not now: consolidation eliminations are planned but not yet active in current runtime path.
- When to adopt: when multi-entity consolidation output is enabled beyond baseline single-primary behavior.

## 8) LLM Narrative Layer Over Rules-Based Insights

- What it is:
  A narrative-generation layer that produces human-readable financial commentary on top of deterministic rules-based insights and report models.

- Architectural Principle:
  The LLM layer must never compute authoritative financial values.
  It may only consume:
    - Deterministic rules-based insights
    - Report models
    - Evidence references
  All numeric claims must be traceable to deterministic finance outputs.

- Why not now:
  Requires stable canonical totals, dashboard server alignment, and totals agreement guardrails.
  Introduces nondeterminism and governance considerations (model choice, logging, redaction).

- When to adopt:
  After aggregation convergence and dashboard alignment are complete.
  Only behind an explicit feature flag.

- Deterministic Fallback Requirement:
  If the LLM layer is disabled or fails, the system must still return rules-based insights without loss of diagnostic integrity.
