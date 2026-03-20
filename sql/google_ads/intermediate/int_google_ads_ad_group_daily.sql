CREATE OR REPLACE TABLE `big-button-383207.ads_intermediate.int_google_ads_ad_group_daily`
PARTITION BY date
AS
SELECT
  s.date,
  s.customer_id,
  s.campaign_id,
  c.campaign_name,
  c.campaign_status,
  g.ad_group_id,
  g.ad_group_name,
  g.ad_group_status,
  g.ad_group_type,
  s.device,
  s.ad_network_type,
  s.impressions,
  s.clicks,
  s.cost,
  s.conversions,
  s.conversion_value,
  s.interactions,
  s.view_through_conversions,
  SAFE_DIVIDE(s.clicks, NULLIF(s.impressions, 0)) AS ctr,
  SAFE_DIVIDE(s.cost, NULLIF(s.clicks, 0)) AS cpc,
  SAFE_DIVIDE(s.cost, NULLIF(s.conversions, 0)) AS cpa,
  SAFE_DIVIDE(s.conversion_value, NULLIF(s.cost, 0)) AS roas,
  SAFE_DIVIDE(s.conversions, NULLIF(s.clicks, 0)) AS conversion_rate
FROM `big-button-383207.ads_staging.stg_google_ads_ad_group_daily` s
LEFT JOIN `big-button-383207.ads_staging.stg_google_ads_campaign` c
  USING (customer_id, campaign_id)
LEFT JOIN `big-button-383207.ads_staging.stg_google_ads_ad_group` g
  USING (customer_id, campaign_id, ad_group_id);
