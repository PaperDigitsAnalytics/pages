CREATE OR REPLACE TABLE `big-button-383207.ads_intermediate.int_google_ads_click_stats`
PARTITION BY date
AS
SELECT
  s.date,
  s.customer_id,
  s.campaign_id,
  c.campaign_name,
  s.ad_group_id,
  g.ad_group_name,
  s.device,
  s.ad_network_type,
  s.click_type,
  s.gclid,
  s.keyword_text,
  s.keyword_match_type,
  s.clicks
FROM `big-button-383207.ads_staging.stg_google_ads_click_stats` s
LEFT JOIN `big-button-383207.ads_staging.stg_google_ads_campaign` c
  USING (customer_id, campaign_id)
LEFT JOIN `big-button-383207.ads_staging.stg_google_ads_ad_group` g
  USING (customer_id, campaign_id, ad_group_id);
