# Engineering Guardrails (Workflow Enforcement)

## Why local/script enforcement exists
- Branch protection and required checks are not available in this repo context (GitHub API permission limitation, e.g. 403 for branch-protection operations).
- To keep safety guarantees, enforcement is implemented in local hooks and canonical PR scripts.

## What is enforced locally
- `pre-commit`: blocks commits unless `npm run lint` and `npm test` pass.
- `pre-push`: blocks direct pushes to `main` and blocks pushes unless `npm run build` passes.

## What is enforced in PR flow
- PR creation is enforced via `./scripts/pr-create.sh <classification>` to ensure template + Change Classification are present.
- PR merge is enforced via `./scripts/pr-merge.sh`, which gates merge on checks before rebase merge.

## Remaining non-blockable risks (without branch protection)
- Manual GitHub UI merge can bypass local script flow.
- `--no-verify` can bypass local hooks.

Policy expectation: do not bypass local enforcement in normal flow.
