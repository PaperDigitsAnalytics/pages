const {GoogleAuth}=require('google-auth-library');
const fs=require('fs');
const keyFile='C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';
async function token(){const auth=new GoogleAuth({keyFile,scopes:['https://www.googleapis.com/auth/bigquery']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function api(url,method='GET',body){const t=await token();const r=await fetch(url,{method,headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const text=await r.text();let j={};try{j=text?JSON.parse(text):{}}catch{j={raw:text}};if(!r.ok) throw new Error(`${method} ${url} -> HTTP ${r.status}: ${JSON.stringify(j)}`);return j;}
async function upsertView(project,dataset,table,query){const body={tableReference:{projectId:project,datasetId:dataset,tableId:table},view:{query,useLegacySql:false}};try{await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/datasets/${dataset}/tables`,'POST',body);console.log(`CREATED VIEW ${dataset}.${table}`);}catch(err){const msg=String(err);if(msg.includes('Already Exists')||msg.includes('already exists')||msg.includes('duplicate')){await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/datasets/${dataset}/tables/${table}`,'PUT',body);console.log(`UPDATED VIEW ${dataset}.${table}`);}else throw err;}}
function ref(project,dataset,table){return '`'+project+'.'+dataset+'.'+table+'`';}
(async()=>{const raw=JSON.parse(fs.readFileSync(keyFile,'utf8'));const project=raw.project_id;const ds='marts_sea';
const mix=`WITH conv AS (
  SELECT f.platform,f.account_id,f.campaign_id,d.campaign_name,d.channel_type,d.channel_subtype,d.bidding_strategy_type,d.status AS campaign_status,c.source_conversion_id,c.source_conversion_name,c.source_conversion_category,c.normalized_conversion_type,c.normalized_conversion_group,c.is_primary_conversion,c.is_business_conversion,c.is_revenue_conversion,SUM(f.conversions) AS conversions_90d,SUM(f.all_conversions) AS all_conversions_90d,SUM(f.conversion_value) AS conversion_value_90d,SUM(f.all_conversion_value) AS all_conversion_value_90d
  FROM ${ref(project,'intermediate_advertising','fct_conversion_daily')} f
  LEFT JOIN ${ref(project,'intermediate_advertising','dim_conversion_action')} c ON f.platform = c.platform AND f.conversion_action_key = c.conversion_action_key
  LEFT JOIN ${ref(project,'intermediate_advertising','dim_campaign')} d ON f.platform = d.platform AND f.account_id = d.account_id AND f.campaign_id = d.campaign_id
  WHERE f.platform = 'google_ads' AND f.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
  GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16
), ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY platform, account_id, campaign_id ORDER BY all_conversions_90d DESC, conversions_90d DESC, all_conversion_value_90d DESC, source_conversion_name) AS conversion_rank FROM conv
), summary AS (
  SELECT platform,account_id,campaign_id,ANY_VALUE(campaign_name) AS campaign_name,ANY_VALUE(channel_type) AS channel_type,ANY_VALUE(channel_subtype) AS channel_subtype,ANY_VALUE(bidding_strategy_type) AS bidding_strategy_type,ANY_VALUE(campaign_status) AS campaign_status,
  MAX(IF(conversion_rank = 1, source_conversion_name, NULL)) AS top_recorded_conversion,
  MAX(IF(conversion_rank = 1, normalized_conversion_type, NULL)) AS top_recorded_conversion_type,
  MAX(IF(conversion_rank = 1, source_conversion_category, NULL)) AS top_recorded_conversion_category,
  MAX(IF(conversion_rank = 1, conversions_90d, NULL)) AS top_recorded_conversion_count_90d,
  MAX(IF(conversion_rank = 1, all_conversions_90d, NULL)) AS top_recorded_all_conversions_90d,
  SUM(conversions_90d) AS total_conversions_90d,
  SUM(all_conversions_90d) AS total_all_conversions_90d,
  SUM(IF(is_primary_conversion, conversions_90d, 0)) AS primary_conversions_90d,
  SUM(IF(is_business_conversion, conversions_90d, 0)) AS business_conversions_90d,
  SUM(IF(is_revenue_conversion, conversions_90d, 0)) AS revenue_conversions_90d,
  COUNT(DISTINCT source_conversion_name) AS distinct_recorded_conversion_actions,
  STRING_AGG(CONCAT(COALESCE(source_conversion_name, 'unknown'),' [',COALESCE(normalized_conversion_type, 'unmapped'),'] = ',CAST(ROUND(conversions_90d, 2) AS STRING),' / all=',CAST(ROUND(all_conversions_90d,2) AS STRING)),' | ' ORDER BY all_conversions_90d DESC, conversions_90d DESC) AS conversion_mix_90d
  FROM ranked GROUP BY 1,2,3
)
SELECT *, SAFE_DIVIDE(primary_conversions_90d, NULLIF(total_conversions_90d,0)) AS primary_conversion_share, SAFE_DIVIDE(business_conversions_90d, NULLIF(total_conversions_90d,0)) AS business_conversion_share, SAFE_DIVIDE(total_all_conversions_90d, NULLIF(total_conversions_90d,0)) AS all_to_recorded_conversion_ratio FROM summary ORDER BY total_all_conversions_90d DESC, campaign_name`;
const mismatch=`WITH conv AS (
  SELECT f.platform,f.account_id,f.campaign_id,d.campaign_name,d.channel_type,d.channel_subtype,d.bidding_strategy_type,d.status AS campaign_status,c.source_conversion_name,c.normalized_conversion_type,c.normalized_conversion_group,c.is_primary_conversion,c.is_business_conversion,c.is_revenue_conversion,SUM(f.conversions) AS conversions_90d,SUM(f.all_conversions) AS all_conversions_90d,SUM(f.conversion_value) AS conversion_value_90d,SUM(f.all_conversion_value) AS all_conversion_value_90d
  FROM ${ref(project,'intermediate_advertising','fct_conversion_daily')} f
  LEFT JOIN ${ref(project,'intermediate_advertising','dim_conversion_action')} c ON f.platform = c.platform AND f.conversion_action_key = c.conversion_action_key
  LEFT JOIN ${ref(project,'intermediate_advertising','dim_campaign')} d ON f.platform = d.platform AND f.account_id = d.account_id AND f.campaign_id = d.campaign_id
  WHERE f.platform = 'google_ads' AND f.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
  GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13
), summary AS (
  SELECT platform,account_id,campaign_id,ANY_VALUE(campaign_name) AS campaign_name,ANY_VALUE(channel_type) AS channel_type,ANY_VALUE(channel_subtype) AS channel_subtype,ANY_VALUE(bidding_strategy_type) AS bidding_strategy_type,ANY_VALUE(campaign_status) AS campaign_status,
  SUM(conversions_90d) AS total_conversions_90d,
  SUM(all_conversions_90d) AS total_all_conversions_90d,
  SUM(IF(is_primary_conversion, conversions_90d, 0)) AS primary_conversions_90d,
  SUM(IF(is_business_conversion, conversions_90d, 0)) AS business_conversions_90d,
  SUM(IF(is_revenue_conversion, conversions_90d, 0)) AS revenue_conversions_90d,
  SUM(IF(NOT is_primary_conversion OR is_primary_conversion IS NULL, conversions_90d, 0)) AS non_primary_conversions_90d,
  SUM(IF(NOT is_business_conversion OR is_business_conversion IS NULL, conversions_90d, 0)) AS non_business_conversions_90d,
  COUNT(DISTINCT source_conversion_name) AS distinct_recorded_conversion_actions,
  STRING_AGG(CONCAT(COALESCE(source_conversion_name, 'unknown'),' [',COALESCE(normalized_conversion_type, 'unmapped'),'] = ',CAST(ROUND(conversions_90d, 2) AS STRING),' / all=',CAST(ROUND(all_conversions_90d,2) AS STRING)),' | ' ORDER BY all_conversions_90d DESC, conversions_90d DESC) AS conversion_mix_90d
  FROM conv GROUP BY 1,2,3
)
SELECT *, SAFE_DIVIDE(primary_conversions_90d, NULLIF(total_conversions_90d,0)) AS primary_conversion_share, SAFE_DIVIDE(business_conversions_90d, NULLIF(total_conversions_90d,0)) AS business_conversion_share, SAFE_DIVIDE(non_primary_conversions_90d, NULLIF(total_conversions_90d,0)) AS non_primary_conversion_share, SAFE_DIVIDE(total_all_conversions_90d, NULLIF(total_conversions_90d,0)) AS all_to_recorded_conversion_ratio,
CASE WHEN total_conversions_90d = 0 AND total_all_conversions_90d = 0 THEN 'no_conversions' WHEN SAFE_DIVIDE(primary_conversions_90d, NULLIF(total_conversions_90d,0)) < 0.25 THEN 'low_primary_share' WHEN SAFE_DIVIDE(business_conversions_90d, NULLIF(total_conversions_90d,0)) < 0.25 THEN 'low_business_share' WHEN SAFE_DIVIDE(total_all_conversions_90d, NULLIF(total_conversions_90d,0)) > 1.5 THEN 'high_all_conversion_gap' WHEN distinct_recorded_conversion_actions >= 5 THEN 'high_conversion_mix' ELSE 'healthy_or_mixed' END AS conversion_diagnostic_flag,
CASE WHEN SAFE_DIVIDE(total_all_conversions_90d, NULLIF(total_conversions_90d,0)) > 1.5 THEN 'All conversions are materially higher than recorded conversions; review secondary or non-optimized conversion actions.' WHEN SAFE_DIVIDE(primary_conversions_90d, NULLIF(total_conversions_90d,0)) < 0.25 THEN 'Review whether this campaign is optimizing toward secondary or low-value conversions.' WHEN SAFE_DIVIDE(business_conversions_90d, NULLIF(total_conversions_90d,0)) < 0.25 THEN 'Platform conversions are present, but business-relevant conversions are limited.' WHEN distinct_recorded_conversion_actions >= 5 THEN 'Many different conversion types are recorded; check whether the optimization signal is too mixed.' ELSE 'No obvious conversion-mix issue detected from the current rules.' END AS diagnostic_note
FROM summary ORDER BY total_all_conversions_90d DESC, non_primary_conversions_90d DESC, campaign_name`;
await upsertView(project,ds,'sea_campaign_conversion_mix',mix);
await upsertView(project,ds,'sea_campaign_conversion_mismatch',mismatch);
})();