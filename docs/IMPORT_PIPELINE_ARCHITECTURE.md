# Import Pipeline Architecture

## Scope

- Source systems: IL accounting system and US accounting system.
- Current operational import assumption: CSV/XLSX exports.
- Format evolution is expected; import architecture must remain adapter-based so new export formats can be added without rewriting finance core.

## Pipeline Stages

1. Ingest
- Accept artifact uploads and capture immutable file metadata.

2. Parse
- Parse source rows from adapter-specific CSV/XLSX readers.

3. Normalize
- Normalize parsed records into canonical intermediate ledger structures.

4. Map
- Apply account/category mapping rules into finance model keys.

5. Validate
- Run deterministic validation checks before finance persistence.

6. Persist Artifacts
- Store file-level and row-level import artifacts for traceability.

7. Aggregate
- Feed normalized mapped outputs into finance aggregation/report pipelines.

## Required Artifacts For Insights

- File metadata (source system, upload timestamp, fingerprint/hash, uploader).
- Parse outcomes (row counts, parse failures, schema mismatches).
- Mapping coverage reports (mapped/unmapped account counts, fallback rules used).
- Validation anomalies (missing periods, duplicate rows, sign/currency anomalies, outliers).

## Core Validations

- Missing months for expected period windows.
- Outlier values relative to deterministic thresholds/baselines.
- Unmapped accounts or partially mapped categories.
- Duplicate uploads / duplicate row fingerprints.
- Sign or currency anomalies by account class/rule policy.

## Traceability Requirement

The system must maintain an auditable chain:
- Imported row
→ Normalized ledger row
→ Aggregated/reported output cell

Each reported anomaly or insight must be explainable via this chain using stable evidence references.
