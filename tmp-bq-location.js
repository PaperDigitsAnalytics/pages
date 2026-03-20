const { GoogleAuth } = require('google-auth-library');
const { BigQuery } = require('@google-cloud/bigquery');
(async()=>{
 const auth=new GoogleAuth({keyFilename:'C:/Users/wouter/Documents/pages-v2/big-button-383207-c50b2059a006.json',scopes:['https://www.googleapis.com/auth/cloud-platform']});
 const authClient=await auth.getClient();
 const client=new BigQuery({projectId:'big-button-383207',authClient});
 for (const name of ['analytics_527840866','google_ads','google_analytics_4']) {
   const [meta]=await client.dataset(name).getMetadata();
   console.log(name, meta.location);
 }
})().catch(e=>{console.error(e.stack||String(e));process.exit(1)})