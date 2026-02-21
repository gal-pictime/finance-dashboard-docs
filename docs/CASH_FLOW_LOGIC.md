# Cash Flow Logic

## 1) Scope
- This document describes the accounting/financial logic used to compute Cash Flow in the application.
- It is not an architecture, API-route, or DB-query document.
- Source of truth is the finance core implementation in `src/lib/finance`.

## 2) Inputs
- Actuals (P&L series): monthly values for revenue/expense accounts.
- Actual detail: monthly category/line-item breakdown used for depreciation.
- Balance sheet snapshots: beginning and ending balance accounts for the selected period.
- Basis selection:
  - `CASH_EQUIVALENTS`
  - `TOTAL_LIQUIDITY`

## 3) Step-by-step computation

### A. Net Profit
- Actual monthly series are summed over the selected period using `sumPeriodValues(...)` and `CASH_FLOW_ACTUAL_KEYS`.
- P&L totals are converted into computed metrics via `buildPnlComputed(...)`.
- Cash Flow uses `NET_PROFIT` as the starting point.

### B. Depreciation
- Depreciation is derived from Actual Detail line item `DEPRECIATION`.
- It is summed across expense categories: `COGS`, `RD`, `SM`, `GA` for the selected period.

### C. Balance deltas
- For each `BalanceAccountKey`:
  - `delta[key] = end[key] - begin[key]`
- This is centralized in `src/lib/finance/balance-delta.ts` (`computeBalanceDeltas`).

### D. Operating cash flow
- Operating lines are:
  - Net Profit
  - Depreciation
  - Operating delta-lines from `BALANCE_ACCOUNT_DICTIONARY`
- Delta-lines are generated from dictionary definitions and formulas.
- Accounts included in the selected basis are excluded from delta-line expansion (`isIncludedInBasis(...)`) to avoid double counting liquidity-basis accounts as working-capital adjustments.

### E. Investing cash flow (PPE / fixed assets)
- PPE handling is explicit:
  - `ppeDelta = ΔPPE`
  - where `ΔPPE = endPPE - beginPPE` (from balance deltas)
  - `capexRawDefault = ppeDelta + depreciation`
  - `capexRaw = plugs.capex` if provided, else `capexRawDefault`
  - `CapEx (Purchases) = -max(0, capexRaw)`
  - `Proceeds from sale of PPE = max(0, -capexRaw)`
- Other investing delta-lines are dictionary-driven (based on current dictionary configuration).

### F. Financing cash flow
- Financing lines are dictionary-driven financing delta-lines.
- Sign/formula for each line is taken from dictionary `cashFlowLine.valueFormula`.

### G. Net Change and reconciliation
- `netChange = operatingTotal + investingTotal + financingTotal`
- Basis balances:
  - `beginningBalance = sumBasisBalance(balanceBegin, basis)`
  - `endingBalance = sumBasisBalance(balanceEnd, basis)`
- Reconciliation equation:
  - `reconciliationDiff = beginningBalance + netChange - endingBalance`
- Expected behavior:
  - `reconciliationDiff` should be approximately `0` (floating-point tolerance).

## 4) Sign conventions
- Positive values represent cash inflow.
- Negative values represent cash outflow.
- PPE examples:
  - Purchases are negative (`-max(0, capexRaw)`).
  - Sale proceeds are positive (`max(0, -capexRaw)`).

## 5) Determinism & invariants
- Cash Flow uses deterministic period and delta computations from finance core helpers.
- Phase 3 reconciliation invariant (per basis):
  - `endingBalance - beginningBalance == netChange` (within tolerance)
  - `reconciliationDiff ≈ 0`
- Invariant test:
  - `src/lib/finance/cash-flow/cash-flow-balance-sheet-reconciliation.test.ts`

## 6) Canonical source pointers
- Engine logic:
  - `src/lib/finance/cash-flow/cash-flow-engine.ts`
- Report-model composition:
  - `src/lib/finance/cash-flow-report.ts`
- Balance account dictionary and line formulas:
  - `src/lib/finance/balance-account-dictionary.ts`
- Shared balance mapping/delta/basis helpers:
  - `src/lib/finance/balance-delta.ts`
- Period-range mapping used by cash flow:
  - `src/lib/finance/cash-flow/cash-flow-config.ts`
- P&L computed formulas:
  - `src/lib/finance/pnl-engine.ts`
