const {GoogleAuth}=require('google-auth-library');
const path=require('path');
const WS='accounts/6343431875/containers/245865019/workspaces/4';
const MID='G-TSSFWKQ41F';
async function token(){const auth=new GoogleAuth({keyFile:path.join(__dirname,'..','secrets','gtm-service-account.json'),scopes:['https://www.googleapis.com/auth/tagmanager.edit.containers','https://www.googleapis.com/auth/tagmanager.edit.containerversions','https://www.googleapis.com/auth/tagmanager.publish']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function api(p,m='GET',b){const t=await token();const r=await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${p}`,{method:m,headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});const text=await r.text();let j={};try{j=text?JSON.parse(text):{}}catch{j={raw:text}};if(!r.ok) throw new Error(`${m} ${p} -> HTTP ${r.status}: ${JSON.stringify(j)}`);return j;}
(async()=>{
 const tags=(await api(`${WS}/tags`)).tag||[];
 const triggers=(await api(`${WS}/triggers`)).trigger||[];
 const trigIdByName=Object.fromEntries(triggers.map(t=>[t.name,t.triggerId]));
 const existingNames=new Set(tags.map(t=>t.name));
 const defs=[
  ['GA4 - Event - generate_lead - whatsapp_click','generate_lead','CE - whatsapp_click','contact_method','whatsapp'],
  ['GA4 - Event - view_item - whatsapp_view','view_item','CE - whatsapp_view','item_name','whatsapp_cta'],
  ['GA4 - Event - generate_lead - sticky_cta_click','generate_lead','CE - sticky_cta_click','contact_method','sticky_cta'],
  ['GA4 - Event - view_item - sticky_cta_view','view_item','CE - sticky_cta_view','item_name','sticky_cta'],
  ['GA4 - Event - generate_lead - post_cta_click','generate_lead','CE - post_cta_click','contact_method','post_cta']
 ];
 for(const [name,eventName,triggerName,paramKey,paramValue] of defs){
   if(existingNames.has(name)){console.log('Exists',name);continue;}
   const triggerId=trigIdByName[triggerName];
   if(!triggerId){console.log('Missing trigger',triggerName);continue;}
   const body={
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
   };
   const created=await api(`${WS}/tags`,'POST',body);
   console.log('Created',name,created.tagId);
 }
 const version=await api(`${WS}:create_version`,'POST',{name:'Add GA4 event tags via measurementIdOverride'});
 const cv=version.containerVersion?.path; if(!cv) throw new Error('No containerVersion path');
 console.log('Version',cv);
 const published=await api(`${cv}:publish`,'POST');
 console.log(JSON.stringify(published,null,2));
})();