CREATE OR REPLACE TABLE `big-button-383207.ads_staging.stg_google_ads_asset_group`
AS
SELECT
  asset_group_id,
  asset_group_campaign AS campaign_resource_name,
  asset_group_name,
  asset_group_status,
  asset_group_final_urls,
  asset_group_final_mobile_urls,
  _PARTITIONTIME AS source_partition_time
FROM `big-button-383207.google_ads.p_ads_AssetGroup_8977224868`;
