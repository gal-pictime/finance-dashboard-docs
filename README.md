# Finance Dashboard

Internal finance reporting dashboard for Pic-Time.

This project provides:

- Income Statement (Actual + Budget)
- Budget vs Actual reporting
- Balance Sheet snapshot
- Department-level breakdowns
- Unified aggregation engine (company vs department rules)
- Guardrail tests to prevent finance logic drift

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Prisma + PostgreSQL (local via Docker Compose)
- Vitest (unit tests)

---

## Project Structure (Finance Core)

All finance logic lives under:

src/lib/finance/

Key files:

- aggregation.ts — Single entrypoint for all aggregation
- department-rules.ts — Company-only transformation layer
- pnl-engine.ts — P&L computed formulas (Gross / Operating / Net)
- report-config.ts — Report structure & visible line items
- finance-types.ts — Shared finance types
- reconcile.ts — P&L identity helpers
- config-coverage.test.ts — Prevents missing config line items
- aggregation.test.ts — Guardrails for RAW vs Company rules

Rules enforced by architecture:

- Routes call ONE aggregation entrypoint only
- Departments scope is RAW (no company rules)
- Company scope passes through department-rules
- No finance math inside React components
- Seed data is source-of-truth for classification

## Extractable Finance Engine Principle

Design every change as if the finance engine will need to be extracted into an external service in the future, even if that extraction never happens.

Why this matters:

- Preserves executive trust through deterministic, repeatable outputs.
- Improves auditability by keeping contracts and transformations explicit.
- Prevents lock-in to framework/runtime details that are hard to unwind later.
- Reduces rewrite risk by keeping boundaries clean from day one.
- Maintains long-term optionality for scaling architecture when needed.

What this means in practice:

- `src/lib/finance` must remain framework-agnostic and pure (no Next.js request/response, no cookies/session, no direct env reads).
- IO boundaries stay outside the engine: DB/Prisma/network live in server/repository layers only.
- Finance engine functions consume plain inputs and return plain outputs (DTO-style contracts).
- UI and XLSX exports must rely on the same report models/contracts to preserve parity.
- API routes remain thin adapters with minimal coupling to finance internals.
- Structural invariants require tests/guardrails (including UI vs export parity where relevant).

See `docs/ARCHITECTURE.md` for the explicit service boundary and migration (strangler) plan.

---

## Document Authority & Precedence

This repository has a strict documentation authority model:

- `GOVERNANCE.md` is the meta-policy layer and defines policy-file authority.
- `WORKFLOW.md` is the binding policy (MUST).
- `docs/ARCHITECTURE.md` defines boundaries/contracts and migration discipline (MUST).
- `README.md` is onboarding summary with key policy reminders (SHOULD).
- `ROADMAP.md` is planning guidance (SHOULD), not policy.
- `PLAN.md` is the decision log for major governance/workflow/infrastructure decisions; it is required for traceability and does not define runtime rules.

Conflict resolution order:
`GOVERNANCE.md` > `WORKFLOW.md` > `docs/ARCHITECTURE.md` > `README.md` > `ROADMAP.md`

`PLAN.md` is a decision log and never overrides `WORKFLOW.md` or `docs/ARCHITECTURE.md`.

---

## Finance Invariants (Non-Negotiable)

- Finance computation is single-source-of-truth in `src/lib/finance`.
- Departments scope remains RAW; company scope applies rules via `department-rules.ts`.
- API routes are thin adapters and must not duplicate finance math.
- UI and exports must preserve model parity (no silent drift between rendered and exported values).
- Contract changes (API/export/model structure) must be explicit, documented, and tested.
- Finance outputs must be deterministic for the same input dataset and period selection.

---

## How to change finance safely

- Follow `WORKFLOW.md` for mandatory change classification, approvals, and emergency protocol.
- Use `docs/ARCHITECTURE.md` for service boundaries, contract stability, and migration/rollback discipline.
- Use `.github/pull_request_template.md` and complete required checklists before requesting review.

---

## Local Setup

Install dependencies:

    npm install

Create local env file:

    cp .env.example .env

Seed database:

    npm run db:up
    npm run db:migrate
    npm run db:seed

Start dev server:

    npm run dev

---

## Testing & Safety

Run tests:

    npm test

Production build check:

    npm run build

All finance aggregation invariants are covered by unit tests.
Any logic drift should fail tests.

## DB Fingerprint Guardrail

- `npm run test:db` verifies deterministic seeded DB fingerprints (table counts + yearly value sums).
- It exists to detect migration/seed data regressions early.
- Run it only when Postgres is running and migrated/seeded.
- It is intentionally not part of `npm test`; CI runs it after `prisma db seed`.

## XLSX Export

Budget vs Actual export endpoint:

`GET /api/finance/export/budget-vs-actual?year=2026&months=1,2,3&scope=company`

Supported scopes:

- `company`
- `department` (requires `departmentId`)
- `group` (requires `groupId`)
- `unallocated`

Generic XLSX export infrastructure exists under:
`src/lib/finance/export/`
and includes the export catalog, sheet factories, and workbook builders. Currently only the Budget vs Actual endpoint is exposed as an API route. This infrastructure enables additional report exports without duplicating aggregation logic.

---

## Budget vs Actual Model API

Budget vs Actual model endpoint:

`GET /api/finance/budget-vs-actual?year=2026&scope=company`

Query params:

- `year` (number, required)
- `scope` (`company` | `department` | `group` | `unallocated`, required)
- `departmentId` (required when `scope=department`)
- `groupId` (required when `scope=group`)
- `months` (optional CSV in `1..12`, e.g. `1,2,3`; omitted means full year)

Response:

- JSON `BudgetVsActualModel` (the same model used by XLSX export generation)
- `meta.totalRowKey` identifies the canonical total row for the current scope
- Clients should resolve totals via `meta.totalRowKey` and must not rely on label fallbacks such as `"Total Budget"`

---

## Git Workflow

Main branch: stable  
Feature work: create a branch
Direct merges into `main` are not allowed.

Example:

    git checkout -b feature/some-change

After changes:

    npm test
    npm run build
    git add .
    git commit -m "type(scope): short description"
    git push -u origin feature/some-change
    ./scripts/pr-create.sh <classification>
    ./scripts/pr-merge.sh

---

## Notes

- Repository Prisma reads use best-effort in-memory TTL caching (default `60000ms`, configurable via `FINANCE_REPO_CACHE_TTL_MS`)
- Do not commit .env
- Do not bypass finance aggregation entrypoint
- Do not add finance logic inside components

## Currency display

- All monetary values in the app represent **USD thousands**.
- Standard display everywhere: use `formatUsdThousandsK` for explicit `$...K`.
- Approved compact exception (`$...K/$...M`) via `formatUsdCompactFromThousands` only for:
  - KPI cards: `Revenue`, `Gross Profit`
  - Dashboard Liquidity & Ratios: `Cash Position`, `Total Liquidity`
- Do not implement currency formatting in UI/components directly. Always use helpers from:
  - `src/lib/finance/format.ts`

---

## Departments – BvA (Dashboard)

The Executive Dashboard includes a **Departments – BvA** summary section.

### Purpose
Provides a high-level Budget vs Actual variance per department (by functional group: COGS, R&D, S&M, G&A) for the currently selected dashboard period.

Only variance ($ and %) is displayed.

Clicking a department tile navigates to:
`/reports/budget-vs-actual`
with the exact same:
- year
- periodType
- month / quarter
- compare selection
- department scope

---

### Architecture

This feature:
- Does NOT duplicate aggregation logic
- Does NOT introduce new calculation paths
- Does NOT modify API contracts
- Does NOT fork Budget vs Actual logic

All calculations rely on the **existing aggregation pipeline** in:

    src/lib/finance

Specifically:
- `computeDepartmentBvaSummary`
- `BVA_GROUP_NAME_TO_CATEGORY`
- `sumPeriodValues`

The CS department split remains governed by:

    src/lib/finance/department-rules.ts

Therefore:
- Summary
- Detailed
- Departments
- Budget vs Actual
- Dashboard Departments – BvA

all rely on the same single source of truth.

---

## UI Updates – Sidebar & Dashboard Polish (v0.3)

Recent UI and stability improvements include:

### Sidebar Redesign
- Full sidebar visual refresh to match updated internal design language.
- Sticky full-height sidebar (`h-screen`, `sticky top-0`) that does not scroll with page content.
- Brand logo migrated to static SVG served from `/public/brand/pictime-logo.svg`.
- Cleaned user section:
  - Name bolded
  - Role styled with muted section-header tone
  - Logout rendered as standalone wide button (no boxed container)

### KPI & Dashboard Improvements
- KPI cards resized for improved hierarchy and readability.
- Mini trend bars visually enhanced (taller, wider, deterministic rendering).
- Standardized negative percentage formatting across the app (accounting-style parentheses).

### Hydration Stability Fix
- Resolved Next.js hydration mismatch in `MiniBars.tsx` by eliminating floating-point variance between SSR and client.
- All SVG numeric attributes now use stable integer values.

These changes:
- Do NOT modify finance aggregation logic.
- Do NOT alter report APIs.
- Maintain strict separation between UI and finance engine.

---

### Guardrails

Future department changes must:
1. Be implemented via department rules only
2. Never fork aggregation
3. Never duplicate totals logic
4. Preserve unified pipeline consistency

---

## Repository Governance & Git Policy

This repository enforces a **strict linear history (100%)**.
See `GOVERNANCE.md` for the authoritative meta-policy and documentation authority model.

### Merge Strategy

- Merge commits: disabled
- Squash merges: disabled
- Rebase merges: enabled (required)
- All merges must happen via Pull Request

Result:
- Clean, linear `main`
- No merge bubbles
- Clear commit-level audit trail

---

### CI Enforcement

GitHub Actions workflow:

- Runs on: pull_request + push to main
- Steps:
  - lint
  - test
  - build

All PRs must pass CI before merge.

---

### Shared Git Hooks

This repository uses a shared hooks directory:

    git config --local core.hooksPath .githooks

Hook enforced:

- `pre-push`: blocks direct pushes to `main`

This guarantees:
- No accidental direct commits to main
- PR + rebase-only workflow

Emergency bypass (not recommended):

    git push --no-verify

---

### Why This Matters (Finance Context)

This project contains financial logic.

Strict governance ensures:

- No silent aggregation drift
- No bypass of guardrails
- Deterministic audit trail
- Reproducible builds
- CI-verified state at every merge

This is intentional and part of the system's safety design.
