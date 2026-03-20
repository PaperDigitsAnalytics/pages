const {GoogleAuth} = require('google-auth-library');
const path = require('path');

const ACCOUNT='6343431875';
const CONTAINER='245865019';
const BASE=`accounts/${ACCOUNT}/containers/${CONTAINER}`;
const MID='G-TSSFWKQ41F';

async function getToken() {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname,'..','secrets','gtm-service-account.json'),
    scopes: [
      'https://www.googleapis.com/auth/tagmanager.edit.containers',
      'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
      'https://www.googleapis.com/auth/tagmanager.publish'
    ]
  });
  const client = await auth.getClient();
  return (await client.getAccessToken()).token;
}
async function api(pathname, method='GET', body) {
  const token = await getToken();
  const res = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json={}; try{ json = text ? JSON.parse(text) : {}; } catch { json={raw:text}; }
  if (!res.ok) throw new Error(`${method} ${pathname} -> HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

(async()=>{
  const safeStamp = new Date().toISOString().replace(/[:.]/g, '-');
  const ws = await api(`${BASE}/workspaces`, 'POST', { name: `GA4 Event Fill ${safeStamp}` });
  const WS = ws.path;
  console.log('Workspace:', WS);

  const triggersResp = await api(`${WS}/triggers`);
  const variablesResp = await api(`${WS}/variables`);
  const tagsResp = await api(`${WS}/tags`);
  const triggers = triggersResp.trigger || [];
  const variables = variablesResp.variable || [];
  const tags = tagsResp.tag || [];
  const triggerMap = new Map(triggers.map(t => [t.name, t]));
  const variableNames = new Set(variables.map(v => v.name));
  const tagNames = new Set(tags.map(t => t.name));

  async function ensureTrigger(name,eventName){
    const existing=triggerMap.get(name);
    if(existing) return existing.triggerId;
    const created = await api(`${WS}/triggers`, 'POST', {
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
    triggerMap.set(name, created);
    console.log('Created trigger:', name, created.triggerId);
    return created.triggerId;
  }

  async function ensureDlv(name,key){
    if(variableNames.has(name)) { console.log('Exists variable:', name); return; }
    const created = await api(`${WS}/variables`, 'POST', {
      name,
      type:'v',
      parameter:[
        {type:'integer',key:'dataLayerVersion',value:'2'},
        {type:'boolean',key:'setDefaultValue',value:'false'},
        {type:'template',key:'name',value:key}
      ]
    });
    variableNames.add(name);
    console.log('Created variable:', name, created.variableId);
  }

  async function ensureGa4Tag(name,eventName,triggerId,settings){
    if(tagNames.has(name)) { console.log('Exists tag:', name); return; }
    const created = await api(`${WS}/tags`, 'POST', {
      name,
      type:'gaawe',
      parameter:[
        {type:'template',key:'eventName',value:eventName},
        {type:'template',key:'measurementIdOverride',value:MID},
        {type:'list',key:'eventSettingsTable',list:settings.map(([parameter, parameterValue]) => ({
          type:'map',
          map:[
            {type:'template',key:'parameter',value:parameter},
            {type:'template',key:'parameterValue',value:parameterValue}
          ]
        }))}
      ],
      firingTriggerId:[String(triggerId)],
      tagFiringOption:'ONCE_PER_EVENT'
    });
    tagNames.add(name);
    console.log('Created tag:', name, created.tagId);
  }

  await ensureDlv('dlv - consent_choice', 'consent_choice');
  await ensureDlv('dlv - consent_analytics', 'consent_analytics');
  await ensureDlv('dlv - consent_marketing', 'consent_marketing');

  const defs = [
    ['CE - sticky_cta_view','sticky_cta_view','GA4 - sticky_cta_view', [['contact_method','sticky_cta']]],
    ['CE - sticky_cta_click','generate_lead','GA4 - generate_lead - sticky_cta_click', [['contact_method','sticky_cta']]],
    ['CE - post_cta_click','generate_lead','GA4 - generate_lead - post_cta_click', [['contact_method','post_cta']]],
    ['CE - whatsapp_click','generate_lead','GA4 - generate_lead - whatsapp_click', [['contact_method','whatsapp']]],
    ['CE - whatsapp_view','whatsapp_view','GA4 - whatsapp_view', [['contact_method','whatsapp']]],
    ['CE - consent_update','consent_update','GA4 - consent_update', [['consent_choice','{{dlv - consent_choice}}'],['consent_analytics','{{dlv - consent_analytics}}'],['consent_marketing','{{dlv - consent_marketing}}']]]
  ];

  for (const [triggerName,eventName,tagName,settings] of defs) {
    const triggerId = await ensureTrigger(triggerName, triggerName.replace('CE - ', ''));
    await ensureGa4Tag(tagName, eventName, triggerId, settings);
  }

  const version = await api(`${WS}:create_version`, 'POST', { name: 'Add GA4 event tags for CTA and consent events' });
  const cvPath = version.containerVersion?.path;
  if (!cvPath) throw new Error('No containerVersion path from create_version');
  console.log('Version:', cvPath);
  const pub = await api(`${cvPath}:publish`, 'POST');
  console.log('Published:', JSON.stringify(pub, null, 2));
})();
