CREATE OR REPLACE TABLE `big-button-383207.ads_mart.mart_ads_click_stats_daily`
PARTITION BY date
AS
SELECT
  date,
  customer_id,
  campaign_id,
  campaign_name,
  ad_group_id,
  ad_group_name,
  device,
  ad_network_type,
  click_type,
  gclid,
  keyword_text,
  keyword_match_type,
  clicks
FROM `big-button-383207.ads_intermediate.int_google_ads_click_stats`;
