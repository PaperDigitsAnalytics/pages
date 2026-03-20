const {GoogleAuth} = require('google-auth-library');
const fs = require('fs');
const keyFile = 'C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';
async function token(){const auth=new GoogleAuth({keyFile,scopes:['https://www.googleapis.com/auth/bigquery.readonly']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function api(url){const t=await token();const r=await fetch(url,{headers:{Authorization:`Bearer ${t}`}});const text=await r.text();const j=text?JSON.parse(text):{};if(!r.ok) throw new Error(`${r.status} ${text}`);return j;}
async function query(sql){const raw=JSON.parse(fs.readFileSync(keyFile,'utf8'));const project=raw.project_id;const t=await token();const res=await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/queries`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify({query:sql,useLegacySql:false,location:'europe-west1'})});const text=await res.text();const j=text?JSON.parse(text):{};if(!res.ok) throw new Error(`${res.status} ${text}`);return j;}
(async()=>{
  const meta = await api('https://bigquery.googleapis.com/bigquery/v2/projects/despreker/datasets/bing_ads/tables/daily_performance');
  console.log('SCHEMA FIELDS');
  console.log(JSON.stringify(meta.schema?.fields || [], null, 2));
  const fields = (meta.schema?.fields || []).map(f => f.name);
  const dateField = fields.find(f => /date|day|timeperiod/i.test(f));
  console.log('DATE LIKE FIELD', dateField || '(none)');
  if (dateField) {
    const sql = `SELECT MAX(${dateField}) AS max_date, COUNT(*) AS row_count FROM \`despreker.bing_ads.daily_performance\``;
    const freshness = await query(sql);
    console.log('FRESHNESS');
    console.log(JSON.stringify(freshness.rows || [], null, 2));
  }
})();