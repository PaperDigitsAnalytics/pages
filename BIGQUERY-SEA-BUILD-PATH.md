# SEA Build Path

Project: `despreker`

Goal: define the first practical build path into the new target structure:
- `staging_advertising`
- `intermediate_advertising`
- `marts_sea`

## 1. Source inputs

### Google Ads
Dataset: `google_ads`

Key source objects identified:
- `Campaign_3612505204` (campaign metadata)
- `CampaignBasicStats_3612505204` (campaign daily performance)
- `AdGroup_3612505204` (ad group metadata)
- `AdGroupBasicStats_3612505204` (ad group daily performance)
- `AccountBasicStats_3612505204` (account daily performance)

Observations:
- Source objects are **views**
- Naming is platform-export style, not warehouse-friendly
- Date grain already exists in performance views

### Microsoft / Bing Ads
Dataset: `bing_ads`

Key source objects identified:
- `raw_campaign_basic_stats`
- `raw_ad_group_basic_stats`
- `bing_campaign_settings`
- `bing_ad_group_settings`

Observations:
- Source objects are **tables**
- Performance and settings are already separated
- Time field uses `TimePeriod` instead of a clean `date`

### Meta / Facebook Ads
Dataset: `facebook_ads`

Key source objects identified:
- `campaign`
- `campaign_conversion`
- `adset`
- `adset_conversion`

Observations:
- Performance and conversions are separated
- Grain and naming are not yet standardized
- This source is likely useful for paid social inside broader advertising, but the first SEA build should probably prioritize Google + Bing

---

## 2. Recommended first scope

### Start with Google Ads + Bing Ads only
Reason:
- highest relevance for SEA
- source structures are clearer
- easier to standardize at campaign/ad group level
- fastest path to useful marts

Meta can be added after the first advertising model is working.

---

## 3. New target tables

## staging_advertising

### stg_google_ads_campaign
Purpose:
- clean campaign metadata from `Campaign_3612505204`

Expected columns:
- `platform` = 'google_ads'
- `account_id`
- `campaign_id`
- `campaign_name`
- `channel_type`
- `channel_subtype`
- `bidding_strategy_type`
- `serving_status`
- `budget_id`
- `budget_amount`
- `start_date`
- `end_date`
- `ingested_at`

### stg_google_ads_campaign_daily
Purpose:
- clean campaign daily stats from `CampaignBasicStats_3612505204`

Expected columns:
- `platform`
- `account_id`
- `campaign_id`
- `date`
- `device`
- `impressions`
- `clicks`
- `cost`
- `conversions`
- `conversion_value`
- `interactions`
- `view_through_conversions`

### stg_google_ads_ad_group
Purpose:
- clean ad group metadata from `AdGroup_3612505204`

Expected columns:
- `platform`
- `account_id`
- `campaign_id`
- `ad_group_id`
- `ad_group_name`
- `ad_group_status`
- `ad_group_type`
- `bidding_strategy_type`
- `cpc_bid`
- `target_cpa`
- `target_roas`
- `ingested_at`

### stg_google_ads_ad_group_daily
Purpose:
- clean ad group daily stats from `AdGroupBasicStats_3612505204`

Expected columns:
- `platform`
- `account_id`
- `campaign_id`
- `ad_group_id`
- `date`
- `device`
- `impressions`
- `clicks`
- `cost`
- `conversions`
- `conversion_value`
- `interactions`
- `view_through_conversions`

### stg_bing_campaign
Purpose:
- clean campaign metadata from `bing_campaign_settings`

Expected columns:
- `platform` = 'bing_ads'
- `account_id`
- `campaign_id`
- `campaign_name`
- `campaign_status`
- `campaign_type`
- `campaign_sub_type`
- `bid_strategy_type`
- `budget`
- `budget_type`
- `target_cpa`
- `target_roas`
- `modified_at`

### stg_bing_campaign_daily
Purpose:
- clean campaign daily stats from `raw_campaign_basic_stats`

Expected columns:
- `platform`
- `account_id`
- `campaign_id`
- `date`
- `device`
- `impressions`
- `clicks`
- `cost`
- `conversions`
- `conversion_value`

### stg_bing_ad_group
Purpose:
- clean ad group metadata from `bing_ad_group_settings`

Expected columns:
- `platform`
- `account_id`
- `campaign_id`
- `ad_group_id`
- `ad_group_name`
- `ad_group_status`
- `bid_strategy_type`
- `cpc_bid`
- `network_distribution`
- `modified_at`

### stg_bing_ad_group_daily
Purpose:
- clean ad group daily stats from `raw_ad_group_basic_stats`

Expected columns:
- `platform`
- `account_id`
- `campaign_id`
- `ad_group_id`
- `date`
- `device`
- `impressions`
- `clicks`
- `cost`
- `conversions`
- `conversion_value`

---

## intermediate_advertising

### dim_account
Unified account dimension across ad platforms

Columns:
- `platform`
- `account_id`
- `account_name`

### dim_campaign
Unified campaign dimension across ad platforms

Columns:
- `platform`
- `account_id`
- `campaign_id`
- `campaign_name`
- `channel_type`
- `channel_subtype`
- `status`
- `bidding_strategy_type`

### dim_ad_group
Unified ad group dimension across ad platforms

Columns:
- `platform`
- `account_id`
- `campaign_id`
- `ad_group_id`
- `ad_group_name`
- `ad_group_status`
- `bid_strategy_type`

### fct_campaign_daily
Unified daily campaign fact table

Columns:
- `platform`
- `account_id`
- `campaign_id`
- `date`
- `device`
- `impressions`
- `clicks`
- `cost`
- `conversions`
- `conversion_value`

### fct_ad_group_daily
Unified daily ad group fact table

Columns:
- `platform`
- `account_id`
- `campaign_id`
- `ad_group_id`
- `date`
- `device`
- `impressions`
- `clicks`
- `cost`
- `conversions`
- `conversion_value`

---

## marts_sea

### sea_adgroup_high_impressions_no_clicks
Purpose:
- surface ad groups wasting visibility without engagement

Core logic:
- high impressions over recent period
- very low / zero clicks

### sea_adgroup_high_cpc_low_ctr
Purpose:
- identify expensive low-engagement ad groups

Core logic:
- elevated CPC
- weak CTR
- enough impressions to matter

### sea_campaign_performance_variance
Purpose:
- highlight campaigns whose recent performance deviates strongly from baseline

Core logic:
- compare last 7-14 days to prior baseline
- cost / conversions / CPA / ROAS shifts

### sea_budget_shift_candidates
Purpose:
- identify campaigns/ad groups where budget could move up or down based on efficiency patterns

Core logic:
- relative efficiency scoring from `fct_campaign_daily` and `fct_ad_group_daily`

---

## 4. Build order

### Phase A: staging
Build first:
1. `stg_google_ads_campaign`
2. `stg_google_ads_campaign_daily`
3. `stg_google_ads_ad_group`
4. `stg_google_ads_ad_group_daily`
5. `stg_bing_campaign`
6. `stg_bing_campaign_daily`
7. `stg_bing_ad_group`
8. `stg_bing_ad_group_daily`

### Phase B: intermediate
Then:
1. `dim_campaign`
2. `dim_ad_group`
3. `fct_campaign_daily`
4. `fct_ad_group_daily`

### Phase C: marts
Then:
1. `sea_adgroup_high_impressions_no_clicks`
2. `sea_adgroup_high_cpc_low_ctr`
3. `sea_campaign_performance_variance`
4. `sea_budget_shift_candidates`

---

## 5. Practical recommendation

Do **not** start with every platform at once.

Start with:
- Google Ads
- Bing Ads

Reason:
- enough structure already exists
- strong relevance for SEA
- faster proof of the new architecture
- lower ambiguity than pulling Meta into the first wave

After the SEA path works, extend the same design to paid social.
