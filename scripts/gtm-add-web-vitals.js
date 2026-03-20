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
  const safeStamp = new Date().toISOString().replace(/[:.]/g,'-');
  const ws = await api(`${BASE}/workspaces`, 'POST', { name: `Web Vitals ${safeStamp}` });
  const WS = ws.path;
  console.log('Workspace:', WS);

  const variables = (await api(`${WS}/variables`)).variable || [];
  const triggers = (await api(`${WS}/triggers`)).trigger || [];
  const tags = (await api(`${WS}/tags`)).tag || [];
  const variableNames = new Set(variables.map(v => v.name));
  const triggerNames = new Set(triggers.map(t => t.name));
  const tagNames = new Set(tags.map(t => t.name));
  const triggerMap = new Map(triggers.map(t => [t.name, t.triggerId]));

  async function ensureDlv(name,key){
    if(variableNames.has(name)) return;
    const created = await api(`${WS}/variables`, 'POST', {
      name,
      type:'v',
      parameter:[
        {type:'integer', key:'dataLayerVersion', value:'2'},
        {type:'boolean', key:'setDefaultValue', value:'false'},
        {type:'template', key:'name', value:key}
      ]
    });
    variableNames.add(name);
    console.log('Created variable', name, created.variableId);
  }

  async function ensureTrigger(name, eventName){
    if(triggerNames.has(name)) return triggerMap.get(name);
    const created = await api(`${WS}/triggers`, 'POST', {
      name,
      type:'customEvent',
      customEventFilter:[{
        type:'equals',
        parameter:[
          {type:'template', key:'arg0', value:'{{_event}}'},
          {type:'template', key:'arg1', value:eventName}
        ]
      }]
    });
    triggerNames.add(name);
    triggerMap.set(name, created.triggerId);
    console.log('Created trigger', name, created.triggerId);
    return created.triggerId;
  }

  async function ensureTag(name, eventName, triggerId){
    if(tagNames.has(name)) return;
    const params = [
      ['web_vital_name','{{dlv - web_vital_name}}'],
      ['web_vital_value','{{dlv - web_vital_value}}'],
      ['web_vital_value_raw','{{dlv - web_vital_value_raw}}'],
      ['web_vital_unit','{{dlv - web_vital_unit}}'],
      ['web_vital_rating','{{dlv - web_vital_rating}}'],
      ['page_type','{{dlv - page_type}}'],
      ['content_group','{{dlv - content_group}}'],
      ['article_slug','{{dlv - article_slug}}'],
      ['article_title','{{dlv - article_title}}']
    ].map(([parameter, parameterValue]) => ({
      type:'map',
      map:[
        {type:'template', key:'parameter', value:parameter},
        {type:'template', key:'parameterValue', value:parameterValue}
      ]
    }));
    const created = await api(`${WS}/tags`, 'POST', {
      name,
      type:'gaawe',
      parameter:[
        {type:'template', key:'eventName', value:eventName},
        {type:'template', key:'measurementIdOverride', value:MID},
        {type:'list', key:'eventSettingsTable', list: params}
      ],
      firingTriggerId:[String(triggerId)],
      tagFiringOption:'ONCE_PER_EVENT'
    });
    tagNames.add(name);
    console.log('Created tag', name, created.tagId);
  }

  for (const [name,key] of [
    ['dlv - web_vital_name','web_vital_name'],
    ['dlv - web_vital_value','web_vital_value'],
    ['dlv - web_vital_value_raw','web_vital_value_raw'],
    ['dlv - web_vital_unit','web_vital_unit'],
    ['dlv - web_vital_rating','web_vital_rating'],
    ['dlv - page_type','page_type'],
    ['dlv - content_group','content_group'],
    ['dlv - article_slug','article_slug'],
    ['dlv - article_title','article_title']
  ]) await ensureDlv(name,key);

  for (const evt of ['web_vital_lcp','web_vital_cls','web_vital_inp','web_vital_fcp','web_vital_ttfb']) {
    const trig = await ensureTrigger(`CE - ${evt}`, evt);
    await ensureTag(`GA4 - Event - ${evt}`, evt, trig);
  }

  const version = await api(`${WS}:create_version`, 'POST', { name:'Add GA4 web vitals events' });
  const cvPath = version.containerVersion?.path;
  console.log('Version:', cvPath);
  const pub = await api(`${cvPath}:publish`, 'POST');
  console.log('Published:', JSON.stringify(pub, null, 2));
})();
