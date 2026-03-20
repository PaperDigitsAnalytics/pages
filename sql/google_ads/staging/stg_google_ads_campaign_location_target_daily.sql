CREATE OR REPLACE TABLE `big-button-383207.ads_staging.stg_google_ads_campaign_location_target_daily`
PARTITION BY date
AS
SELECT
  customer_id,
  campaign_id,
  campaign_criterion_criterion_id AS criterion_id,
  segments_date AS date,
  metrics_impressions AS impressions,
  metrics_clicks AS clicks,
  SAFE_DIVIDE(metrics_cost_micros, 1000000) AS cost,
  metrics_conversions AS conversions,
  metrics_conversions_value AS conversion_value,
  metrics_all_conversions AS all_conversions,
  metrics_all_conversions_value AS all_conversions_value,
  metrics_interactions AS interactions,
  metrics_view_through_conversions AS view_through_conversions,
  metrics_ctr AS ctr,
  metrics_average_cpc AS average_cpc,
  metrics_cost_per_conversion AS cost_per_conversion,
  _PARTITIONTIME AS source_partition_time
FROM `big-button-383207.google_ads.p_ads_CampaignLocationTargetStats_8977224868`;
