const {GoogleAuth}=require('google-auth-library');
const fs=require('fs');
const keyFile='C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';
const targets=['staging_advertising','intermediate_advertising','marts_sea'];
async function token(){const auth=new GoogleAuth({keyFile,scopes:['https://www.googleapis.com/auth/bigquery.readonly']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function api(url){const t=await token();const r=await fetch(url,{headers:{Authorization:`Bearer ${t}`}});const text=await r.text();const j=text?JSON.parse(text):{};if(!r.ok) throw new Error(`${r.status} ${text}`);return j;}
(async()=>{const raw=JSON.parse(fs.readFileSync(keyFile,'utf8'));const project=raw.project_id;for(const ds of targets){const j=await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/datasets/${ds}`);console.log(ds,j.location);}})().catch(e=>{console.error(e.stack||String(e));process.exit(1);});