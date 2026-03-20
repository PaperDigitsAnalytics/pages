CREATE OR REPLACE TABLE `big-button-383207.ads_staging.stg_google_ads_campaign`
AS
SELECT
  customer_id,
  campaign_id,
  campaign_name,
  campaign_status,
  campaign_serving_status,
  campaign_advertising_channel_type AS advertising_channel_type,
  campaign_advertising_channel_sub_type AS advertising_channel_sub_type,
  campaign_bidding_strategy_type AS bidding_strategy_type,
  campaign_start_date AS campaign_start_date,
  campaign_end_date AS campaign_end_date,
  SAFE_DIVIDE(campaign_budget_amount_micros, 1000000) AS campaign_budget,
  _PARTITIONTIME AS source_partition_time
FROM `big-button-383207.google_ads.p_ads_Campaign_8977224868`;
