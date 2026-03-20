const { GoogleAuth } = require('google-auth-library');
const { BigQuery } = require('@google-cloud/bigquery');
(async()=>{
 const auth=new GoogleAuth({keyFilename:'C:/Users/wouter/Documents/pages-v2/big-button-383207-c50b2059a006.json',scopes:['https://www.googleapis.com/auth/bigquery','https://www.googleapis.com/auth/cloud-platform']});
 const authClient=await auth.getClient();
 const client=new BigQuery({projectId:'big-button-383207',authClient});
 const [datasets]=await client.getDatasets({maxResults:50});
 const out=[];
 for (const ds of datasets){
   const [tables]=await ds.getTables({maxResults:20});
   out.push({dataset:ds.id,tables:tables.map(t=>t.id)});
 }
 console.log(JSON.stringify(out,null,2));
})().catch(e=>{console.error(e.stack||String(e));process.exit(1)})