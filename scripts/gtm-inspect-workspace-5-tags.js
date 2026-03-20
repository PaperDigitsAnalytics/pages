const {GoogleAuth}=require('google-auth-library');
const path=require('path');
const WS='accounts/6343431875/containers/245865019/workspaces/5';
async function token(){const auth=new GoogleAuth({keyFile:path.join(__dirname,'..','secrets','gtm-service-account.json'),scopes:['https://www.googleapis.com/auth/tagmanager.edit.containers','https://www.googleapis.com/auth/tagmanager.readonly']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function api(p){const t=await token();const r=await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${p}`,{headers:{Authorization:`Bearer ${t}`}});const text=await r.text();let j={};try{j=text?JSON.parse(text):{}}catch{j={raw:text}};console.log(JSON.stringify(j,null,2));}
(async()=>{await api(`${WS}/tags`); await api(`${WS}/triggers`);})();