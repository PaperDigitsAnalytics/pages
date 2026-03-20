CREATE OR REPLACE TABLE `big-button-383207.ads_staging.stg_google_ads_campaign_conversion_daily`
PARTITION BY date
AS
SELECT
  customer_id,
  campaign_id,
  segments_date AS date,
  segments_ad_network_type AS ad_network_type,
  segments_conversion_action AS conversion_action,
  segments_conversion_action_name AS conversion_action_name,
  segments_conversion_action_category AS conversion_action_category,
  segments_conversion_attribution_event_type AS conversion_attribution_event_type,
  metrics_conversions AS conversions,
  metrics_conversions_value AS conversion_value,
  metrics_value_per_conversion AS value_per_conversion,
  _PARTITIONTIME AS source_partition_time
FROM `big-button-383207.google_ads.p_ads_CampaignConversionStats_8977224868`;
