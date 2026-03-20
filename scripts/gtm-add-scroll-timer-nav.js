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
  const ws = await api(`${BASE}/workspaces`, 'POST', { name: `Scroll Timer Nav ${safeStamp}` });
  const WS = ws.path;
  console.log('Workspace:', WS);

  const tags = (await api(`${WS}/tags`)).tag || [];
  const triggers = (await api(`${WS}/triggers`)).trigger || [];
  const builtIns = (await api(`${WS}/built_in_variables`)).builtInVariable || [];
  const tagNames = new Set(tags.map(t => t.name));
  const triggerMap = new Map(triggers.map(t => [t.name, t.triggerId]));
  const builtInTypes = new Set(builtIns.map(v => v.type));

  async function enableBuiltIn(type) {
    if (builtInTypes.has(type)) return;
    await api(`${WS}/built_in_variables`, 'POST', { type });
    builtInTypes.add(type);
    console.log('Enabled built-in variable', type);
  }

  async function ensureTrigger(name, body) {
    if (triggerMap.has(name)) return triggerMap.get(name);
    const created = await api(`${WS}/triggers`, 'POST', Object.assign({ name }, body));
    triggerMap.set(name, created.triggerId);
    console.log('Created trigger', name, created.triggerId);
    return created.triggerId;
  }

  async function ensureTag(name, eventName, triggerId, params) {
    if (tagNames.has(name)) return;
    const list = (params || []).map(([parameter, parameterValue]) => ({
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
        {type:'list', key:'eventSettingsTable', list}
      ],
      firingTriggerId:[String(triggerId)],
      tagFiringOption:'ONCE_PER_EVENT'
    });
    tagNames.add(name);
    console.log('Created tag', name, created.tagId);
  }

  await enableBuiltIn('clickUrl');
  await enableBuiltIn('clickText');
  await enableBuiltIn('clickClasses');
  await enableBuiltIn('clickId');
  await enableBuiltIn('clickElement');
  await enableBuiltIn('pageUrl');
  await enableBuiltIn('pagePath');
  await enableBuiltIn('pageHostname');

  const scrollTriggerId = await ensureTrigger('Scroll Depth - 50%', {
    type:'scrollDepth',
    verticalScrollPercentageList:'50',
    horizontalScrollPercentageList:'',
    triggerStartOption:'WINDOW_LOAD'
  });

  const timerTriggerId = await ensureTrigger('Timer - 20 seconds', {
    type:'timer',
    interval:'20000',
    limit:'1',
    autoEventFilter:[{
      type:'matchesRegex',
      parameter:[
        {type:'template', key:'arg0', value:'{{Page Hostname}}'},
        {type:'template', key:'arg1', value:'.*'}
      ]
    }]
  });

  const internalNavTriggerId = await ensureTrigger('Click - Internal Navigation', {
    type:'linkClick',
    waitForTags:{ type:'boolean', key:'waitForTags', value:'false' },
    checkValidation:{ type:'boolean', key:'checkValidation', value:'false' },
    filter:[
      {
        type:'matchesRegex',
        parameter:[
          {type:'template', key:'arg0', value:'{{Click URL}}'},
          {type:'template', key:'arg1', value:'^(https?:\\/\\/pages\\.paperdigits\\.nl\\/|\\/).*'}
        ]
      },
      {
        type:'doesNotMatchRegex',
        parameter:[
          {type:'template', key:'arg0', value:'{{Click URL}}'},
          {type:'template', key:'arg1', value:'^(mailto:|tel:|javascript:|#).*'}
        ]
      }
    ]
  });

  await ensureTag('GA4 - scroll_50', 'scroll_50', scrollTriggerId, [
    ['scroll_threshold', '50'],
    ['page_path', '{{Page Path}}']
  ]);

  await ensureTag('GA4 - timer_20_seconds', 'timer_20_seconds', timerTriggerId, [
    ['engagement_time_seconds', '20'],
    ['page_path', '{{Page Path}}']
  ]);

  await ensureTag('GA4 - internal_navigation_click', 'internal_navigation_click', internalNavTriggerId, [
    ['link_url', '{{Click URL}}'],
    ['link_text', '{{Click Text}}'],
    ['link_classes', '{{Click Classes}}'],
    ['link_id', '{{Click ID}}'],
    ['page_path', '{{Page Path}}']
  ]);

  const version = await api(`${WS}:create_version`, 'POST', { name:'Add scroll_50, timer_20_seconds, internal_navigation_click' });
  const cvPath = version.containerVersion?.path;
  console.log('Version:', cvPath);
  const pub = await api(`${cvPath}:publish`, 'POST');
  console.log('Published:', JSON.stringify(pub, null, 2));
})();
