# Engineering Guardrails (Workflow Enforcement)

## Why local/script enforcement exists
- Branch protection and required checks are not available in this repo context (GitHub API permission limitation, e.g. 403 for branch-protection operations).
- To keep safety guarantees, enforcement is implemented in local hooks and canonical PR scripts.

## GitHub Actions Workflows
### CI (`.github/workflows/ci.yml`)
- Runs `lint`, `test`, and `build` as parallel jobs with the same command gates as before.
- `test` job still runs unit tests, Prisma generate/migrate/seed, DB fingerprint guardrail, and Playwright smoke tests.
- Uses npm dependency cache via `actions/setup-node` and restores Next.js incremental cache from `.next/cache`.
- Next.js cache keys include OS, Node major, lockfile hash, and key build config hashes (`next.config.*`, `package.json`, `tsconfig.json`, etc.), with restore-key fallback.
- Purpose: deterministic correctness gates for code, DB seed stability, and top-level route smoke coverage.

### PR policy (`.github/workflows/pr-policy.yml`)
- Enforces PR body classification presence.
- Fails when no Change Classification checkbox is selected.
- Purpose: force explicit change class disclosure in every PR.

### Docs mirror (`.github/workflows/docs-mirror.yml`)
- Mirrors a strict whitelist from private repo to public docs mirror.
- Public mirror target remains read-only for contributors: all edits happen in private `finance-dashboard`.
- Includes fail-fast assertions to prevent accidental source/code leakage.
- Intentionally does not mirror implementation code, server code, Prisma schema/migrations, or private runtime internals.

## Script Enforcement
### `scripts/pr-create.sh`
- Canonical PR creation path: `./scripts/pr-create.sh <classification>`.
- Generates PR body from `.github/PULL_REQUEST_TEMPLATE.md`.
- Selects exactly one classification checkbox and validates it on the created PR.
- Rejects running from `main`.

### `scripts/pr-merge.sh`
- Canonical merge path.
- Resolves current PR, waits for checks to start, watches checks, then merges with `--rebase --delete-branch`.
- Fails fast if checks are missing/failed.

### `scripts/install-git-hooks.sh` + hooks
- Auto-installed via `postinstall`.
- Installs wrappers for:
  - `.husky/pre-commit` (`npm run lint` + `npm test`)
  - `.husky/pre-push` (blocks push to `main` + `npm run build`)
- Purpose: enforce local quality gates before commit/push.

## Guardrail Tests
### `src/guardrails/*`
- Policy and architecture scanners (imports/boundaries/determinism/formatting constraints).
- Contract drift detectors and safety assertions for finance rules.

### Contract fixtures
- Fixtures: `src/contract-fixtures/*`
- Guard test: `src/guardrails/contract-fixtures.test.ts`
- Current contract case ids:
  - `budget-vs-actual`
  - `income-statement`
  - `balance-sheet-report`
  - `cash-flow`
- Note: `src/contract-fixtures/balance-sheet.model.json` is the fixture file for the `balance-sheet-report` contract case (filename retained).
- Update flow (intentional contract changes only):
  - `UPDATE_CONTRACT_FIXTURES=1 npx vitest run src/guardrails/contract-fixtures.test.ts`
- Policy: fixture updates require PR classification `Contract change`.

## Remaining non-blockable risks (without branch protection)
- Manual GitHub UI merge can bypass local script flow.
- `--no-verify` can bypass local hooks.

Policy expectation: do not bypass local enforcement in normal flow.

## Where to Look
- Workflows: `.github/workflows/ci.yml`, `.github/workflows/pr-policy.yml`, `.github/workflows/docs-mirror.yml`
- PR scripts: `scripts/pr-create.sh`, `scripts/pr-merge.sh`
- Hook installer and hooks: `scripts/install-git-hooks.sh`, `.husky/pre-commit`, `.husky/pre-push`
- Guardrails: `src/guardrails/`
- Contract fixtures: `src/contract-fixtures/`, `src/guardrails/contract-fixtures.test.ts`
