const {GoogleAuth}=require('google-auth-library');
const fs=require('fs');
const keyFile='C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';
async function token(){const auth=new GoogleAuth({keyFile,scopes:['https://www.googleapis.com/auth/bigquery']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function api(url,method='GET',body){const t=await token();const r=await fetch(url,{method,headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const text=await r.text();let j={};try{j=text?JSON.parse(text):{}}catch{j={raw:text}};if(!r.ok) throw new Error(`${method} ${url} -> HTTP ${r.status}: ${JSON.stringify(j)}`);return j;}
async function upsertView(project,dataset,table,query){const body={tableReference:{projectId:project,datasetId:dataset,tableId:table},view:{query,useLegacySql:false}};try{await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/datasets/${dataset}/tables`,'POST',body);console.log(`CREATED VIEW ${dataset}.${table}`);}catch(err){const msg=String(err);if(msg.includes('Already Exists')||msg.includes('duplicate')||msg.includes('already exists')){await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/datasets/${dataset}/tables/${table}`,'PUT',body);console.log(`UPDATED VIEW ${dataset}.${table}`);}else throw err;}}
function ref(project,dataset,table){return '`'+project+'.'+dataset+'.'+table+'`';}
(async()=>{const raw=JSON.parse(fs.readFileSync(keyFile,'utf8'));const project=raw.project_id;
const factQuery=`SELECT 'google_ads' AS platform, CAST(ExternalCustomerId AS STRING) AS account_id, CAST(CampaignId AS STRING) AS campaign_id, CAST(AdGroupId AS STRING) AS ad_group_id, Date AS date, Device AS device_type,
CONCAT('google_ads:', CAST(ConversionTrackerId AS STRING)) AS conversion_action_key,
CAST(ConversionTrackerId AS STRING) AS source_conversion_id, ConversionTypeName AS source_conversion_name, ConversionCategoryName AS source_conversion_category,
Conversions AS conversions,
AllConv AS all_conversions,
ConversionValue AS conversion_value,
AllConvValue AS all_conversion_value,
ValuePerConversion AS value_per_conversion,
ConversionRate AS conversion_rate,
SAFE_DIVIDE(CostPerConversion, 1000000) AS cost_per_conversion,
CAST(NULL AS STRING) AS source_attribution_event_type
FROM ${ref(project,'google_ads','AdGroupConversionStats_3612505204')}
UNION ALL
SELECT 'google_ads' AS platform, CAST(ExternalCustomerId AS STRING) AS account_id, CAST(CampaignId AS STRING) AS campaign_id, CAST(NULL AS STRING) AS ad_group_id, Date AS date, Device AS device_type,
CONCAT('google_ads:', CAST(ConversionTrackerId AS STRING)) AS conversion_action_key,
CAST(ConversionTrackerId AS STRING) AS source_conversion_id, ConversionTypeName AS source_conversion_name, ConversionCategoryName AS source_conversion_category,
Conversions AS conversions,
AllConv AS all_conversions,
ConversionValue AS conversion_value,
AllConvValue AS all_conversion_value,
ValuePerConversion AS value_per_conversion,
ConversionRate AS conversion_rate,
SAFE_DIVIDE(CostPerConversion, 1000000) AS cost_per_conversion,
ConversionAttributionEventType AS source_attribution_event_type
FROM ${ref(project,'google_ads','CampaignConversionStats_3612505204')}`;
await upsertView(project,'intermediate_advertising','fct_conversion_daily',factQuery);
const mismatch=`WITH conv AS (
  SELECT f.platform,f.account_id,f.campaign_id,d.campaign_name,
    SUM(f.conversions) AS total_conversions_90d_raw,
    SUM(f.all_conversions) AS total_all_conversions_90d_raw,
    SUM(IF(c.is_primary_conversion, f.conversions, 0)) AS primary_conversions_90d_raw,
    SUM(IF(c.is_business_conversion, f.conversions, 0)) AS business_conversions_90d_raw,
    SUM(IF(c.is_revenue_conversion, f.conversions, 0)) AS revenue_conversions_90d_raw,
    SUM(IF(NOT c.is_primary_conversion OR c.is_primary_conversion IS NULL, f.conversions, 0)) AS non_primary_conversions_90d_raw,
    COUNT(DISTINCT c.source_conversion_name) AS distinct_recorded_conversion_actions,
    STRING_AGG(CONCAT(COALESCE(c.source_conversion_name,'unknown'),' = ',CAST(ROUND(SUM(f.conversions),2) AS STRING),' / all=',CAST(ROUND(SUM(f.all_conversions),2) AS STRING)), ' | ') OVER (PARTITION BY f.platform,f.account_id,f.campaign_id) AS mix_window
  FROM ${ref(project,'intermediate_advertising','fct_conversion_daily')} f
  LEFT JOIN ${ref(project,'intermediate_advertising','dim_conversion_action')} c ON f.platform = c.platform AND f.conversion_action_key = c.conversion_action_key
  LEFT JOIN ${ref(project,'intermediate_advertising','dim_campaign')} d ON f.platform = d.platform AND f.account_id = d.account_id AND f.campaign_id = d.campaign_id
  WHERE f.platform='google_ads' AND f.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
  GROUP BY 1,2,3,4, c.source_conversion_name
), summary AS (
  SELECT platform, account_id, campaign_id, ANY_VALUE(campaign_name) AS campaign_name,
    SUM(total_conversions_90d_raw) AS total_conversions_90d,
    SUM(total_all_conversions_90d_raw) AS total_all_conversions_90d,
    SUM(primary_conversions_90d_raw) AS primary_conversions_90d,
    SUM(business_conversions_90d_raw) AS business_conversions_90d,
    SUM(revenue_conversions_90d_raw) AS revenue_conversions_90d,
    SUM(non_primary_conversions_90d_raw) AS non_primary_conversions_90d,
    MAX(distinct_recorded_conversion_actions) AS distinct_recorded_conversion_actions,
    ANY_VALUE(mix_window) AS conversion_mix_90d
  FROM conv
  GROUP BY 1,2,3
)
SELECT *,
  SAFE_DIVIDE(total_all_conversions_90d, NULLIF(total_conversions_90d,0)) AS all_to_recorded_conversion_ratio,
  CASE
    WHEN total_conversions_90d = 0 AND total_all_conversions_90d = 0 THEN 'no_conversions'
    WHEN SAFE_DIVIDE(total_all_conversions_90d, NULLIF(total_conversions_90d,0)) > 1.5 THEN 'high_all_conversion_gap'
    WHEN SAFE_DIVIDE(primary_conversions_90d, NULLIF(total_conversions_90d,0)) < 0.25 THEN 'low_primary_share'
    WHEN SAFE_DIVIDE(business_conversions_90d, NULLIF(total_conversions_90d,0)) < 0.25 THEN 'low_business_share'
    WHEN distinct_recorded_conversion_actions >= 5 THEN 'high_conversion_mix'
    ELSE 'healthy_or_mixed'
  END AS conversion_diagnostic_flag
FROM summary`;
await upsertView(project,'marts_sea','sea_campaign_conversion_mismatch',mismatch);
})();