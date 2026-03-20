const {GoogleAuth}=require('google-auth-library');
const fs=require('fs');
const keyFile='C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';
async function token(){const auth=new GoogleAuth({keyFile,scopes:['https://www.googleapis.com/auth/bigquery']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function api(url,method='GET',body){const t=await token();const r=await fetch(url,{method,headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const text=await r.text();let j={};try{j=text?JSON.parse(text):{}}catch{j={raw:text}};if(!r.ok) throw new Error(`${method} ${url} -> HTTP ${r.status}: ${JSON.stringify(j)}`);return j;}
async function upsertView(project,dataset,table,query){const body={tableReference:{projectId:project,datasetId:dataset,tableId:table},view:{query,useLegacySql:false}};try{await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/datasets/${dataset}/tables`,'POST',body);console.log(`CREATED VIEW ${dataset}.${table}`);}catch(err){const msg=String(err);if(msg.includes('Already Exists')||msg.includes('already exists')||msg.includes('duplicate')){await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/datasets/${dataset}/tables/${table}`,'PUT',body);console.log(`UPDATED VIEW ${dataset}.${table}`);}else throw err;}}
function ref(project,dataset,table){return '`'+project+'.'+dataset+'.'+table+'`';}
(async()=>{const raw=JSON.parse(fs.readFileSync(keyFile,'utf8'));const project=raw.project_id;const dataset='marts_sea';const table='sea_campaign_conversion_mix';const query=`WITH conv AS (
  SELECT
    f.platform,
    f.account_id,
    f.campaign_id,
    d.campaign_name,
    c.source_conversion_id,
    c.source_conversion_name,
    c.source_conversion_category,
    c.normalized_conversion_type,
    c.normalized_conversion_group,
    c.is_primary_conversion,
    c.is_business_conversion,
    c.is_revenue_conversion,
    SUM(f.conversions) AS conversions_90d,
    SUM(f.conversion_value) AS conversion_value_90d
  FROM ${ref(project,'intermediate_advertising','fct_conversion_daily')} f
  LEFT JOIN ${ref(project,'intermediate_advertising','dim_conversion_action')} c
    ON f.platform = c.platform
   AND f.conversion_action_key = c.conversion_action_key
  LEFT JOIN ${ref(project,'intermediate_advertising','dim_campaign')} d
    ON f.platform = d.platform
   AND f.account_id = d.account_id
   AND f.campaign_id = d.campaign_id
  WHERE f.platform = 'google_ads'
    AND f.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
  GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12
), ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY platform, account_id, campaign_id ORDER BY conversions_90d DESC, conversion_value_90d DESC, source_conversion_name) AS conversion_rank
  FROM conv
), summary AS (
  SELECT
    platform,
    account_id,
    campaign_id,
    ANY_VALUE(campaign_name) AS campaign_name,
    MAX(IF(conversion_rank = 1, source_conversion_name, NULL)) AS top_recorded_conversion,
    MAX(IF(conversion_rank = 1, normalized_conversion_type, NULL)) AS top_recorded_conversion_type,
    MAX(IF(conversion_rank = 1, source_conversion_category, NULL)) AS top_recorded_conversion_category,
    MAX(IF(conversion_rank = 1, conversions_90d, NULL)) AS top_recorded_conversion_count_90d,
    SUM(conversions_90d) AS total_conversions_90d,
    SUM(IF(is_primary_conversion, conversions_90d, 0)) AS primary_conversions_90d,
    SUM(IF(is_business_conversion, conversions_90d, 0)) AS business_conversions_90d,
    SUM(IF(is_revenue_conversion, conversions_90d, 0)) AS revenue_conversions_90d,
    STRING_AGG(
      CONCAT(
        COALESCE(source_conversion_name, 'unknown'),
        ' [', COALESCE(normalized_conversion_type, 'unmapped'), '] = ',
        CAST(ROUND(conversions_90d, 2) AS STRING)
      ),
      ' | ' ORDER BY conversions_90d DESC, conversion_value_90d DESC
    ) AS conversion_mix_90d
  FROM ranked
  GROUP BY 1,2,3
)
SELECT * FROM summary
ORDER BY total_conversions_90d DESC, campaign_name`;await upsertView(project,dataset,table,query);})();