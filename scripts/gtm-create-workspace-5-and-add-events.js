const {GoogleAuth}=require('google-auth-library');
const path=require('path');
const ACCOUNT='6343431875';
const CONTAINER='245865019';
const BASE=`accounts/${ACCOUNT}/containers/${CONTAINER}`;
const MID='G-TSSFWKQ41F';
const ALL_PAGES_TRIGGER_ID='2147479553';
async function token(){const auth=new GoogleAuth({keyFile:path.join(__dirname,'..','secrets','gtm-service-account.json'),scopes:['https://www.googleapis.com/auth/tagmanager.edit.containers','https://www.googleapis.com/auth/tagmanager.edit.containerversions','https://www.googleapis.com/auth/tagmanager.publish']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function api(p,m='GET',b){const t=await token();const r=await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${p}`,{method:m,headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});const text=await r.text();let j={};try{j=text?JSON.parse(text):{}}catch{j={raw:text}};if(!r.ok) throw new Error(`${m} ${p} -> HTTP ${r.status}: ${JSON.stringify(j)}`);return j;}
(async()=>{
 const safeStamp=new Date().toISOString().replace(/[:.]/g,'-');
 const ws=await api(`${BASE}/workspaces`,'POST',{name:`GA4 Events Setup ${safeStamp}`});
 const WS=ws.path;
 console.log('Workspace',WS);
 const triggers=(await api(`${WS}/triggers`)).trigger||[];
 const trigIdByName=Object.fromEntries(triggers.map(t=>[t.name,t.triggerId]));
 const config=await api(`${WS}/tags`,'POST',{
   name:'GA4 - Config - pages.paperdigits.nl',
   type:'googtag',
   parameter:[{type:'template',key:'tagId',value:MID}],
   firingTriggerId:[ALL_PAGES_TRIGGER_ID]
 });
 console.log('Config tag',config.tagId);
 const defs=[
  ['GA4 - Event - generate_lead - whatsapp_click','generate_lead','CE - whatsapp_click','contact_method','whatsapp'],
  ['GA4 - Event - view_item - whatsapp_view','view_item','CE - whatsapp_view','item_name','whatsapp_cta'],
  ['GA4 - Event - generate_lead - sticky_cta_click','generate_lead','CE - sticky_cta_click','contact_method','sticky_cta'],
  ['GA4 - Event - view_item - sticky_cta_view','view_item','CE - sticky_cta_view','item_name','sticky_cta'],
  ['GA4 - Event - generate_lead - post_cta_click','generate_lead','CE - post_cta_click','contact_method','post_cta']
 ];
 for(const [name,eventName,triggerName,paramKey,paramValue] of defs){
   const triggerId=trigIdByName[triggerName];
   if(!triggerId){console.log('Missing trigger',triggerName);continue;}
   const created=await api(`${WS}/tags`,'POST',{
     name,
     type:'gaawe',
     parameter:[
       {type:'template',key:'eventName',value:eventName},
       {type:'template',key:'measurementIdOverride',value:MID},
       {type:'list',key:'eventSettingsTable',list:[{type:'map',map:[
         {type:'template',key:'parameter',value:paramKey},
         {type:'template',key:'parameterValue',value:paramValue}
       ]}]}
     ],
     firingTriggerId:[triggerId],
     tagFiringOption:'ONCE_PER_EVENT'
   });
   console.log('Created',name,created.tagId);
 }
 const version=await api(`${WS}:create_version`,'POST',{name:'GA4 base + event tags'});
 const cv=version.containerVersion?.path; if(!cv) throw new Error('No containerVersion path');
 console.log('Version',cv);
 const pub=await api(`${cv}:publish`,'POST');
 console.log(JSON.stringify(pub,null,2));
})();