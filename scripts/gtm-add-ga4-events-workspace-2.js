const {GoogleAuth}=require('google-auth-library');
const path=require('path');

const ACCOUNT='6343431875';
const CONTAINER='245865019';
const WORKSPACE='2';
const WS=`accounts/${ACCOUNT}/containers/${CONTAINER}/workspaces/${WORKSPACE}`;
const MID='G-TSSFWKQ41F';

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
  const tags=(await api(`${WS}/tags`)).tag||[];
  const triggers=(await api(`${WS}/triggers`)).trigger||[];
  const tagNames=new Set(tags.map(t=>t.name));
  const triggerByName=new Map(triggers.map(t=>[t.name,t]));

  async function ensureTrigger(name,eventName){
    const existing=triggerByName.get(name);
    if(existing) return existing.triggerId;
    const created=await api(`${WS}/triggers`,'POST',{
      name,
      type:'customEvent',
      customEventFilter:[{
        type:'equals',
        parameter:[
          {type:'template',key:'arg0',value:'{{_event}}'},
          {type:'template',key:'arg1',value:eventName}
        ]
      }]
    });
    triggerByName.set(name,created);
    console.log('Created trigger',name,created.triggerId);
    return created.triggerId;
  }

  async function ensureTag(name,eventName,triggerId,settings){
    if(tagNames.has(name)){
      console.log('Exists tag',name);
      return;
    }
    const list=settings.map(([parameter,parameterValue])=>({
      type:'map',
      map:[
        {type:'template',key:'parameter',value:parameter},
        {type:'template',key:'parameterValue',value:parameterValue}
      ]
    }));
    const created=await api(`${WS}/tags`,'POST',{
      name,
      type:'gaawe',
      parameter:[
        {type:'template',key:'eventName',value:eventName},
        {type:'template',key:'measurementIdOverride',value:MID},
        {type:'list',key:'eventSettingsTable',list}
      ],
      firingTriggerId:[String(triggerId)],
      tagFiringOption:'ONCE_PER_EVENT'
    });
    tagNames.add(name);
    console.log('Created tag',name,created.tagId);
  }

  const defs=[
    {
      triggerName:'CE - sticky_cta_view',
      eventName:'sticky_cta_view',
      ga4Tag:'GA4 - sticky_cta_view',
      settings:[['contact_method','sticky_cta']]
    },
    {
      triggerName:'CE - sticky_cta_click',
      eventName:'generate_lead',
      ga4Tag:'GA4 - generate_lead - sticky_cta_click',
      settings:[['contact_method','sticky_cta']]
    },
    {
      triggerName:'CE - post_cta_click',
      eventName:'generate_lead',
      ga4Tag:'GA4 - generate_lead - post_cta_click',
      settings:[['contact_method','post_cta']]
    },
    {
      triggerName:'CE - whatsapp_click',
      eventName:'generate_lead',
      ga4Tag:'GA4 - generate_lead - whatsapp_click',
      settings:[['contact_method','whatsapp']]
    },
    {
      triggerName:'CE - whatsapp_view',
      eventName:'whatsapp_view',
      ga4Tag:'GA4 - whatsapp_view',
      settings:[['contact_method','whatsapp']]
    },
    {
      triggerName:'CE - consent_update',
      eventName:'consent_update',
      ga4Tag:'GA4 - consent_update',
      settings:[['consent_choice','{{dlv - consent_choice}}'],['consent_analytics','{{dlv - consent_analytics}}'],['consent_marketing','{{dlv - consent_marketing}}']]
    }
  ];

  const vars=(await api(`${WS}/variables`)).variable||[];
  const varNames=new Set(vars.map(v=>v.name));
  async function ensureDlv(name,key){
    if(varNames.has(name)) { console.log('Exists variable',name); return; }
    const created=await api(`${WS}/variables`,'POST',{
      name,
      type:'v',
      parameter:[
        {type:'integer',key:'dataLayerVersion',value:'2'},
        {type:'boolean',key:'setDefaultValue',value:'false'},
        {type:'template',key:'name',value:key}
      ]
    });
    varNames.add(name);
    console.log('Created variable',name,created.variableId);
  }

  await ensureDlv('dlv - consent_choice','consent_choice');
  await ensureDlv('dlv - consent_analytics','consent_analytics');
  await ensureDlv('dlv - consent_marketing','consent_marketing');

  for(const def of defs){
    const triggerId=await ensureTrigger(def.triggerName, def.triggerName.replace('CE - ', ''));
    await ensureTag(def.ga4Tag, def.eventName, triggerId, def.settings);
  }

  const version=await api(`${WS}:create_version`,'POST',{name:'Add GA4 event tags for CTA + consent events'});
  const cv=version.containerVersion?.path;
  if(!cv) throw new Error('No containerVersion path from create_version');
  console.log('Created version',cv);
  const pub=await api(`${cv}:publish`,'POST');
  console.log('Published', JSON.stringify(pub,null,2));
})();
