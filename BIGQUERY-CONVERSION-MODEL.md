# BigQuery Conversion Model

Project: `despreker`

Goal: handle multiple conversion types without collapsing platform truth, business truth, and optimization signals too early.

## Design principles

1. **Staging preserves source truth**
   - Keep source-native conversion fields and action names where available.
   - Do not decide in staging which conversions are "good" or "primary".

2. **Intermediate normalizes meaning**
   - Create a reusable conversion dimension and a daily conversion fact table.
   - Separate platform-reported conversions from business-priority conversions.

3. **Mapping controls business logic**
   - Use a controlled mapping table to define primary vs secondary conversions.
   - Marts should choose the right conversion lens, not rely on raw source totals.

---

## Source observations

### Google Ads
Available conversion-grain source views:
- `google_ads.CampaignConversionStats_3612505204`
- `google_ads.AdGroupConversionStats_3612505204`

Useful fields observed:
- `ConversionTrackerId`
- `ConversionCategoryName`
- `ConversionTypeName`
- `ConversionAttributionEventType` (campaign-level view)
- `Conversions`
- `ConversionValue`
- `ValuePerConversion`
- `ConversionRate`
- `CostPerConversion`
- `CampaignId`
- `AdGroupId`
- `Date`
- `Device`

Note:
- A separate `ConversionAction_*` table was **not** found in the current connector output.
- Therefore Google conversion action metadata must be derived from the conversion stats views themselves, unless another table appears elsewhere.

### Microsoft Ads
Current fresh source for performance is:
- `bing_ads.daily_performance`

At this stage, no dedicated fresh conversion-action-level table has been confirmed yet.
For Microsoft, conversion granularity may initially remain weaker than Google unless another source table exists.

### Meta / Facebook
Available source tables:
- `facebook_ads.campaign_conversion`
- `facebook_ads.adset_conversion`

Useful fields observed:
- `campaign_id` / `adset_id`
- `conversion`
- `value`
- `date_start`
- `actions_type`

---

## Target model

## 1. mapping.conversion_action_map
Manual + maintained mapping table.

Purpose:
- classify source conversion actions into normalized business meaning
- define primary vs secondary logic
- support consistent reporting across platforms

Suggested columns:
- `platform`
- `source_conversion_id` (nullable if source lacks stable ID)
- `source_conversion_name`
- `source_conversion_category`
- `normalized_conversion_type`
- `normalized_conversion_group`
- `is_primary_conversion`
- `is_secondary_conversion`
- `is_micro_conversion`
- `is_biddable_conversion`
- `is_business_conversion`
- `is_revenue_conversion`
- `include_in_sea_reporting`
- `include_in_seo_reporting`
- `include_in_cro_reporting`
- `notes`
- `active`

### Example normalized values
`normalized_conversion_type`
- `lead_form_submit`
- `qualified_lead`
- `phone_call`
- `whatsapp_click`
- `book_call`
- `purchase`
- `newsletter_signup`
- `offline_conversion`
- `micro_engagement`

`normalized_conversion_group`
- `lead`
- `qualified_lead`
- `revenue`
- `micro`
- `crm`

---

## 2. intermediate_advertising.dim_conversion_action
Canonical conversion action dimension.

Purpose:
- provide a stable conversion lookup for facts and marts
- combine source attributes with mapping logic

Suggested columns:
- `platform`
- `conversion_action_key` (surrogate or deterministic key)
- `source_conversion_id`
- `source_conversion_name`
- `source_conversion_category`
- `source_attribution_event_type`
- `normalized_conversion_type`
- `normalized_conversion_group`
- `is_primary_conversion`
- `is_secondary_conversion`
- `is_micro_conversion`
- `is_biddable_conversion`
- `is_business_conversion`
- `is_revenue_conversion`
- `active`

### Build logic
- For Google Ads:
  - derive unique action rows from `CampaignConversionStats_*` / `AdGroupConversionStats_*`
  - key fields: `ConversionTrackerId`, `ConversionTypeName`, `ConversionCategoryName`
- Join to `mapping.conversion_action_map`
- For Microsoft / Meta later:
  - create same shape from their available action-level fields

---

## 3. intermediate_advertising.fct_conversion_daily
Daily fact table at conversion-action grain.

Purpose:
- preserve conversion detail for platform analysis and business remapping
- avoid collapsing all conversion types into one metric too early

Suggested columns:
- `platform`
- `account_id`
- `campaign_id`
- `ad_group_id` (nullable)
- `date`
- `device_type`
- `conversion_action_key`
- `source_conversion_id`
- `source_conversion_name`
- `source_conversion_category`
- `conversions`
- `conversion_value`
- `value_per_conversion`
- `conversion_rate`
- `cost_per_conversion`
- `source_attribution_event_type`

### Build logic
- Google campaign-level conversion fact from `CampaignConversionStats_3612505204`
- Google ad-group-level conversion fact from `AdGroupConversionStats_3612505204`
- Normalize cost/value types
- Join to `dim_conversion_action`

---

## 4. Reporting lenses derived from the conversion model

Once `dim_conversion_action` and `fct_conversion_daily` exist, marts can expose multiple conversion lenses:

### A. `platform_conversions`
- all source-reported conversions that are active and relevant

### B. `primary_conversions`
- only rows where `is_primary_conversion = true`

### C. `business_conversions`
- only rows where `is_business_conversion = true`

### D. `revenue_conversions`
- only rows where `is_revenue_conversion = true`

This avoids using one ambiguous `conversions` metric everywhere.

---

## Recommended first implementation path

### Phase 1
Create:
- `mapping.conversion_action_map`
- `intermediate_advertising.dim_conversion_action` (Google Ads first)
- `intermediate_advertising.fct_conversion_daily` (Google Ads first)

### Phase 2
Use in marts:
- add `primary_conversions`
- add `business_conversions`
- compare raw platform vs normalized conversion totals

### Phase 3
Extend to:
- Microsoft Ads, if a reliable conversion-grain source is found
- Meta, using `campaign_conversion` / `adset_conversion`

---

## Practical recommendation for now

Start with **Google Ads conversion modeling first** because:
- the source already exposes conversion-grain views
- action naming is visible
- IDs and categories exist
- it is enough to validate the model before extending to other platforms

Do **not** wait for Microsoft or Meta parity before building the conversion model.
