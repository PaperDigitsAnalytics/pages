const { GoogleAuth } = require('google-auth-library');
(async()=>{
 const auth=new GoogleAuth({keyFilename:'C:/Users/wouter/Documents/pages-v2/big-button-383207-c50b2059a006.json',scopes:['https://www.googleapis.com/auth/cloud-platform']});
 const client=await auth.getClient();
 const token=await client.getAccessToken();
 const res=await fetch('https://bigquerydatatransfer.googleapis.com/v1/projects/big-button-383207/locations/us-central1/transferConfigs',{headers:{Authorization:`Bearer ${token.token||token}`}});
 console.log(res.status); console.log(await res.text());
})().catch(e=>{console.error(e.stack||String(e));process.exit(1)})