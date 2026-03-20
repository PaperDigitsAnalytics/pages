const {GoogleAuth}=require('google-auth-library');
const fs=require('fs');
const keyFile='C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';
async function token(){const auth=new GoogleAuth({keyFile,scopes:['https://www.googleapis.com/auth/bigquery']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function api(url,method='GET',body){const t=await token();const r=await fetch(url,{method,headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const text=await r.text();let j={};try{j=text?JSON.parse(text):{}}catch{j={raw:text}};if(!r.ok) throw new Error(`${method} ${url} -> HTTP ${r.status}: ${JSON.stringify(j)}`);return j;}
async function upsertTable(project,dataset,table,schema){const body={tableReference:{projectId:project,datasetId:dataset,tableId:table},schema:{fields:schema}};try{await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/datasets/${dataset}/tables`,'POST',body);console.log(`CREATED TABLE ${dataset}.${table}`);}catch(err){const msg=String(err);if(msg.includes('Already Exists')||msg.includes('duplicate')){console.log(`EXISTS TABLE ${dataset}.${table}`);}else throw err;}}
async function upsertView(project,dataset,table,query){const body={tableReference:{projectId:project,datasetId:dataset,tableId:table},view:{query,useLegacySql:false}};try{await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/datasets/${dataset}/tables`,'POST',body);console.log(`CREATED VIEW ${dataset}.${table}`);}catch(err){const msg=String(err);if(msg.includes('Already Exists')||msg.includes('duplicate')||msg.includes('already exists')){await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/datasets/${dataset}/tables/${table}`,'PUT',body);console.log(`UPDATED VIEW ${dataset}.${table}`);}else throw err;}}
function ref(project,dataset,table){return '`'+project+'.'+dataset+'.'+table+'`';}
(async()=>{const raw=JSON.parse(fs.readFileSync(keyFile,'utf8'));const project=raw.project_id;
await upsertTable(project,'mapping','conversion_action_map',[
{name:'platform',type:'STRING'},{name:'source_conversion_id',type:'STRING'},{name:'source_conversion_name',type:'STRING'},{name:'source_conversion_category',type:'STRING'},{name:'normalized_conversion_type',type:'STRING'},{name:'normalized_conversion_group',type:'STRING'},{name:'is_primary_conversion',type:'BOOLEAN'},{name:'is_secondary_conversion',type:'BOOLEAN'},{name:'is_micro_conversion',type:'BOOLEAN'},{name:'is_biddable_conversion',type:'BOOLEAN'},{name:'is_business_conversion',type:'BOOLEAN'},{name:'is_revenue_conversion',type:'BOOLEAN'},{name:'include_in_sea_reporting',type:'BOOLEAN'},{name:'include_in_seo_reporting',type:'BOOLEAN'},{name:'include_in_cro_reporting',type:'BOOLEAN'},{name:'notes',type:'STRING'},{name:'active',type:'BOOLEAN'}
]);
const dimQuery=`WITH source_actions AS (
  SELECT DISTINCT 'google_ads' AS platform, CAST(ConversionTrackerId AS STRING) AS source_conversion_id, ConversionTypeName AS source_conversion_name, ConversionCategoryName AS source_conversion_category, ConversionAttributionEventType AS source_attribution_event_type
  FROM ${ref(project,'google_ads','CampaignConversionStats_3612505204')}
)
SELECT sa.platform, CONCAT(sa.platform, ':', COALESCE(sa.source_conversion_id, sa.source_conversion_name)) AS conversion_action_key, sa.source_conversion_id, sa.source_conversion_name, sa.source_conversion_category, sa.source_attribution_event_type,
COALESCE(m.normalized_conversion_type, CASE WHEN LOWER(sa.source_conversion_name) LIKE '%purchase%' THEN 'purchase' WHEN LOWER(sa.source_conversion_name) LIKE '%qualified%' THEN 'qualified_lead' WHEN LOWER(sa.source_conversion_name) LIKE '%lead%' THEN 'lead_form_submit' WHEN LOWER(sa.source_conversion_name) LIKE '%call%' THEN 'phone_call' ELSE 'other' END) AS normalized_conversion_type,
COALESCE(m.normalized_conversion_group, CASE WHEN LOWER(sa.source_conversion_name) LIKE '%purchase%' THEN 'revenue' WHEN LOWER(sa.source_conversion_name) LIKE '%qualified%' THEN 'qualified_lead' WHEN LOWER(sa.source_conversion_name) LIKE '%lead%' OR LOWER(sa.source_conversion_name) LIKE '%call%' THEN 'lead' ELSE 'other' END) AS normalized_conversion_group,
COALESCE(m.is_primary_conversion, LOWER(sa.source_conversion_category) IN ('submit lead form','phone call lead','qualified lead','purchase')) AS is_primary_conversion,
COALESCE(m.is_secondary_conversion, NOT (LOWER(sa.source_conversion_category) IN ('submit lead form','phone call lead','qualified lead','purchase'))) AS is_secondary_conversion,
COALESCE(m.is_micro_conversion, FALSE) AS is_micro_conversion,
COALESCE(m.is_biddable_conversion, TRUE) AS is_biddable_conversion,
COALESCE(m.is_business_conversion, LOWER(sa.source_conversion_category) IN ('submit lead form','phone call lead','qualified lead','purchase')) AS is_business_conversion,
COALESCE(m.is_revenue_conversion, LOWER(sa.source_conversion_name) LIKE '%purchase%') AS is_revenue_conversion,
COALESCE(m.active, TRUE) AS active
FROM source_actions sa
LEFT JOIN ${ref(project,'mapping','conversion_action_map')} m
  ON m.platform = sa.platform AND COALESCE(m.source_conversion_id,'') = COALESCE(sa.source_conversion_id,'') AND COALESCE(m.source_conversion_name,'') = COALESCE(sa.source_conversion_name,'')`;
await upsertView(project,'intermediate_advertising','dim_conversion_action',dimQuery);
const factQuery=`SELECT 'google_ads' AS platform, CAST(ExternalCustomerId AS STRING) AS account_id, CAST(CampaignId AS STRING) AS campaign_id, CAST(AdGroupId AS STRING) AS ad_group_id, Date AS date, Device AS device_type,
CONCAT('google_ads:', CAST(ConversionTrackerId AS STRING)) AS conversion_action_key,
CAST(ConversionTrackerId AS STRING) AS source_conversion_id, ConversionTypeName AS source_conversion_name, ConversionCategoryName AS source_conversion_category,
Conversions AS conversions, AllConversions AS all_conversions,
ConversionValue AS conversion_value, AllConversionValue AS all_conversion_value,
ValuePerConversion AS value_per_conversion, ConversionRate AS conversion_rate,
SAFE_DIVIDE(CostPerConversion, 1000000) AS cost_per_conversion,
CAST(NULL AS STRING) AS source_attribution_event_type
FROM ${ref(project,'google_ads','AdGroupConversionStats_3612505204')}
UNION ALL
SELECT 'google_ads' AS platform, CAST(ExternalCustomerId AS STRING) AS account_id, CAST(CampaignId AS STRING) AS campaign_id, CAST(NULL AS STRING) AS ad_group_id, Date AS date, Device AS device_type,
CONCAT('google_ads:', CAST(ConversionTrackerId AS STRING)) AS conversion_action_key,
CAST(ConversionTrackerId AS STRING) AS source_conversion_id, ConversionTypeName AS source_conversion_name, ConversionCategoryName AS source_conversion_category,
Conversions AS conversions, AllConversions AS all_conversions,
ConversionValue AS conversion_value, AllConversionValue AS all_conversion_value,
ValuePerConversion AS value_per_conversion, ConversionRate AS conversion_rate,
SAFE_DIVIDE(CostPerConversion, 1000000) AS cost_per_conversion,
ConversionAttributionEventType AS source_attribution_event_type
FROM ${ref(project,'google_ads','CampaignConversionStats_3612505204')}`;
await upsertView(project,'intermediate_advertising','fct_conversion_daily',factQuery);
})().catch(e=>{console.error(e.stack||String(e));process.exit(1);});