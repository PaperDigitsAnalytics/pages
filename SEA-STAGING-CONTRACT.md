# SEA Staging Contract

Source inputs:
- Google Ads standard connector output in `google_ads`
- Microsoft / Bing Ads tables in `bing_ads`
- Normalization dictionary: `C:\Users\wouter\Documents\spreker\PaperDigits _ Normalisatie.csv`

## Purpose
Define a normalized staging contract so Google Ads and Microsoft Ads can land in separate source-specific staging tables but still share the same naming and downstream compatibility.

## Principles
- Keep source-specific staging tables per platform and grain
- Normalize column names and data types across platforms where practical
- Avoid business logic beyond light cleaning, typing, and source harmonization
- Make intermediate union/join logic straightforward

## Canonical staging table families

### 1. Campaign metadata
Tables:
- `stg_google_ads_campaign`
- `stg_microsoft_ads_campaign`

Canonical columns:
- `platform`
- `account_id`
- `account_name`
- `campaign_id`
- `campaign_name`
- `campaign_status`
- `campaign_type`
- `campaign_subtype`
- `bidding_strategy_type`
- `budget_id`
- `budget_amount`
- `currency_code`
- `tracking_template`
- `final_url_suffix`
- `start_date`
- `end_date`
- `modified_at`
- `ingested_at`

### 2. Campaign daily performance
Tables:
- `stg_google_ads_campaign_daily`
- `stg_microsoft_ads_campaign_daily`

Canonical columns:
- `platform`
- `account_id`
- `campaign_id`
- `date`
- `device_type`
- `impressions`
- `clicks`
- `cost`
- `ctr`
- `cpc`
- `conversions`
- `conversion_rate`
- `conversion_value`
- `cost_per_conversion`
- `roas`
- `view_through_conversions`
- `network`

### 3. Ad group metadata
Tables:
- `stg_google_ads_ad_group`
- `stg_microsoft_ads_ad_group`

Canonical columns:
- `platform`
- `account_id`
- `campaign_id`
- `ad_group_id`
- `ad_group_name`
- `ad_group_status`
- `ad_group_type`
- `language`
- `network`
- `bid_strategy_type`
- `cpc_bid`
- `target_cpa`
- `target_roas`
- `modified_at`
- `ingested_at`

### 4. Ad group daily performance
Tables:
- `stg_google_ads_ad_group_daily`
- `stg_microsoft_ads_ad_group_daily`

Canonical columns:
- `platform`
- `account_id`
- `campaign_id`
- `ad_group_id`
- `date`
- `device_type`
- `impressions`
- `clicks`
- `cost`
- `ctr`
- `cpc`
- `conversions`
- `conversion_rate`
- `conversion_value`
- `cost_per_conversion`
- `roas`
- `view_through_conversions`
- `network`

## Mapping guidance

### Currency / cost handling
- Normalize all cost fields to a numeric monetary value in account currency
- Google Ads connector often stores cost in micros; convert in staging
- Microsoft Ads appears to expose spend already as decimal currency; keep consistent numeric output

### Date handling
- Normalize all time fields to `date`
- Do not leave `TimePeriod` as raw string in staging if it can be parsed cleanly

### Device handling
- Normalize to `device_type`
- Preserve source semantics where possible, but use one canonical field name

### Conversion value
- Google: use `ConversionValue`
- Microsoft: use `Revenue` as canonical `conversion_value` where that is the source equivalent

### ROAS
- Materialize `roas` in staging where source gives enough data
- Otherwise compute as `SAFE_DIVIDE(conversion_value, cost)`

## Recommended first implementation scope
1. Google campaign metadata
2. Google campaign daily
3. Google ad group metadata
4. Google ad group daily
5. Microsoft campaign metadata
6. Microsoft campaign daily
7. Microsoft ad group metadata
8. Microsoft ad group daily

## Not in first wave
- Ads/ad creative grain
- Keyword grain
- Audience grain
- Extension grain

Those can come later once campaign/ad group level is stable.
