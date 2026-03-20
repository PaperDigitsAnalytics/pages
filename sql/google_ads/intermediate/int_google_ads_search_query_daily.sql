CREATE OR REPLACE TABLE `big-button-383207.ads_intermediate.int_google_ads_search_query_daily`
PARTITION BY date
AS
SELECT
  s.date,
  s.customer_id,
  s.campaign_id,
  c.campaign_name,
  s.ad_group_id,
  g.ad_group_name,
  s.ad_id,
  s.device,
  s.ad_network_type,
  s.search_term,
  s.search_term_status,
  s.search_term_match_type,
  s.impressions,
  s.clicks,
  s.cost,
  s.conversions,
  s.conversion_value,
  s.all_conversions,
  s.all_conversions_value,
  s.ctr,
  s.average_cpc,
  s.cost_per_conversion,
  SAFE_DIVIDE(s.conversion_value, NULLIF(s.cost, 0)) AS roas,
  SAFE_DIVIDE(s.conversions, NULLIF(s.clicks, 0)) AS conversion_rate
FROM `big-button-383207.ads_staging.stg_google_ads_search_query_daily` s
LEFT JOIN `big-button-383207.ads_staging.stg_google_ads_campaign` c
  USING (customer_id, campaign_id)
LEFT JOIN `big-button-383207.ads_staging.stg_google_ads_ad_group` g
  USING (customer_id, campaign_id, ad_group_id);
