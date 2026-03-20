CREATE OR REPLACE TABLE `big-button-383207.ads_staging.stg_google_ads_click_stats`
PARTITION BY date
AS
SELECT
  customer_id,
  campaign_id,
  ad_group_id,
  segments_date AS date,
  segments_device AS device,
  segments_ad_network_type AS ad_network_type,
  segments_click_type AS click_type,
  click_view_gclid AS gclid,
  click_view_keyword_info_text AS keyword_text,
  click_view_keyword_info_match_type AS keyword_match_type,
  metrics_clicks AS clicks,
  _PARTITIONTIME AS source_partition_time
FROM `big-button-383207.google_ads.p_ads_ClickStats_8977224868`;
