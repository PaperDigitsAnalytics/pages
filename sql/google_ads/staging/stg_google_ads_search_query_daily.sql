CREATE OR REPLACE TABLE `big-button-383207.ads_staging.stg_google_ads_search_query_daily`
PARTITION BY date
AS
SELECT
  customer_id,
  campaign_id,
  ad_group_id,
  ad_group_ad_ad_id AS ad_id,
  segments_date AS date,
  segments_device AS device,
  segments_ad_network_type AS ad_network_type,
  segments_search_term_match_type AS search_term_match_type,
  search_term_view_search_term AS search_term,
  search_term_view_status AS search_term_status,
  metrics_impressions AS impressions,
  metrics_clicks AS clicks,
  SAFE_DIVIDE(metrics_cost_micros, 1000000) AS cost,
  metrics_conversions AS conversions,
  metrics_conversions_value AS conversion_value,
  metrics_all_conversions AS all_conversions,
  metrics_all_conversions_value AS all_conversions_value,
  metrics_ctr AS ctr,
  metrics_average_cpc AS average_cpc,
  metrics_cost_per_conversion AS cost_per_conversion,
  _PARTITIONTIME AS source_partition_time
FROM `big-button-383207.google_ads.p_ads_SearchQueryStats_8977224868`;
