const {GoogleAuth}=require('google-auth-library');
const path=require('path');

const ACCOUNT='6343431875';
const CONTAINER='245865019';
const BASE=`accounts/${ACCOUNT}/containers/${CONTAINER}`;
const ADS_ID='AW-11476910514';
const ALL_PAGES_TRIGGER_ID='2147479553';

async function token(){
  const auth=new GoogleAuth({
    keyFile:path.join(__dirname,'..','secrets','gtm-service-account.json'),
    scopes:[
      'https://www.googleapis.com/auth/tagmanager.edit.containers',
      'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
      'https://www.googleapis.com/auth/tagmanager.publish'
    ]
  });
  const c=await auth.getClient();
  return (await c.getAccessToken()).token;
}
async function api(p,m='GET',b){
  const t=await token();
  const r=await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${p}`,{
    method:m,
    headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},
    body:b?JSON.stringify(b):undefined
  });
  const text=await r.text();
  let j={}; try{j=text?JSON.parse(text):{}}catch{j={raw:text}};
  if(!r.ok) throw new Error(`${m} ${p} -> HTTP ${r.status}: ${JSON.stringify(j)}`);
  return j;
}

(async()=>{
  const safeStamp=new Date().toISOString().replace(/[:.]/g,'-');
  const ws=await api(`${BASE}/workspaces`,'POST',{name:`Ads conversion setup ${safeStamp}`});
  const WS=ws.path;
  console.log('Workspace',WS);

  const tags=(await api(`${WS}/tags`)).tag||[];
  const triggers=(await api(`${WS}/triggers`)).trigger||[];
  const trigIdByName=Object.fromEntries(triggers.map(t=>[t.name,t.triggerId]));
  const existing=new Set(tags.map(t=>t.name));

  async function createTag(body){
    return api(`${WS}/tags`,'POST',body);
  }

  if(!existing.has('Google tag - Ads - pages.paperdigits.nl')){
    const base=await createTag({
      name:'Google tag - Ads - pages.paperdigits.nl',
      type:'googtag',
      parameter:[{type:'template',key:'tagId',value:ADS_ID}],
      firingTriggerId:[ALL_PAGES_TRIGGER_ID]
    });
    console.log('Created ads base tag', base.tagId);
  } else {
    console.log('Ads base tag already exists');
  }

  const defs=[
    ['Ads - Conversion - WhatsApp Click','CE - whatsapp_click','AW-11476910514/8heqCIDBwKAbELKDz-Aq'],
    ['Ads - Conversion - WhatsApp View','CE - whatsapp_view','AW-11476910514/-6THCNK6waAbELKDz-Aq'],
    ['Ads - Conversion - Sticky CTA Click','CE - sticky_cta_click','AW-11476910514/zc8tCKbG8IUcELKDz-Aq'],
    ['Ads - Conversion - Post CTA Click','CE - post_cta_click','AW-11476910514/zc8tCKbG8IUcELKDz-Aq']
  ];

  for(const [name,triggerName,sendTo] of defs){
    if(existing.has(name)) { console.log('Exists',name); continue; }
    const trig=trigIdByName[triggerName];
    if(!trig){ console.log('Missing trigger', triggerName); continue; }
    const tag=await createTag({
      name,
      type:'html',
      parameter:[{
        type:'template',
        key:'html',
        value:`<script>\n(function(){\n  try {\n    var raw = localStorage.getItem('pd_cookie_consent_v1');\n    var consent = raw ? JSON.parse(raw) : null;\n    if (!consent || !consent.marketing) return;\n  } catch(e) { return; }\n  window.dataLayer = window.dataLayer || [];\n  window.gtag = window.gtag || function(){dataLayer.push(arguments);};\n  gtag('event','conversion',{send_to:'${sendTo}'});\n})();\n<\/script>`
      }],
      firingTriggerId:[trig],
      tagFiringOption:'ONCE_PER_EVENT'
    });
    console.log('Created', name, tag.tagId);
  }

  const version=await api(`${WS}:create_version`,'POST',{name:'Add Google Ads conversion tags'});
  const cv=version.containerVersion?.path; if(!cv) throw new Error('No containerVersion path');
  console.log('Version',cv);
  const pub=await api(`${cv}:publish`,'POST');
  console.log(JSON.stringify(pub,null,2));
})();