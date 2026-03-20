CREATE OR REPLACE TABLE `big-button-383207.ads_mart.mart_ads_search_query_daily`
PARTITION BY date
AS
SELECT
  date,
  customer_id,
  campaign_id,
  campaign_name,
  ad_group_id,
  ad_group_name,
  ad_id,
  device,
  ad_network_type,
  search_term,
  search_term_status,
  search_term_match_type,
  impressions,
  clicks,
  cost,
  conversions,
  conversion_value,
  all_conversions,
  all_conversions_value,
  ctr,
  average_cpc,
  cost_per_conversion,
  roas,
  conversion_rate
FROM `big-button-383207.ads_intermediate.int_google_ads_search_query_daily`;
