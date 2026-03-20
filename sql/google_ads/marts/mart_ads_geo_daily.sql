CREATE OR REPLACE TABLE `big-button-383207.ads_mart.mart_ads_geo_daily`
PARTITION BY date
AS
SELECT
  date,
  customer_id,
  campaign_id,
  campaign_name,
  campaign_status,
  advertising_channel_type,
  advertising_channel_sub_type,
  device,
  ad_network_type,
  country_criterion_id,
  location_type,
  most_specific_location,
  impressions,
  clicks,
  cost,
  conversions,
  conversion_value,
  all_conversions,
  all_conversions_value,
  interactions,
  view_through_conversions,
  ctr,
  average_cpc,
  cost_per_conversion,
  roas,
  conversion_rate
FROM `big-button-383207.ads_intermediate.int_google_ads_geo_daily`;
