const {GoogleAuth}=require('google-auth-library');
const fs=require('fs');
const keyFile='C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';
async function token(){const auth=new GoogleAuth({keyFile,scopes:['https://www.googleapis.com/auth/bigquery']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function query(sql){const raw=JSON.parse(fs.readFileSync(keyFile,'utf8'));const project=raw.project_id;const t=await token();const r=await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/queries`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify({query:sql,useLegacySql:false,location:'europe-west1'})});const text=await r.text();const j=text?JSON.parse(text):{};if(!r.ok) throw new Error(`${r.status} ${text}`);return j;}
(async()=>{
  const sql = `
  SELECT
    source_conversion_id,
    source_conversion_name,
    source_conversion_category,
    source_attribution_event_type,
    normalized_conversion_type,
    normalized_conversion_group,
    is_primary_conversion,
    is_business_conversion,
    is_revenue_conversion
  FROM \\`despreker.intermediate_advertising.dim_conversion_action\\`
  ORDER BY source_conversion_name`;
  const r = await query(sql);
  console.log(JSON.stringify(r.rows||[], null, 2));
})();