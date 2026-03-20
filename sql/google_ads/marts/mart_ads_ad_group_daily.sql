CREATE OR REPLACE TABLE `big-button-383207.ads_mart.mart_ads_ad_group_daily`
PARTITION BY date
AS
SELECT
  date,
  customer_id,
  campaign_id,
  campaign_name,
  campaign_status,
  ad_group_id,
  ad_group_name,
  ad_group_status,
  ad_group_type,
  device,
  ad_network_type,
  impressions,
  clicks,
  cost,
  conversions,
  conversion_value,
  interactions,
  view_through_conversions,
  ctr,
  cpc,
  cpa,
  roas,
  conversion_rate
FROM `big-button-383207.ads_intermediate.int_google_ads_ad_group_daily`;
