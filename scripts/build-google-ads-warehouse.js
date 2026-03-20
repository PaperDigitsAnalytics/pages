const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const keyFile = 'C:/Users/wouter/Documents/pages-v2/big-button-383207-c50b2059a006.json';
const projectId = 'big-button-383207';
const location = 'europe-west4';
const datasets = ['ads_staging', 'ads_intermediate', 'ads_mart'];
const sqlFiles = [
  'sql/google_ads/staging/stg_google_ads_campaign.sql',
  'sql/google_ads/staging/stg_google_ads_campaign_daily.sql',
  'sql/google_ads/staging/stg_google_ads_ad_group.sql',
  'sql/google_ads/staging/stg_google_ads_ad_group_daily.sql',
  'sql/google_ads/staging/stg_google_ads_search_query_daily.sql',
  'sql/google_ads/staging/stg_google_ads_campaign_conversion_daily.sql',
  'sql/google_ads/staging/stg_google_ads_click_stats.sql',
  'sql/google_ads/staging/stg_google_ads_asset_group.sql',
  'sql/google_ads/staging/stg_google_ads_geo_daily.sql',
  'sql/google_ads/staging/stg_google_ads_campaign_location_target_daily.sql',
  'sql/google_ads/intermediate/int_google_ads_campaign_daily.sql',
  'sql/google_ads/intermediate/int_google_ads_ad_group_daily.sql',
  'sql/google_ads/intermediate/int_google_ads_search_query_daily.sql',
  'sql/google_ads/intermediate/int_google_ads_campaign_conversion_daily.sql',
  'sql/google_ads/intermediate/int_google_ads_click_stats.sql',
  'sql/google_ads/intermediate/int_google_ads_asset_group.sql',
  'sql/google_ads/intermediate/int_google_ads_geo_daily.sql',
  'sql/google_ads/marts/mart_ads_campaign_daily.sql',
  'sql/google_ads/marts/mart_ads_ad_group_daily.sql',
  'sql/google_ads/marts/mart_ads_search_query_daily.sql',
  'sql/google_ads/marts/mart_ads_campaign_conversion_daily.sql',
  'sql/google_ads/marts/mart_ads_click_stats_daily.sql',
  'sql/google_ads/marts/mart_ads_asset_group.sql',
  'sql/google_ads/marts/mart_ads_geo_daily.sql'
];

async function getToken() {
  const auth = new GoogleAuth({ keyFile, scopes:['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  return (await client.getAccessToken()).token;
}
async function ensureDataset(datasetId, token) {
  const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${datasetId}`;
  const getRes = await fetch(url, { headers:{ Authorization:`Bearer ${token}` } });
  if (getRes.ok) return;
  const createRes = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets`, {
    method:'POST',
    headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ datasetReference:{ projectId, datasetId }, location })
  });
  const text = await createRes.text();
  if (!createRes.ok) throw new Error(`Create dataset ${datasetId} failed: ${text}`);
}
async function query(sql, token) {
  const res = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`, {
    method:'POST',
    headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ query: sql, useLegacySql:false, location, timeoutMs: 120000 })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text || '{}');
}
(async()=>{
  const token = await getToken();
  for (const ds of datasets) {
    await ensureDataset(ds, token);
    console.log('Dataset OK:', ds);
  }
  for (const rel of sqlFiles) {
    const full = path.join(process.cwd(), rel);
    const sql = fs.readFileSync(full, 'utf8');
    await query(sql, token);
    console.log('Built:', rel);
  }
})().catch(e => { console.error(e.stack || String(e)); process.exit(1); });
