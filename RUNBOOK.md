# Finance Dashboard Runbook

## Purpose
This runbook defines the single canonical way to make changes in this repository.
It exists to keep execution consistent, safe, and reproducible without relying on memory.
Use it as the default operating checklist for every change.

## Session Start Protocol (Mandatory)
At the beginning of every new ChatGPT session related to this repository:
- Confirm adherence to `RUNBOOK.md`.
- Re-state that work will follow the Standard Change Flow.
- Do not execute or suggest terminal commands until this acknowledgment step is complete.
- Work must not begin until this protocol is acknowledged.

## Manual Edit Prohibition
- The user MUST never edit files manually.
- All changes MUST be performed via Codex-generated patches or terminal commands.
- The user executes commands and pastes outputs only.
- The assistant MUST never instruct manual file edits.
- This rule is absolute and non-optional.

## Golden Rules
- Never work directly on `main`.
- Always prefer minimal diffs and smallest safe change scope.
- Keep finance boundaries intact: `src/lib/finance` remains pure; IO stays in server/repository/API layers.
- No debug artifacts in runtime code (logs, banners, dev-only paths).
- Preserve determinism and contract discipline (no silent API/model/export changes).

## Standard Change Flow

1. Prep
- [ ] Ensure clean working tree.
- [ ] Update local `main`.
- [ ] Create a feature branch.
- [ ] MUST start from an up-to-date `main` branch (do not branch off another feature/docs branch unless intentionally stacking PRs; stacked PRs must be explicit).
- [ ] Close the running application before structural or wide-impact changes.

```bash
git status -sb
git checkout main
git pull --rebase origin main
git checkout -b feat/short-name
```

2. Implement
- [ ] Use explicit prompts with:
  - Goal
  - Hard constraints
  - Files allowed to change
- [ ] Keep scope tight and avoid unrelated edits.

3. Verify (after every meaningful change)
- [ ] Run required checks locally.
- [ ] Local DB setup: `npm run db:up` then `npm run db:migrate` then `npm run db:seed` (or `npm run db:reset` for clean slate).
- [ ] `npm run db:seed` includes `prisma generate`, so no separate manual generate step is required.
- [ ] E2E smoke checks run in CI; run locally with `npx playwright install` (once) then `npm run test:e2e`.

```bash
npm run lint
npm test
npm run build
```

4. Review before commit
- [ ] Inspect changed files and confirm only intended diffs.
- [ ] Share `git diff` in chat before proceeding when collaborating.

```bash
git status -sb
git diff
```

5. Commit & PR
- [ ] Use commit format: `type(scope): short description`.
- [ ] Push feature branch.
- [ ] PR creation MUST be done via `./scripts/pr-create.sh <classification>` to ensure template + classification are always present.
- [ ] Ensure Change Classification is selected (CI enforces this).
- [ ] Merge MUST be done via `./scripts/pr-merge.sh` (checks gate merge before rebase).
- [ ] Local hooks are auto-enforced (`commit`: lint+test, `push`: build + no direct `main` push).
- [ ] Do not merge via GitHub UI in normal flow (branch protection/required checks are not available).
- [ ] Enforcement model reference: `docs/engineering-guardrails.md`.

```bash
git add .
git commit -m "type(scope): short description"
git push -u origin HEAD
./scripts/pr-create.sh <classification>
./scripts/pr-merge.sh
```

### GitHub Checks – Edge Case
- If `gh pr checks --watch` prints `no checks reported on the '<branch>' branch`, Actions usually have not started yet.
- Wait a few seconds, then re-run `gh pr checks --watch`.
- If needed, open the PR in the browser with `gh pr view --web`.
- Do not merge until required checks appear and pass.

6. Post-merge
- [ ] Sync local `main`.
- [ ] Confirm clean working tree.

```bash
git checkout main
git pull --rebase origin main
git status -sb
```

## Docs Update Triggers
- Update `README.md` for user-facing behavior, conventions, or operational guidance.
- Update `docs/ARCHITECTURE.md` for boundary, contract, migration, or service-extraction changes.
- Update `WORKFLOW.md` for policy/process/CI enforcement rule changes.
- Update `ROADMAP.md` for planning priority or phase shifts.
- Update `PLAN.md` for major governance/workflow/infrastructure decisions (what/why/decision).

## Roadmap Governance Rules (MANDATORY)

A) Change Log Enforcement
- Any change touching finance-critical paths MUST update `docs/MASTER_EXECUTION_ROADMAP.md` Change Log in the same PR.
- Finance-critical paths include:
  - `src/lib/finance/**`
  - `src/server/finance-*`
  - `src/app/api/finance/**`
  - `src/guardrails/**`
  - `prisma/**`
  - `src/types/finance-api.ts`
  - `src/types/public/finance-api.ts`
  - any file under `src/types/**` whose path includes `finance-api`
- CI enforces this via: `src/guardrails/roadmap-changelog-required.test.ts`.
- PRs that modify finance-critical files without updating the Change Log will fail.

B) Task Completion Rule
- When completing any task, phase item, or checkbox listed in `docs/MASTER_EXECUTION_ROADMAP.md`, the checkbox MUST be marked as `[x]` in the same PR.
- Partial completion must be explicitly clarified in the roadmap.
- If the change performed does not correspond to an existing roadmap task, do NOT invent a checkbox; only add a Change Log entry.
- Never leave completed tasks unchecked.

## Roadmap Integrity Rule
- Every completed roadmap item MUST be marked with `[x]`.
- Leaving completed work unchecked is governance drift.
- Phase status indicators MUST match repository reality.
- Documentation MUST reflect actual implementation state.

## Stop Conditions
Stop and investigate before proceeding if any of the following occurs:
- Local `lint`, `test`, or `build` fails.
- PR CI is red.
- Reconciliation or UI↔export parity concern appears.
- Diff scope expands beyond intended files or includes unrelated changes.
- Do not proceed to additional terminal commands unless previous command output has been reviewed.
- If structural or critical files are modified, ensure the running application is stopped first.

## References
- [GOVERNANCE.md](GOVERNANCE.md)
- [WORKFLOW.md](WORKFLOW.md)
- [docs/engineering-guardrails.md](docs/engineering-guardrails.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [PLAN.md](PLAN.md)
- [ROADMAP.md](ROADMAP.md)

## Automations & Enforcement
- Canonical enforcement reference: [docs/engineering-guardrails.md](docs/engineering-guardrails.md).
- This includes CI workflows, PR policy checks, docs mirror behavior, scripts, hooks, and guardrail tests.
