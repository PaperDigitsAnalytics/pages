const {GoogleAuth} = require('google-auth-library');
const path = require('path');

const ACCOUNT='6343431875';
const CONTAINER='245865019';
const BASE=`accounts/${ACCOUNT}/containers/${CONTAINER}`;
const MEASUREMENT_ID='G-TSSFWKQ41F';
const CONFIG_TAG_NAME='GA4 - Config - pages.paperdigits.nl';
const ALL_PAGES_TRIGGER_ID='2147479553';

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
  const ws = await api(`${BASE}/workspaces`, 'POST', { name: `GA4 Clean Setup ${safeStamp}` });
  const WS = ws.path;
  console.log('Workspace:', WS);

  const triggersResp = await api(`${WS}/triggers`);
  const triggers = triggersResp.trigger || [];
  const triggerMap = Object.fromEntries(triggers.map(t => [t.name, t.triggerId]));

  const createTag = (body) => api(`${WS}/tags`, 'POST', body);

  await createTag({
    name: CONFIG_TAG_NAME,
    type: 'googtag',
    parameter: [
      { type: 'template', key: 'tagId', value: MEASUREMENT_ID }
    ],
    firingTriggerId: [ALL_PAGES_TRIGGER_ID]
  });
  console.log('Created config tag');

  const defs = [
    ['GA4 - Event - generate_lead - whatsapp_click', 'generate_lead', 'CE - whatsapp_click', 'contact_method', 'whatsapp'],
    ['GA4 - Event - view_cta - whatsapp_view', 'view_item', 'CE - whatsapp_view', 'item_name', 'whatsapp_cta'],
    ['GA4 - Event - generate_lead - sticky_cta_click', 'generate_lead', 'CE - sticky_cta_click', 'contact_method', 'sticky_cta'],
    ['GA4 - Event - view_cta - sticky_cta_view', 'view_item', 'CE - sticky_cta_view', 'item_name', 'sticky_cta'],
    ['GA4 - Event - generate_lead - post_cta_click', 'generate_lead', 'CE - post_cta_click', 'contact_method', 'post_cta']
  ];

  for (const [name, eventName, triggerName, paramKey, paramValue] of defs) {
    const triggerId = triggerMap[triggerName];
    if (!triggerId) {
      console.log('Missing trigger:', triggerName);
      continue;
    }
    await createTag({
      name,
      type: 'gaawe',
      parameter: [
        { type: 'template', key: 'eventName', value: eventName },
        { type: 'template', key: 'measurementTag', value: CONFIG_TAG_NAME },
        { type: 'list', key: 'eventSettingsTable', list: [
          { type: 'map', map: [
            { type: 'template', key: 'parameter', value: paramKey },
            { type: 'template', key: 'parameterValue', value: paramValue }
          ]}
        ]}
      ],
      firingTriggerId: [triggerId],
      tagFiringOption: 'ONCE_PER_EVENT'
    });
    console.log('Created event tag:', name);
  }

  const version = await api(`${WS}:create_version`, 'POST', { name: 'Clean GA4 setup via GTM' });
  const cvPath = version.containerVersion?.path;
  if (!cvPath) throw new Error('No containerVersion path from create_version');
  console.log('Version:', cvPath);
  const pub = await api(`${cvPath}:publish`, 'POST');
  console.log('Published:', JSON.stringify(pub, null, 2));
})();