const {GoogleAuth}=require('google-auth-library');
const path=require('path');
const ACCOUNT='6343431875';
const CONTAINER='245865019';
const BASE=`accounts/${ACCOUNT}/containers/${CONTAINER}`;
const OLD_TAG_NAMES=[
  'Base - Google tag (GA4 + Ads)',
  'Ads - WhatsApp Click',
  'Ads - WhatsApp View',
  'Ads - Sticky CTA Click',
  'Ads - Post CTA Click'
];
async function token(){const auth=new GoogleAuth({keyFile:path.join(__dirname,'..','secrets','gtm-service-account.json'),scopes:['https://www.googleapis.com/auth/tagmanager.edit.containers','https://www.googleapis.com/auth/tagmanager.edit.containerversions','https://www.googleapis.com/auth/tagmanager.publish']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function api(p,m='GET',b){const t=await token();const r=await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${p}`,{method:m,headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});const text=await r.text();let j={};try{j=text?JSON.parse(text):{}}catch{j={raw:text}};if(!r.ok) throw new Error(`${m} ${p} -> HTTP ${r.status}: ${JSON.stringify(j)}`);return j;}
(async()=>{
 const safeStamp=new Date().toISOString().replace(/[:.]/g,'-');
 const ws=await api(`${BASE}/workspaces`,'POST',{name:`Cleanup old HTML tags ${safeStamp}`});
 const WS=ws.path;
 console.log('Workspace',WS);
 const tags=(await api(`${WS}/tags`)).tag||[];
 for(const tag of tags){
   if(OLD_TAG_NAMES.includes(tag.name)){
     await api(tag.path,'DELETE');
     console.log('Deleted',tag.tagId,tag.name);
   }
 }
 const version=await api(`${WS}:create_version`,'POST',{name:'Remove overlapping old HTML GTM tags'});
 const cv=version.containerVersion?.path; if(!cv) throw new Error('No containerVersion path');
 console.log('Version',cv);
 const pub=await api(`${cv}:publish`,'POST');
 console.log(JSON.stringify(pub,null,2));
})();