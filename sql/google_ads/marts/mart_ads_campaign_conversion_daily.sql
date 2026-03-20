CREATE OR REPLACE TABLE `big-button-383207.ads_mart.mart_ads_campaign_conversion_daily`
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
  ad_network_type,
  conversion_action,
  conversion_action_name,
  conversion_action_category,
  conversion_attribution_event_type,
  conversions,
  conversion_value,
  value_per_conversion
FROM `big-button-383207.ads_intermediate.int_google_ads_campaign_conversion_daily`;
