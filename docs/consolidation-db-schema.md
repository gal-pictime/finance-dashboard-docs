# Consolidation Database Schema

## 1. Purpose
This document defines the consolidation data model required to support deterministic, traceable multi-entity financial consolidation. It specifies table contracts, relationships, constraints, idempotency behavior, and fingerprint/snapshot policies. It must be read with [consolidation-architecture.md](./consolidation-architecture.md) and [consolidation-guardrails.md](./consolidation-guardrails.md).

## 2. Scope Boundaries
### 2.1 What we are doing
1. Defining foundational consolidation tables.
2. Enforcing month-atomic period controls.
3. Enforcing mapping and run versioning.
4. Supporting reproducible run-level fingerprints.

### 2.2 What we are NOT doing
1. Defining implementation migrations here.
2. Defining UI models or route payload details.
3. Defining non-deterministic import shortcuts.

## 3. Canonical Data Assumption
All report outputs are derived from canonical entries generated from source rows, mapping rules, and adjustments. This schema defines storage required to produce and verify those canonical entries deterministically.

## 4. Core Tables
## 4.1 Entity
### Purpose
Defines legal/reporting entities participating in consolidation.

### Required fields
1. `id` (PK)
2. `code` (unique; e.g., `IL`, `US`)
3. `name`
4. `baseCurrency`
5. `isActive`

### Constraints
1. `code` unique and immutable.
2. Inactive entities cannot accept new import batches.

## 4.2 Period
### Purpose
Defines month-atomic accounting periods and close status.

### Required fields
1. `id` (PK)
2. `period` (YYYY-MM, unique)
3. `isClosed`
4. `revision` (integer)
5. `closedAt` (nullable)
6. `closedBy` (nullable)

### Constraints
1. `period` unique.
2. `revision >= 1`.
3. Consolidation runs must reference a closed period revision.

## 4.3 ImportBatch
### Purpose
Tracks import jobs and idempotency control.

### Required fields
1. `id` (PK)
2. `entityId` (FK -> Entity)
3. `periodId` (FK -> Period)
4. `sourceSystem`
5. `fileName`
6. `fileHash`
7. `importedAt`
8. `importedBy`
9. `status`

### Constraints
1. Unique `(entityId, periodId, sourceSystem, fileHash)`.
2. `fileHash` required for idempotent re-import detection.

## 4.4 SourceStatementRow
### Purpose
Stores imported statement-level source lines before canonical mapping.

### Required fields
1. `id` (PK)
2. `importBatchId` (FK -> ImportBatch)
3. `rowNumber`
4. `sourceAccountCode`
5. `sourceAccountName`
6. `amount`
7. `currency`
8. `rawPayload` (optional JSON)

### Constraints
1. Unique `(importBatchId, rowNumber)`.
2. Immutable after import completion.

## 4.5 COAMappingVersion
### Purpose
Versioned mapping namespace for source-to-canonical conversion.

### Required fields
1. `id` (PK)
2. `versionTag` (unique)
3. `createdAt`
4. `createdBy`
5. `isActive`
6. `notes` (optional)

### Constraints
1. At most one active mapping version per environment.
2. Consolidation runs always persist `mappingVersionId`.

## 4.6 COAMappingRule
### Purpose
Defines deterministic source mapping rules for one mapping version.

### Required fields
1. `id` (PK)
2. `mappingVersionId` (FK -> COAMappingVersion)
3. `entityId` (FK -> Entity; nullable for shared rules)
4. `sourceAccountCode`
5. `canonicalAccountKey`
6. `dimensionDefaults` (optional JSON)
7. `effectiveFromPeriodId` (FK -> Period)
8. `effectiveToPeriodId` (nullable FK -> Period)

### Constraints
1. No overlapping effective ranges for same `(mappingVersionId, entityId, sourceAccountCode)`.
2. `canonicalAccountKey` must exist in canonical dictionary.

## 4.7 AdjustmentJournal
### Purpose
Header record for manual or system adjustments.

### Required fields
1. `id` (PK)
2. `periodId` (FK -> Period)
3. `entityId` (FK -> Entity; nullable for consolidated)
4. `journalType` (elimination, reclass, manual)
5. `description`
6. `createdAt`
7. `createdBy`
8. `status`

### Constraints
1. Journal lines must balance to zero per journal.
2. Posted journals are immutable.

## 4.8 AdjustmentLine
### Purpose
Line-level accounting effect for adjustment journals.

### Required fields
1. `id` (PK)
2. `journalId` (FK -> AdjustmentJournal)
3. `lineNumber`
4. `canonicalAccountKey`
5. `amount`
6. `currency`
7. `counterpartyEntityId` (nullable FK -> Entity)
8. `department` (nullable)

### Constraints
1. Unique `(journalId, lineNumber)`.
2. Sum of `amount` by `journalId` must equal zero.

## 4.9 FxRateSet
### Purpose
Versioned FX rates used by a consolidation run.

### Required fields
1. `id` (PK)
2. `periodId` (FK -> Period)
3. `baseCurrency`
4. `rateSource`
5. `publishedAt`
6. `hash`

### Constraints
1. Unique `(periodId, baseCurrency, hash)`.
2. Consolidation run binds exactly one FX set.

## 4.10 ConsolidationRun
### Purpose
Represents one deterministic execution of consolidation for a period revision.

### Required fields
1. `id` (PK)
2. `periodId` (FK -> Period)
3. `periodRevision`
4. `mappingVersionId` (FK -> COAMappingVersion)
5. `fxRateSetId` (FK -> FxRateSet)
6. `status`
7. `startedAt`
8. `finishedAt` (nullable)
9. `triggeredBy`
10. `inputFingerprint`
11. `outputFingerprint`

### Constraints
1. Unique run identity by `(periodId, periodRevision, mappingVersionId, fxRateSetId, inputFingerprint)`.
2. `outputFingerprint` required for completed successful runs.

## 5. Relationships Summary
1. Entity 1..N ImportBatch.
2. Period 1..N ImportBatch.
3. ImportBatch 1..N SourceStatementRow.
4. COAMappingVersion 1..N COAMappingRule.
5. Period 1..N AdjustmentJournal.
6. AdjustmentJournal 1..N AdjustmentLine.
7. Period 1..N FxRateSet.
8. Period + revision + mapping + FX identify ConsolidationRun deterministically.

## 6. Idempotency and Fingerprints
## 6.1 File-level idempotency
1. `ImportBatch.fileHash` prevents duplicate ingestion for identical files.
2. Duplicate hashes in the same entity/period/source are rejected or no-op.

## 6.2 Run-level fingerprints
1. `inputFingerprint` covers:
   1. Source batch hashes
   2. Mapping version id
   3. Adjustment set
   4. FX set
   5. Period and revision
2. `outputFingerprint` covers canonical output set and final report payloads.

## 7. Snapshot vs Recompute Decision
### 7.1 Decision
Use recompute-first with run metadata and deterministic fingerprints.

### 7.2 Rationale
1. Avoids stale materialized outputs when mapping or adjustments change.
2. Preserves reproducibility with immutable run identifiers.
3. Supports external service extraction without schema rewrite.

### 7.3 What we are NOT doing
1. Persisting mutable consolidated totals as a primary source.
2. Returning non-reproducible ad hoc calculations.

## 8. Canonical COA Structure (V1)
## 8.1 Balance Sheet groups
1. Assets
2. Liabilities
3. Equity

## 8.2 Income Statement groups
1. Revenue
2. Expenses

## 8.3 Example canonical keys
1. `BS_ASSET_CASH`
2. `BS_ASSET_RECEIVABLES`
3. `BS_LIABILITY_AP`
4. `BS_EQUITY_SHARE_CAPITAL`
5. `IS_REVENUE_SUBSCRIPTIONS`
6. `IS_EXPENSE_COGS`
7. `IS_EXPENSE_GA`

## 8.4 Expansion strategy
1. Add keys additively through dictionary versioning.
2. Do not repurpose existing keys.
3. Bridge old-to-new key mappings explicitly when decomposition is required.

## 8.5 Why not GL-level on day one
1. Statement-level COA reduces initial mapping entropy across different source systems.
2. GL-level design at inception adds disproportionate implementation and governance overhead.
3. Statement-level V1 still supports strict traceability with source references and mapping versions.
