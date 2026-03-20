const {GoogleAuth} = require('google-auth-library');
const path = require('path');

const ACCOUNT='6343431875';
const CONTAINER='245865019';
const WORKSPACE='2';
const WS=`accounts/${ACCOUNT}/containers/${CONTAINER}/workspaces/${WORKSPACE}`;
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

async function list(pathname, key) {
  const r = await api(pathname);
  return r[key] || [];
}

(async()=>{
  const tags = await list(`${WS}/tags`, 'tag');
  const triggers = await list(`${WS}/triggers`, 'trigger');

  const triggerMap = Object.fromEntries(triggers.map(t => [t.name, t.triggerId]));

  async function ensureTag(name, payloadBuilder) {
    const existing = tags.find(t => t.name === name);
    if (existing) {
      console.log('Exists:', name, existing.tagId);
      return existing;
    }
    const created = await api(`${WS}/tags`, 'POST', payloadBuilder());
    console.log('Created:', name, created.tagId);
    tags.push(created);
    return created;
  }

  await ensureTag(CONFIG_TAG_NAME, () => ({
    name: CONFIG_TAG_NAME,
    type: 'googtag',
    parameter: [
      { type: 'template', key: 'tagId', value: MEASUREMENT_ID }
    ],
    firingTriggerId: [ALL_PAGES_TRIGGER_ID]
  }));

  const eventDefs = [
    ['GA4 - Event - generate_lead - whatsapp_click', 'generate_lead', 'CE - whatsapp_click', 'contact_method', 'whatsapp'],
    ['GA4 - Event - view_cta - whatsapp_view', 'view_item', 'CE - whatsapp_view', 'item_name', 'whatsapp_cta'],
    ['GA4 - Event - generate_lead - sticky_cta_click', 'generate_lead', 'CE - sticky_cta_click', 'contact_method', 'sticky_cta'],
    ['GA4 - Event - view_cta - sticky_cta_view', 'view_item', 'CE - sticky_cta_view', 'item_name', 'sticky_cta'],
    ['GA4 - Event - generate_lead - post_cta_click', 'generate_lead', 'CE - post_cta_click', 'contact_method', 'post_cta']
  ];

  for (const [name, eventName, triggerName, paramKey, paramValue] of eventDefs) {
    const triggerId = triggerMap[triggerName];
    if (!triggerId) {
      console.log('Missing trigger, skipping:', triggerName);
      continue;
    }
    await ensureTag(name, () => ({
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
    }));
  }

  console.log('Done');
})();
