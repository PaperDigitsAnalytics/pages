# BigQuery Migration Map

Project: `despreker`

This maps the current dataset landscape to the new target structure.

## Action legend
- **keep** = keep as-is for now, but reclassify its role clearly
- **move** = move/rename into the new target layer
- **merge** = combine with other datasets into one new target dataset
- **rebuild** = keep the business purpose, but rebuild the tables/views in the new target layer instead of physically moving as-is
- **retire** = likely archive or phase out after review

| Current dataset | Current role | Target dataset | Action | Notes |
|---|---|---|---|---|
| 1_staging_advertising | mixed staging for ad platforms | staging_advertising | merge | Fold source-cleaning logic into one advertising staging layer |
| 1_staging_analytics | mixed staging for analytics metadata and tests | staging_analytics | merge | Keep useful source-cleaning only; drop experiments/test tables later |
| 2_intermediate_advertising | advertising transformation layer | intermediate_advertising | merge | Good conceptual fit, but unify naming with other *_int datasets |
| 2_intermediate_analytics | analytics transformation layer | intermediate_analytics | merge | Expand beyond current minimal contents |
| 3_dim | classic warehouse dimensions | intermediate_advertising | rebuild | Better as dim_* tables inside intermediate layer |
| 3_dim_analytics | analytics dimensions/checks | intermediate_analytics | rebuild | Better as dim/check tables inside intermediate_analytics |
| 4_facts | classic warehouse facts | intermediate_advertising | rebuild | Better as fct_* tables inside intermediate_advertising |
| analytics_321878476 | raw GA4 export | staging_analytics | keep | Treat as source export only, not reporting layer |
| bigquery_logs | platform/audit logs | (outside target marketing layers) | keep | Keep separate from marketing warehouse design |
| bing_ads | raw/source + light staging mix | staging_advertising | move | Source input for Bing/Microsoft Ads |
| bing_ads_cfg | config placeholder | config | merge | Likely fold into central config if still used |
| bing_ads_int | Bing intermediate dims | intermediate_advertising | merge | Merge into unified advertising intermediate layer |
| clickup | operational tasks | staging_crm | keep | Likely support/ops input, not core marketing mart |
| config | governance/configuration | config | keep | Central business rules, thresholds, channel grouping |
| cookiebot | consent data | staging_consent | move | Clear fit for consent staging |
| dashboards | dashboard-facing outputs | dashboards | keep | Should contain serving outputs only, not core transformation logic |
| data_checks | data quality layer | data_checks | keep | Central validation/check layer |
| facebook_ads | Meta/Facebook ads source | staging_advertising | move | Merge with broader advertising staging strategy |
| feed | product/feed support tables | staging_advertising | keep | Keep for now; could later split to staging_product/feed |
| google_ads | raw/source Google Ads export views | staging_advertising | move | Source input for Google Ads |
| google_ads_cfg | config placeholder | config | merge | Fold into central config if active |
| google_ads_int | Google Ads intermediate dims | intermediate_advertising | merge | Merge into unified advertising intermediate layer |
| google_ads_mart | single SEA use-case mart | marts_sea | merge | Good use case, but should live in marts_sea |
| google_analytics | legacy GA4/analytics transformed tables | staging_analytics / intermediate_analytics | rebuild | Split raw-ish tables from useful transformed logic |
| google_search_console | GSC source tables | staging_seo | move | Natural SEO staging source |
| grey_hat_stuff | unclear/legacy | (review) | retire | Name and purpose suggest non-core legacy content |
| linkedin | LinkedIn source data | staging_advertising | move | Advertising source input |
| mapping | lookup/mapping tables | mapping | keep | Central mapping layer |
| marts | generic performance marts | marts_sea | merge | Reclassify mart-by-use-case instead of generic mart bucket |
| meta | Meta organic/page data | staging_analytics or staging_advertising | keep | Keep, but clarify whether paid/organic use case dominates |
| mm_ads_cfg | maturity model config | config | merge | Keep only if still part of active governance |
| mm_ads_int | maturity/intermediate ads tables | intermediate_advertising | merge | Merge into unified advertising intermediate layer |
| mm_ads_marts | ad-focused marts | marts_sea | merge | Strong fit, but rename into target mart layer |
| mm_backup | backup / legacy | (review) | retire | Keep only until replacements are validated |
| mm_dashboard | maturity dashboard outputs | dashboards | keep | If still used, keep as serving layer only |
| mm_seo_marts | SEO-focused marts | marts_seo | merge | Strong fit for target SEO mart layer |
| mm_test_wouter | personal/test dataset | (review) | retire | Likely temporary sandbox |
| pipedrive | CRM / deal data | staging_crm | move | Core CRM source for lead and revenue linkage |
| RFM_analysis | separate analysis sandbox | marts_cro or retire | review | Depends on whether it supports active CRO/CRM use cases |
| staging | old generic staging | staging_analytics or staging_crm | merge | Likely absorb and then retire generic bucket |
| trends | keyword/trend source tables | staging_seo | move | Good SEO input layer |

## First migration priorities

### Priority 1: SEA foundation
Move/rebuild around:
- `google_ads`
- `bing_ads`
- `facebook_ads`
- `google_ads_int`
- `bing_ads_int`
- `mm_ads_int`
- `google_ads_mart`
- `marts`
- `mm_ads_marts`

Target:
- `staging_advertising`
- `intermediate_advertising`
- `marts_sea`

### Priority 2: SEO foundation
Move/rebuild around:
- `google_search_console`
- `trends`
- `mm_seo_marts`

Target:
- `staging_seo`
- `intermediate_growth`
- `marts_seo`

### Priority 3: CRO / analytics / consent / CRM
Move/rebuild around:
- `analytics_321878476`
- `google_analytics`
- `cookiebot`
- `pipedrive`
- relevant `dashboards` outputs

Target:
- `staging_analytics`
- `staging_consent`
- `staging_crm`
- `intermediate_analytics`
- `intermediate_growth`
- `marts_cro`

## Principles for migration
- Do **not** delete legacy datasets yet
- Rebuild high-value tables into the new structure first
- Keep legacy datasets readable until outputs are validated
- Move by use case, not by historical naming convention
- Prefer rebuilding views/tables in the new target datasets over physically moving opaque legacy tables
