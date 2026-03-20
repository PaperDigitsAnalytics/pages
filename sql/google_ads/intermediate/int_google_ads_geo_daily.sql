CREATE OR REPLACE TABLE `big-button-383207.ads_intermediate.int_google_ads_geo_daily`
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
  s.device,
  s.ad_network_type,
  s.country_criterion_id,
  s.location_type,
  s.most_specific_location,
  s.impressions,
  s.clicks,
  s.cost,
  s.conversions,
  s.conversion_value,
  s.all_conversions,
  s.all_conversions_value,
  s.interactions,
  s.view_through_conversions,
  s.ctr,
  s.average_cpc,
  s.cost_per_conversion,
  SAFE_DIVIDE(s.conversion_value, NULLIF(s.cost, 0)) AS roas,
  SAFE_DIVIDE(s.conversions, NULLIF(s.clicks, 0)) AS conversion_rate
FROM `big-button-383207.ads_staging.stg_google_ads_geo_daily` s
LEFT JOIN `big-button-383207.ads_staging.stg_google_ads_campaign` c
  USING (customer_id, campaign_id);
