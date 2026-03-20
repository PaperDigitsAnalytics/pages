const {GoogleAuth} = require('google-auth-library');
const fs = require('fs');
const keyFile = 'C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';
const targets = {
  google_ads: ['AccountBasicStats_3612505204','Campaign_3612505204','CampaignBasicStats_3612505204','AdGroup_3612505204','AdGroupBasicStats_3612505204'],
  bing_ads: ['raw_campaign_basic_stats','raw_ad_group_basic_stats','bing_campaign_settings','bing_ad_group_settings'],
  facebook_ads: ['campaign','campaign_conversion','adset','adset_conversion']
};
async function token(){const auth=new GoogleAuth({keyFile,scopes:['https://www.googleapis.com/auth/bigquery.readonly']}); const c=await auth.getClient(); return (await c.getAccessToken()).token;}
async function api(url){const t=await token(); const r=await fetch(url,{headers:{Authorization:`Bearer ${t}`}}); const text=await r.text(); const j=text?JSON.parse(text):{}; if(!r.ok) throw new Error(`${r.status} ${text}`); return j;}
(async()=>{const raw=JSON.parse(fs.readFileSync(keyFile,'utf8')); const project=raw.project_id; for(const [ds,tables] of Object.entries(targets)){ console.log(`\n## ${ds}`); for(const table of tables){ const meta=await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/datasets/${ds}/tables/${table}`); console.log(`\n[${table}] type=${meta.type}`); const fields=((meta.schema&&meta.schema.fields)||[]).slice(0,20).map(f=>`${f.name}:${f.type}`); for(const f of fields) console.log(`- ${f}`); } } })().catch(e=>{console.error(e.stack||String(e)); process.exit(1);});