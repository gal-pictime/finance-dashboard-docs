# Finance Dashboard – Master Execution Roadmap (Governance V2)

> Internal Strategic Execution Document  
> Authoritative operational plan for architecture, finance engine, reporting, export, consolidation and automation.
> This file lives in the private repo and is mirrored to the public docs repo.
> Items are removed ONLY after full phase completion + validation.

Last Updated: 2026-02-20

---

# STATUS LEGEND

- 🟢 Completed
- 🟡 In Progress
- 🔵 Planned
- 🔴 Blocked
- ⚫ On Hold

---

# CHANGE LOG (MANDATORY)

| Date | PR | Area | Phase | Summary |
|------|----|------|-------|---------|
| 2026-02-20 | #73 | Balance Sheet Unification | 0/Phase 1 | Remove legacy balance-sheet endpoint; migrate dashboard to report model; add guardrail; align docs. |
| 2026-02-20 | #74 | Balance Sheet Unification | Phase 1 | Remove BalanceSheetResponse legacy type; align API/public types and docs. |
| 2026-02-20 | #75 | Governance | N/A | Move MASTER_EXECUTION_ROADMAP under docs/ for public mirror. |

Every merged PR MUST:
1. Map to a section below
2. Update phase progress
3. Be logged here

---

# MASTER ARCHITECTURE DEPENDENCY GRAPH

```mermaid
graph TD

A[Finance Engine Core<br/>src/lib/finance]

A --> B[Aggregation Pipeline]
A --> C[Period & Compare Engine]
A --> D[FX Layer (Future)]
A --> E[Consolidation Layer]
A --> F[Unified Export Engine]

B --> BS[Balance Sheet]
B --> IS[Income Statement]
B --> CF[Cash Flow]

BS --> DASH[Dashboard]
IS --> DASH
CF --> DASH

BS --> EXP
IS --> EXP
CF --> EXP

EXP[Export Engine] --> XLSX[XLSX Reports]
EXP --> CONS_EXP[Consolidated Export]

E --> BS
E --> IS
E --> CF

D --> B
```

---

# EXECUTION ORDER (STRICT)

1. Balance Sheet Unification  
2. Aggregation Convergence  
3. Cash Flow Structural Stabilization  
4. Dashboard Alignment  
5. Unified Export Engine  
6. Consolidation Layer  
7. FX Layer  
8. Engine Extractability  

No skipping order without explicit architectural review.

---

# 0️⃣ FULL FINANCIAL UNIFICATION PROGRAM
Status: 🟡 In Progress

## Objective
Single unified finance model powering:
- Income Statement
- Balance Sheet
- Cash Flow
- Dashboard
- XLSX Export
- Future external service extraction

---

## Phase 1 – Balance Sheet Unification
- [x] Introduced BalanceSheetReportModel
- [x] Engine-driven report endpoint
- [x] Dashboard migration to report model
- [x] Remove legacy snapshot endpoint
- [x] Remove BalanceSheetResponse type
- [x] Remove getBalanceSheetModel from engine
- [x] Add legacy usage guardrail

Exit Criteria:
- Only one Balance Sheet model exists
- No `/api/finance/balance-sheet` usage
- All tests pass

---

## Phase 2 – Aggregation Convergence
- [ ] Single aggregation entry point verified
- [ ] Remove duplicate totals logic
- [ ] Remove duplicate variance logic
- [ ] Period selection unified
- [ ] Budget vs Actual share same source

Exit Criteria:
- Summary / Detailed / Departments identical totals source
- No drift across reports

---

## Phase 3 – Cash Flow Structural Alignment
- [ ] Validate delta reconciliation vs Balance Sheet
- [ ] Ensure no snapshot dependency
- [ ] Add invariant reconciliation tests
- [ ] Remove redundant balance fetch

Exit Criteria:
- Cash Flow deterministically reconciles to Balance Sheet

---

## Phase 4 – Dashboard Alignment
- [ ] Dashboard uses report models only
- [ ] No finance logic in UI
- [ ] KPI logic centralized in src/lib/finance
- [ ] Compare logic identical to Income Statement

Exit Criteria:
- Dashboard derived solely from unified engine output

---

# 1️⃣ UNIFIED EXPORT ARCHITECTURE PROGRAM
Status: 🟡 In Progress

## Objective
Single export engine shared by:
- Income Statement
- Balance Sheet
- Cash Flow
- Budget vs Actual
- Future Consolidated reports

---

## Phase 1 – DTO Alignment
- [ ] All reports expose stable export DTO
- [ ] Remove per-report export logic
- [ ] Align compare column structure

---

## Phase 2 – Shared Export Builder
- [ ] Central builder in src/lib/finance/export
- [ ] Stable column order contract
- [ ] Deterministic row hierarchy
- [ ] No UI-level formatting logic

---

## Phase 3 – Structural Invariants
- [ ] Snapshot export tests per report
- [ ] Column order invariant test
- [ ] Compare parity validation

---

## Phase 4 – Styling Layer
- [ ] Column width normalization
- [ ] Header hierarchy formatting
- [ ] Percent formatting consistency
- [ ] Board-ready appearance

Exit Criteria:
- All reports export through identical architecture

---

# 2️⃣ CONSOLIDATION PROGRAM (Multi-Entity)
Status: 🔵 Planned

## Objective
Support consolidated financial statements (IL + US / Multi-Entity).

---

## Phase 1 – Architectural Design
- [ ] Define consolidation scope
- [ ] Define elimination rules
- [ ] Define intercompany adjustments
- [ ] Define ownership % future extension
- [ ] ADR approval

---

## Phase 2 – Engine-Level Consolidation
- [ ] Implement consolidation aggregator
- [ ] Integrate elimination adjustments
- [ ] Ensure compare compatibility
- [ ] Preserve DTO structure

---

## Phase 3 – Reporting & Export
- [ ] Consolidated IS / BS / CF support
- [ ] Export identical structure to single entity
- [ ] Add consolidation metadata field

---

## Phase 4 – Guardrails
- [ ] Intercompany imbalance detection
- [ ] Consolidation invariant tests
- [ ] Cross-entity reconciliation tests

Exit Criteria:
- Consolidated financials deterministic and reconciled

---

# 3️⃣ FX (MULTI-CURRENCY) PROGRAM
Status: 🔵 Planned

## Objective
Support currency normalization and multi-currency reporting.

---

## Phase 1 – Design
- [ ] Base currency strategy
- [ ] FX rate storage model
- [ ] Historical conversion logic
- [ ] No double conversion guarantee

---

## Phase 2 – Engine Integration
- [ ] FX normalization layer
- [ ] Conversion before aggregation
- [ ] Remove USD assumptions

---

## Phase 3 – Reporting & Export
- [ ] Currency metadata
- [ ] FX export compatibility
- [ ] Validation tests

Exit Criteria:
- All reports consistent under FX mode

---

# 4️⃣ KPI SYSTEM REDESIGN
Status: 🔵 Planned

## Objective
Enterprise-grade KPI system aligned with unified engine.

---

## Phase 1 – KPI Contract
- [ ] Define KPI DTO
- [ ] Derived strictly from engine
- [ ] No UI calculations

---

## Phase 2 – Visual Redesign
- [ ] Modern card layout
- [ ] Compare alignment
- [ ] Period selector alignment

---

## Phase 3 – Validation
- [ ] Deterministic output tests
- [ ] Compare consistency tests

Exit Criteria:
- KPI logic isolated in finance layer

---

# 5️⃣ AUTOMATION & ARCHITECTURAL GUARDRAILS
Status: 🟡 In Progress

---

## Phase 1 – Contract Drift Protection
- [ ] Balance Sheet fixture protection
- [ ] Cash Flow fixture protection
- [ ] Export contract fixture tests

---

## Phase 2 – Legacy & Policy Guardrails
- [x] Forbid `/api/finance/balance-sheet`
- [ ] No finance math in UI
- [ ] No Prisma in src/lib/finance
- [ ] No debug endpoints in production

---

## Phase 3 – CI Enforcement
- [ ] Enforce PR classification
- [ ] Enforce lint/test/build
- [ ] Prevent dev artifacts

---

## Phase 4 – DB & Aggregation Invariants
- [ ] Schema fingerprint test
- [ ] Aggregation consistency test
- [ ] Determinism snapshot test

Exit Criteria:
- Architectural drift impossible without CI failure

---

# 6️⃣ FINANCE ENGINE EXTRACTABILITY
Status: 🔵 Planned

---

## Phase 1 – Boundary Isolation
- [ ] IO isolated to server layer
- [ ] DTO separation
- [ ] No framework coupling

---

## Phase 2 – External Contract Definition
- [ ] Stable engine interface
- [ ] Integration simulation test

Exit Criteria:
- Engine portable as external service

---

# REMOVAL POLICY

A section may be removed only when:
1. All phases complete
2. Tests pass
3. Docs updated
4. No regression after merge
5. Logged in Change Log

Until then — it stays.
