# Finance Dashboard – Workflow Rules

This document defines the permanent working rules for this project.
Automation and enforcement implementation details are centralized in `docs/engineering-guardrails.md`.

Public mirror policy:
- All work (code + docs + process) MUST happen only in the private repo: `finance-dashboard`.
- `finance-dashboard-docs` is READ-ONLY and exists only as an automated mirror.
- Never open branches/PRs or make edits in the public repo.

## Definitions
- MUST: mandatory requirement; violations block merge.
- SHOULD: expected default behavior; deviations require explicit rationale in PR.
- MAY: optional guidance; use judgment.

## 0) Minimal Risk Rule
If something works, do not touch it unless:
- A real bug exists
- A clear feature is needed
- A structural improvement prevents future drift
No unnecessary refactors.

## 1) Codex Rules
- Codex executes tasks, it does not invent architecture.
- Every prompt must include: Goal, Hard constraints, Minimal diffs, Files allowed to change.
- After every Codex output, always run:
  - npm run lint
  - npm test
  - npm run build
Only continue if all pass.

## 2) Git Branch Strategy
Never work directly on main.
Start every change:
- git checkout main
- git pull --rebase origin main
- git checkout -b feat/short-name

Finish every change:
- npm run lint
- npm test
- npm run build
- git status -sb
- git add .
- git commit -m "type(scope): description"
- git push -u origin feat/short-name

Open a PR (terminal-only):
- ./scripts/pr-create.sh <classification>
- gh pr checks --watch

PR body guidance:
- MUST use `./scripts/pr-create.sh <classification>` as the canonical PR creation path.
- MUST NOT use `gh pr create --body ...` (bypasses template and can fail CI).
- Avoid direct `gh pr create --fill` in normal flow; use the script to guarantee classification selection.
- Otherwise CI (`.github/workflows/pr-policy.yml`) will fail.

Merge (linear history):
- MUST use `./scripts/pr-merge.sh` (checks must pass before merge).
- Do not merge via GitHub UI in normal flow (branch protection/required checks are not available).

### Minimal Close Command

When a pull request is ready to merge, always wait for CI checks to complete successfully before merging.  
Use the following consolidated command to watch checks, merge the PR, and sync your local main branch:

- PR="$(gh pr list --head "$(git branch --show-current)" --state open --json number --jq '.[0].number')" && gh pr checks "$PR" --watch && ./scripts/pr-merge.sh "$PR" && git fetch origin main && git checkout main && git pull --rebase origin main && git status -sb

After merge:
- git checkout main
- git pull --rebase origin main

Notes:
- Direct pushes to main are blocked by the shared pre-push hook (see .githooks/README.md).
- Git hooks are auto-installed on `npm install` and enforced locally.
- `git commit` is blocked if `npm run lint` or `npm test` fails; `git push` is blocked if `npm run build` fails.
- Bypass is possible with --no-verify for emergencies only.
- Enforcement model reference: `docs/engineering-guardrails.md`.
- Local Postgres flow: `npm run db:up` -> `npm run db:migrate` -> `npm run db:seed` (or `npm run db:reset` for clean slate); CI provisions Postgres automatically.

## 3) Commit Message Format

Allowed types: feat, fix, refactor, chore, docs
Examples:
- feat(export): add XLSX export for income statement
- fix(budget): correct net profit computation
- refactor(finance): move prisma IO to server repository
- docs: expand README with export usage

## 4) Finance Architecture Rules
src/lib/finance must remain PURE.
Allowed: aggregation, computation, formatting, export builders, rules.
Forbidden: Prisma, fetch, Next.js route logic, UI logic.
Prisma and IO only in: src/server/* and src/app/api/*

## Change Classification (Mandatory)
Every PR MUST declare one primary class:
- Cosmetic
- Refactor (no behavior)
- Behavior change
- Contract change
- Structural change

Required actions matrix:
- Cosmetic: tests MAY, docs MAY, CTO Review Card not required.
- Refactor (no behavior): tests SHOULD (targeted), docs MAY, CTO Review Card not required.
- Behavior change: tests MUST, docs SHOULD, CTO Review Card MAY.
- Contract change: tests MUST, docs MUST, CTO Review Card required.
- Structural change: tests MUST, docs MUST, CTO Review Card required.

No PR may merge without explicit classification in the PR template.
CI enforces this via `.github/workflows/pr-policy.yml`; PRs fail if no Change Classification checkbox is selected in the PR body.

## 5) Scope Rules
Departments scope is always RAW:
- No rules
- No reclass
- No merge
- DB truth only
Company scope always applies rules via department-rules.ts

## 6) Export Rules
Exports are additive only (new endpoint).
Do not change existing report JSON shapes.
Structure:
- src/lib/finance/export/
- src/app/api/finance/export/<report>/

## 7) Testing Guardrails
Every important rule must have a small unit test:
- RAW stays RAW
- Company rules apply correctly
- Budget scope rules stay correct
- No direct money formatting in runtime code. Use finance format helpers only.
- Guardrail test exists and fails CI on violation.
- Seed/migration changes MUST update `src/server/db-fingerprint.test.ts` snapshot in the same PR.
- CI runs `npm run test:db` after `prisma db seed`.

## 8) Documentation Rule
Every new feature requires updating README.md.

## No Silent Contract Changes
JSON/API shape changes, report model changes, and XLSX/export structure changes MUST be:
- Declared explicitly in the PR description.
- Documented in README/ARCHITECTURE as applicable.
- Covered by tests that would fail on unintended drift.

Silent contract changes are prohibited.

Contract fixture guard (all existing finance reports):
- Deterministic JSON fixtures are committed under `src/contract-fixtures/`.
- Guardrail test `src/guardrails/contract-fixtures.test.ts` fails on output drift.
- Local update flow: `UPDATE_CONTRACT_FIXTURES=1 npx vitest run src/guardrails/contract-fixtures.test.ts`.
- Any fixture update MUST be classified as `Contract change` in the PR.

## Determinism Policy (src/lib/finance)
Finance engine logic MUST be deterministic:
- No `Date.now()` / `new Date()` for finance semantics.
- No random sources (`Math.random`, UUID randomness) in finance computation.
- No implicit locale/timezone dependence in finance math.
- Deterministic ordering and stable aggregation semantics are required.

## UI Finance Boundary (Enforced)
UI layer (`src/app/**`, `src/components/**`) finance imports are restricted by ESLint:
- Allowed value imports: `src/lib/finance/format.ts`, `src/lib/finance/period.ts`
- Allowed type imports: finance type modules as needed
- Forbidden: all other direct finance engine imports in UI

Type-only imports are NOT a general exception; imports are allowlist-based by path only.
If a UI change needs additional finance behavior, expose it through API/model contracts instead of importing deeper engine internals.
Current legacy report/dashboard surfaces are explicitly allowlisted in ESLint until migrated; no new exceptions may be added without structural review.
Legacy allowlist entries must be reduced over time. Adding a new allowlist entry requires Structural change classification + CTO Review Card.

## Severity Definitions
- Sev-1: finance correctness risk with executive/board impact (reconciliation/export parity/contract integrity).
- Sev-2: significant finance workflow risk without immediate executive misstatement.

Sev-1 in an affected finance area blocks merges in that area until a reproducing guardrail test exists and passes.

## 9) Assistant Rule
ChatGPT does not directly modify GitHub files.
It may only review, suggest prompts, and provide exact terminal commands.

## 10) End-of-Change Checklist
Before finishing any change:
- npm test
- npm run build
- clean git status
- correct commit format
- push to GitHub
- update docs if needed

---

## 6) Running Local API Tests

Before calling any API endpoint locally (curl, browser, etc):

    npm run dev

Only then test endpoints.

Never test API routes without a running dev server.

---

## 7) Terminal Command Safety

When running command blocks:

- Only paste commands inside code blocks.
- Do not paste explanatory text.
- Do not paste lines starting with #.
- If a command fails, stop and inspect before continuing.

---

## 8) Repo TTL Cache (best-effort)

- The TTL cache in src/server/finance-repository.ts is best-effort (performance optimization).
- It must never be required for correctness.
- You can control the TTL via env var FINANCE_REPO_CACHE_TTL_MS (milliseconds).
- Setting FINANCE_REPO_CACHE_TTL_MS=0 disables caching.
- Measure cache effectiveness locally with:
  - npm run measure:repo-cache
- The measurement command requires a configured `.env` and accessible DB.
- The script clears repo cache after warmup and resets stats before timed iterations.
- Example runs:
  - `FINANCE_REPO_CACHE_TTL_MS=0 ITERATIONS=50 npm run measure:repo-cache`
  - `FINANCE_REPO_CACHE_TTL_MS=60000 ITERATIONS=50 npm run measure:repo-cache`
  - `FINANCE_REPO_CACHE_TTL_MS=60000 ITERATIONS=50 PARALLEL=1 npm run measure:repo-cache`
  - `FINANCE_REPO_CACHE_TTL_MS=60000 ITERATIONS=50 PARALLEL=1 DUPLICATES=8 npm run measure:repo-cache` (should show `cacheStats.dedupes > 0`)
  - `FINANCE_REPO_CACHE_TTL_MS=60000 ITERATIONS=50 PARALLEL=1 DUPLICATES=8 CLEAR_EACH_ITERATION=1 npm run measure:repo-cache` (stress mode: dedupes should scale toward `ITERATIONS*(DUPLICATES-1)`)
- Note: `FINANCE_REPO_CACHE_TTL_MS=0` disables cache, so `cacheStats.dedupes` will remain `0` by design.

---

## CTO Review Card (Required for Structural Changes)

This section applies to any PR that introduces structural, architectural, or cross-cutting changes. Routine UI tweaks or small bug fixes do NOT require this card.

For structural changes, the PR description must include a **CTO Review Card** with the following 6 fields:

1. Goal  
   - What problem does this solve now?

2. Future Constraints  
   - Does this introduce lock-in, tight coupling, or limit future expansion?
   - What future capabilities does it enable or restrict?

3. Reversibility  
   - If this decision turns out wrong, how can we roll it back or migrate away?

4. Contracts Impacted  
   - APIs, export structure, aggregation invariants, finance helpers, period semantics, etc.

5. Migration Path  
   - If this evolves later (e.g., DB change, multi-entity, new report), what is the upgrade path?

6. Risk / Reward  
   - Why is this change worth the risk?
   - What would happen if we do nothing?

The Finance Dashboard is built with long-term ambitions. Every structural decision must be evaluated for forward compatibility. High-risk architectural changes are allowed only when the long-term benefit clearly outweighs the cost.

---

## Ownership & Approval Matrix

High-risk areas require explicit ownership and approval:
- Aggregation invariants / rules (`aggregation.ts`, `department-rules.ts`): Finance engineering owner + reviewer.
- Report contracts/models (`report-models`, `use-cases`, API payloads): Finance engineering owner + API reviewer.
- Export structure/contracts (`src/lib/finance/export`, export routes): Finance engineering owner + reporting reviewer.
- Period/compare semantics (`period.ts` and compare helpers): Finance engineering owner + report-owner reviewer.

Contract or structural changes in these areas require CTO Review Card completion.

## Emergency Protocol
For reconciliation failures, UI↔XLSX mismatches, or Sev-1 finance regressions:
1. Stop-the-line: pause merges for affected finance area.
2. Revert or disable the risky path immediately (favor safe rollback).
3. Add a guardrail test reproducing the incident before reintroducing changes.
4. Document the incident and root cause in PR/issue notes.
5. Verify parity and reconciliation checks pass before re-enable.

Emergency fixes must still preserve linear history and PR traceability.

## Engine Extractability Checklist

For structural changes, reviewers must verify:

- No new dependencies from `src/lib/finance` to Next.js or server-only modules.
- Finance logic remains pure and framework-agnostic; IO stays in server/repository layers.
- Contract impacts are explicitly assessed (API shapes, totals semantics, period/compare semantics, export structures).
- UI and XLSX parity implications are evaluated when models/exports change.
- Clear API-route adapter boundaries are preserved (thin orchestration, no duplicated business logic).
- Reversibility/migration path is briefly stated in the PR.
- Required tests/guardrails are added or updated for affected invariants.
- Documentation is updated when contracts, exports, or structural rules change.

## CI Enforcement
- PR classification is enforced in CI (`.github/workflows/pr-policy.yml`).
- A PR must include at least one selected Change Classification checkbox in the PR body.

---

## Timing commands (zsh-safe)

When measuring command runtimes in zsh, prefer this form (works reliably with env vars):

    time env FINANCE_REPO_CACHE_TTL_MS=60000 ITERATIONS=50 npm run measure:repo-cache

Avoid putting env vars directly before .
