CREATE OR REPLACE TABLE `big-button-383207.ads_mart.mart_ads_asset_group`
AS
SELECT
  customer_id,
  campaign_id,
  campaign_name,
  campaign_status,
  advertising_channel_type,
  advertising_channel_sub_type,
  asset_group_id,
  asset_group_name,
  asset_group_status,
  asset_group_final_urls,
  asset_group_final_mobile_urls
FROM `big-button-383207.ads_intermediate.int_google_ads_asset_group`;
