# Finance Dashboard Governance

## Purpose
This document is the governance meta-layer for the Finance Dashboard. It defines how policy documents relate to each other, how to resolve conflicts between them, and how governance changes must be maintained over time.

## Quick Links
- [WORKFLOW.md](WORKFLOW.md) — binding policy and change process (MUST)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — boundaries, contracts, migration discipline (MUST)
- [README.md](README.md) — onboarding and key reminders
- [ROADMAP.md](ROADMAP.md) — planning guidance (not policy)
- [PLAN.md](PLAN.md) — decision log for major governance/workflow/infrastructure decisions

## Official Policy Files

### `README.md`
- Primary onboarding entry point for contributors.
- Summarizes architecture and key policy reminders.
- Documents user-facing conventions and practical guardrails.

### `docs/ARCHITECTURE.md`
- Defines architecture boundaries and service extraction direction.
- Specifies contract stability, migration discipline, and parity expectations.
- Clarifies responsibilities across UI, API, server IO, and engine layers.

### `WORKFLOW.md`
- Binding engineering policy (MUST-level rules).
- Defines change classification, approval expectations, and enforcement requirements.
- Governs CI-facing process rules and operational incident protocol.

### `ROADMAP.md`
- Strategic planning document for phased delivery.
- Captures priorities, sequencing, and long-term product direction.
- Guides planning decisions but does not define binding policy.

### `PLAN.md`
- Work Plan / Change Log for major decisions and implementation direction.
- Records what changed, why it changed, and decision rationale.
- Supports governance traceability but does not define runtime rules.

## Authority & Precedence
GOVERNANCE.md defines the authority model for this repository and sits above all policy documents.

- `WORKFLOW.md` is binding policy and defines MUST-level process requirements.
- `docs/ARCHITECTURE.md` defines architecture boundaries, contracts, and migration discipline.
- `README.md` is an onboarding summary with key policy reminders.
- `ROADMAP.md` is planning guidance, not binding policy.
- `PLAN.md` is a decision log for major governance/workflow/infrastructure changes; it is required for decision traceability, not for defining runtime rules.

Within binding policy documents, conflict resolution order is:
`WORKFLOW.md` > `docs/ARCHITECTURE.md` > `README.md` > `ROADMAP.md` > `PLAN.md`

`PLAN.md` must never override `WORKFLOW.md` or `docs/ARCHITECTURE.md`.

## Core Governance Principles
- Determinism first: same inputs must produce the same outputs.
- Single source of truth: finance logic lives in `src/lib/finance` with unified aggregation and rules.
- Extractable engine principle: finance engine remains framework-agnostic; IO belongs outside the engine.
- Minimal diffs / minimal risk: avoid broad rewrites unless explicitly justified.
- No silent contract changes: API/model/XLSX contract changes must be explicit and tested.
- No debug artifacts in runtime code.
- UI boundary discipline: components fetch + render; finance logic stays in engine/contracts.
- API routes remain thin adapters over engine contracts.

## Change Discipline
- Every PR MUST declare Change Classification (per `WORKFLOW.md`).
- Structural and Contract changes MUST include a CTO Review Card (per `WORKFLOW.md`).
- Structural changes must align with `docs/ARCHITECTURE.md` service boundary and migration discipline.
- Any new feature or user-facing change MUST update `README.md`.
- Any architecture, boundary, or contract change SHOULD update `docs/ARCHITECTURE.md`.
- Any roadmap priority shift SHOULD update `ROADMAP.md`.
- Any major governance/workflow/CI hardening decision MUST be documented in `PLAN.md` with: what changed, why, and the decision taken.

## Long-Term Direction
- The system must remain extractable into an external finance service.
- Preserve explicit boundaries between UI, API adapters, server IO/repository, and the finance engine.
- Favor additive contract evolution; breaking changes require an explicit migration plan.
