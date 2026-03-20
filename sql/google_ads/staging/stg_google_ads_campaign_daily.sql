CREATE OR REPLACE TABLE `big-button-383207.ads_staging.stg_google_ads_campaign_daily`
PARTITION BY date
AS
SELECT
  customer_id,
  campaign_id,
  segments_date AS date,
  segments_device AS device,
  segments_ad_network_type AS ad_network_type,
  metrics_impressions AS impressions,
  metrics_clicks AS clicks,
  SAFE_DIVIDE(metrics_cost_micros, 1000000) AS cost,
  metrics_conversions AS conversions,
  metrics_conversions_value AS conversion_value,
  metrics_interactions AS interactions,
  metrics_view_through_conversions AS view_through_conversions,
  _PARTITIONTIME AS source_partition_time
FROM `big-button-383207.google_ads.p_ads_CampaignBasicStats_8977224868`;
