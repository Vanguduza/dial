# ADR: SandPIM as fitment schema reference only (D-38)

**Status:** Accepted  
**Date:** 2026-08-12  
**Pack:** §15 T2 · v4 D-38  

## Context

DIAL needs OEM/fitment modelling for Spare search. SandPIM is a useful **schema / pattern** donor for part–vehicle relationships.

## Decision

- **SandPIM is not runtime SoR.** Catalogue authority = DIAL Postgres (`master_products` / `offers` / Factory tables) + Meilisearch index `spare_offers_v1` for browse.
- Absorb fitment field ideas into DIAL migrations and Meili docs (`chassis_codes`, `oem`, `normalisedOem`, etc.) — do not run SandPIM as a live dependency.
- UX donors remain pattern-only (D-38); money/search SoR stay DIAL packages.

## Consequences

- T2 ships Meili settings + stub docs + Factory/search_no_result stubs without a SandPIM service.
- Future fitment enrichment may cite SandPIM field names in comments/ADRs only.
