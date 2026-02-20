# Consolidation Infrastructure Decision

## 1. Purpose
This document records the binding infrastructure decision for consolidation implementation sequencing. It defines what must be introduced immediately, what is explicitly deferred, and why deferral of core foundations creates compounded refactor cost.

## 2. Binding Decision Statement
1. Language/runtime remains TypeScript/Node/Next.
2. No transition to Go.
3. No transition to C#.
4. No microservice split now.
5. No database replacement now.

## 3. Mandatory Foundations to Introduce Now
1. Entity model.
2. Month-atomic period model.
3. Period close and revision controls.
4. Canonical COA dictionary.
5. ConsolidationRun tracking with deterministic fingerprints.
6. Mapping versioning (versioned mapping rules and run pinning).

These foundations are mandatory prerequisites for deterministic consolidation and cannot be deferred without architecture debt accumulation.

## 4. Why These Foundations Are Mandatory Now
## 4.1 Determinism and auditability
1. Without period revision and run tracking, output lineage cannot be reproduced.
2. Without mapping version pinning, identical source inputs can produce divergent outputs.

## 4.2 Exponential refactor risk
1. Delaying canonical COA introduces many-to-many report coupling that must later be untangled.
2. Delaying entity/period normalization causes broad schema and contract rewrites after data volume growth.
3. Delaying run-level fingerprinting prevents confident replay and defect isolation.
4. Delaying close/revision controls embeds mutable-period behavior into workflows, increasing migration risk non-linearly.

## 4.3 Operational risk concentration
1. Manual consolidation shortcuts increase hidden state and reconciliation latency.
2. Parallel logic paths increase defect surface and regression probability.

## 5. What We Are Doing Now
1. Building deterministic consolidation foundations in-process.
2. Enforcing single-pipeline architecture.
3. Enforcing strict engine/IO/UI boundaries.
4. Preserving optional future extraction through clean adapter contracts.

## 6. What We Are NOT Doing Now
1. Deploying a separate consolidation microservice.
2. Replatforming language/runtime.
3. Replacing database infrastructure.
4. Implementing uncontrolled report-specific calculators.

## 7. Extractability Constraint
1. Consolidation engine must remain detachable to an external service without business logic refactor.
2. Infrastructure decisions must preserve this extraction path while staying in-process today.
3. Any decision that adds transport or ORM coupling inside engine logic is non-compliant.

## 8. Cross-Reference
1. Canonical architecture: [consolidation-architecture.md](./consolidation-architecture.md)
2. Data model and constraints: [consolidation-db-schema.md](./consolidation-db-schema.md)
3. Decision record lineage: [consolidation-adr-log.md](./consolidation-adr-log.md)
4. Validation controls: [consolidation-guardrails.md](./consolidation-guardrails.md)
5. Delivery sequencing: [consolidation-roadmap.md](./consolidation-roadmap.md)
