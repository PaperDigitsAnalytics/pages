CREATE OR REPLACE TABLE `big-button-383207.ads_intermediate.int_google_ads_campaign_daily`
PARTITION BY date
AS
SELECT
  s.date,
  s.customer_id,
  s.campaign_id,
  c.campaign_name,
  c.campaign_status,
  c.campaign_serving_status,
  c.advertising_channel_type,
  c.advertising_channel_sub_type,
  c.bidding_strategy_type,
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
FROM `big-button-383207.ads_staging.stg_google_ads_campaign_daily` s
LEFT JOIN `big-button-383207.ads_staging.stg_google_ads_campaign` c
  USING (customer_id, campaign_id);
