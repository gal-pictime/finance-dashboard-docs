# ADR-001: Public Docs Mirror (Private → Public)

- Status: Accepted
- Date: 2026-02-20

## Context

The project maintains a public documentation mirror repository (`gal-pictime/finance-dashboard-docs`) synchronized from the private repository. The mirror must provide governance and public contract references without exposing implementation details or schema-coupled internal types.

## Decision

1. Mirror only a strict whitelist:
   1. Governance/docs files
   2. `README.md`, `ROADMAP.md`, `WORKFLOW.md`, `RUNBOOK.md`
   3. `src/types/public/**`
2. Never mirror implementation code.
3. Never mirror Prisma-dependent types or DB schema-coupled type sources.
4. Enforce fail-fast safety assertions in the mirror workflow to prevent accidental leakage.
5. Push to the public mirror using repository-scoped SSH credentials and support empty public repo initialization.

## Consequences

1. The public repository is a stable reference for documentation and public API contract shapes.
2. Public contracts must be maintained in `src/types/public/**` and must not import Prisma.
3. Any attempt to mirror additional content under `src/` outside `src/types/public/**` fails the workflow.

## Alternatives Considered

1. Mirror `src/types/**` directly: rejected due to Prisma dependency leakage risk.
2. Mirror Prisma-derived schema types: rejected due to schema exposure and external dependency coupling.
