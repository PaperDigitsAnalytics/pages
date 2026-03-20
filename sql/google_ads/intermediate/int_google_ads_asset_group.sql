CREATE OR REPLACE TABLE `big-button-383207.ads_intermediate.int_google_ads_asset_group`
AS
SELECT
  a.asset_group_id,
  SAFE_CAST(REGEXP_EXTRACT(a.campaign_resource_name, r'(\d+)$') AS INT64) AS campaign_id,
  c.customer_id,
  c.campaign_name,
  c.campaign_status,
  c.advertising_channel_type,
  c.advertising_channel_sub_type,
  a.asset_group_name,
  a.asset_group_status,
  a.asset_group_final_urls,
  a.asset_group_final_mobile_urls
FROM `big-button-383207.ads_staging.stg_google_ads_asset_group` a
LEFT JOIN `big-button-383207.ads_staging.stg_google_ads_campaign` c
  ON SAFE_CAST(REGEXP_EXTRACT(a.campaign_resource_name, r'(\d+)$') AS INT64) = c.campaign_id;
