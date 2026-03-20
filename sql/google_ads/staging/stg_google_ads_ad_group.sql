CREATE OR REPLACE TABLE `big-button-383207.ads_staging.stg_google_ads_ad_group`
AS
SELECT
  customer_id,
  campaign_id,
  ad_group_id,
  ad_group_name,
  ad_group_status,
  ad_group_type,
  campaign_bidding_strategy_type,
  SAFE_DIVIDE(ad_group_cpc_bid_micros, 1000000) AS cpc_bid,
  SAFE_DIVIDE(ad_group_cpm_bid_micros, 1000000) AS cpm_bid,
  SAFE_DIVIDE(ad_group_cpv_bid_micros, 1000000) AS cpv_bid,
  _PARTITIONTIME AS source_partition_time
FROM `big-button-383207.google_ads.p_ads_AdGroup_8977224868`;
