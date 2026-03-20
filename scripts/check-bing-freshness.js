const {GoogleAuth} = require('google-auth-library');
const fs = require('fs');
const keyFile = 'C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';
async function token(){const auth=new GoogleAuth({keyFile,scopes:['https://www.googleapis.com/auth/bigquery']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function query(sql){const raw=JSON.parse(fs.readFileSync(keyFile,'utf8'));const project=raw.project_id;const t=await token();const res=await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/queries`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify({query:sql,useLegacySql:false,location:'europe-west1'})});const text=await res.text();const j=text?JSON.parse(text):{};if(!res.ok) throw new Error(`${res.status} ${text}`);return j;}
(async()=>{
const sql=`
SELECT 'raw_campaign_basic_stats' AS table_name, MAX(PARSE_DATE('%Y-%m-%d', TimePeriod)) AS max_date, COUNT(*) AS row_count FROM \`despreker.bing_ads.raw_campaign_basic_stats\`
UNION ALL
SELECT 'raw_ad_group_basic_stats' AS table_name, MAX(PARSE_DATE('%Y-%m-%d', TimePeriod)) AS max_date, COUNT(*) AS row_count FROM \`despreker.bing_ads.raw_ad_group_basic_stats\`
UNION ALL
SELECT 'bing_campaign_settings' AS table_name, MAX(DATE(datetime_modified)) AS max_date, COUNT(*) AS row_count FROM \`despreker.bing_ads.bing_campaign_settings\`
UNION ALL
SELECT 'bing_ad_group_settings' AS table_name, MAX(DATE(datetime_modified)) AS max_date, COUNT(*) AS row_count FROM \`despreker.bing_ads.bing_ad_group_settings\`
ORDER BY table_name`;
const r=await query(sql);
console.log(JSON.stringify(r.rows||[],null,2));
})();