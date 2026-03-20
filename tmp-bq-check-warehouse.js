const { GoogleAuth } = require('google-auth-library');
const { BigQuery } = require('@google-cloud/bigquery');
(async()=>{
 const auth=new GoogleAuth({keyFilename:'C:/Users/wouter/Documents/pages-v2/big-button-383207-c50b2059a006.json',scopes:['https://www.googleapis.com/auth/cloud-platform']});
 const authClient=await auth.getClient();
 const bq=new BigQuery({projectId:'big-button-383207',authClient});
 for (const dsName of ['ga4_staging','ga4_intermediate','ga4_marts']) {
   const [tables]=await bq.dataset(dsName).getTables({maxResults:20});
   console.log(dsName, tables.map(t=>t.id));
 }
})().catch(e=>{console.error(e.stack||String(e));process.exit(1)})