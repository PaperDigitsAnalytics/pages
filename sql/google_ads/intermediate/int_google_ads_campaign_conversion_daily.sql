CREATE OR REPLACE TABLE `big-button-383207.ads_intermediate.int_google_ads_campaign_conversion_daily`
PARTITION BY date
AS
SELECT
  s.date,
  s.customer_id,
  s.campaign_id,
  c.campaign_name,
  c.campaign_status,
  c.advertising_channel_type,
  c.advertising_channel_sub_type,
  s.ad_network_type,
  s.conversion_action,
  s.conversion_action_name,
  s.conversion_action_category,
  s.conversion_attribution_event_type,
  s.conversions,
  s.conversion_value,
  s.value_per_conversion
FROM `big-button-383207.ads_staging.stg_google_ads_campaign_conversion_daily` s
LEFT JOIN `big-button-383207.ads_staging.stg_google_ads_campaign` c
  USING (customer_id, campaign_id);
