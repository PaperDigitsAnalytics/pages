# BigQuery Advertising Work Handoff — 2026-03-16

## Workspace
- Root: `C:\Users\wouter\Documents\pages-v2`
- BigQuery project used in scripts: `despreker`

## What was built earlier in this thread
Advertising modeling work was started in BigQuery with a Google-first structure:

### Layers / datasets in use
- `staging_advertising`
- `intermediate_advertising`
- `marts_sea`
- `mapping`

### Important objects mentioned/created
- `mapping.conversion_action_map`
- `intermediate_advertising.dim_conversion_action`
- `intermediate_advertising.fct_conversion_daily`
- `marts_sea.sea_campaign_conversion_mix`
- `marts_sea.sea_campaign_conversion_mismatch`
- `marts_sea.sea_adgroup_high_impressions_no_clicks`
- `marts_sea.sea_adgroup_high_cpc_low_ctr`
- `marts_sea.sea_campaign_performance_variance`

## Important scripts in workspace
- `scripts/build-google-conversion-layer.js`
- `scripts/improve-sea-conversion-marts.js`
- `scripts/fix-all-conversions-layer.js`
- possibly other SEA mart scripts in `scripts/`

## What definitely happened
- Conversion marts were iterated multiple times.
- There was confusion around whether the Google Ads source fields were named:
  - `AllConversions` / `AllConversionValue`
  - or `AllConv` / `AllConvValue`
- Runtime outputs later strongly suggested the shorter names are the real source fields.
- Several assistant claims about the fix being complete were premature.

## Current trust level
Treat the current live schema as **unverified until re-checked**.
Do not trust earlier chat claims without querying BigQuery directly.

## Recommended first steps in the fresh session
1. Read the scripts above.
2. Inspect the live schema for:
   - `intermediate_advertising.fct_conversion_daily`
   - `marts_sea.sea_campaign_conversion_mix`
   - `marts_sea.sea_campaign_conversion_mismatch`
3. Run a direct verification query for whether these fields exist:
   - `all_conversions`
   - `all_conversion_value`
   - `total_all_conversions_90d`
   - `all_to_recorded_conversion_ratio`
4. If broken, repair the fact view first, then rebuild the marts.
5. Only report success after a verification query succeeds.

## Suggested verification query
```sql
SELECT
  campaign_name,
  total_conversions_90d,
  total_all_conversions_90d,
  all_to_recorded_conversion_ratio,
  conversion_diagnostic_flag
FROM `despreker.marts_sea.sea_campaign_conversion_mismatch`
LIMIT 10
```

## Notes for the next session
- Prefer truth over optimism: verify before claiming done.
- The technical context is mostly preserved in files/scripts, not in chat.
- User wants to continue this work in a cleaner fresh session, possibly using Gemini.
