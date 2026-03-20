# BigQuery Target Architecture

Target project: `despreker`

## Goal
Create a cleaner warehouse structure around three layers:

1. **staging**
2. **intermediate**
3. **marts**

Use-case focus:
- **SEA**
- **SEO**
- **CRO**

## Target datasets

### Staging
- `staging_advertising`
- `staging_analytics`
- `staging_crm`
- `staging_seo`
- `staging_consent`

### Intermediate
- `intermediate_advertising`
- `intermediate_analytics`
- `intermediate_growth`

### Marts
- `marts_sea`
- `marts_seo`
- `marts_cro`

### Governance / support (existing)
- `config`
- `mapping`
- `data_checks`
- `dashboards`

## Layer intent

### Staging
Raw or lightly cleaned source data. No business logic beyond basic typing, dedupe, column naming, and source normalization.

### Intermediate
Reusable transformation layer where cross-source logic, joins, channel logic, and analytical business rules live.

### Marts
Decision-oriented datasets for specific use cases. A mart should exist to support a concrete action or recurring analysis, not just to store a nice table.

## Example scope by mart domain

### marts_sea
Examples:
- budget shift candidates
- campaign efficiency
- ad group waste signals
- search term gaps
- bidding diagnostics

### marts_seo
Examples:
- query/page gaps
- declining pages
- CTR opportunities
- content cluster growth

### marts_cro
Examples:
- landing page dropoff patterns
- CTA performance
- form completion friction
- page intent mismatch

## Migration principle
For now, create the new structure **next to** the legacy datasets.
Do not remove or migrate legacy datasets until mappings and fill logic are clear.

Next step after structure creation:
- map old datasets/tables to new target datasets
- then design fill logic
