const {GoogleAuth} = require('google-auth-library');
const path = require('path');

const WS='accounts/6343431875/containers/245865019/workspaces/12';
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
  const tags = (await api(`${WS}/tags`)).tag || [];
  const triggers = (await api(`${WS}/triggers`)).trigger || [];
  const variables = (await api(`${WS}/variables`)).variable || [];
  const tagNames = new Set(tags.map(t => t.name));
  const triggerMap = new Map(triggers.map(t => [t.name, t.triggerId]));
  const variableNames = new Set(variables.map(v => v.name));

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
  async function ensureTrigger(name, eventName) {
    if (triggerMap.has(name)) return triggerMap.get(name);
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
    triggerMap.set(name, created.triggerId);
    console.log('Created trigger', name, created.triggerId);
    return created.triggerId;
  }
  async function ensureHtmlTag(name, html, triggerIds) {
    if (tagNames.has(name)) return;
    const created = await api(`${WS}/tags`, 'POST', {
      name,
      type:'html',
      parameter:[{ type:'template', key:'html', value:html }],
      firingTriggerId: triggerIds.map(String)
    });
    tagNames.add(name);
    console.log('Created HTML tag', name, created.tagId);
  }
  async function ensureGa4Tag(name, eventName, triggerId, params) {
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
    console.log('Created GA4 tag', name, created.tagId);
  }

  await ensureDlv('dlv - link_url', 'link_url');
  await ensureDlv('dlv - link_text', 'link_text');
  await ensureDlv('dlv - scroll_threshold', 'scroll_threshold');
  await ensureDlv('dlv - engagement_time_seconds', 'engagement_time_seconds');

  const listenerHtml = `<script>
(function(){
  window.dataLayer = window.dataLayer || [];
  if (!window.__pdBehaviorListeners) {
    window.__pdBehaviorListeners = true;
    var scrolled50 = false;
    function push(obj){ try { window.dataLayer.push(obj); } catch(e) {} }
    function onScroll(){
      if (scrolled50) return;
      var doc = document.documentElement;
      var body = document.body;
      var scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
      var viewport = window.innerHeight || doc.clientHeight || 0;
      var full = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight, body.clientHeight, doc.clientHeight);
      var pct = full > viewport ? ((scrollTop + viewport) / full) * 100 : 100;
      if (pct >= 50) {
        scrolled50 = true;
        push({ event:'scroll_50', scroll_threshold:50, page_path: location.pathname });
      }
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    setTimeout(function(){ push({ event:'timer_20_seconds', engagement_time_seconds:20, page_path: location.pathname }); }, 20000);
    document.addEventListener('click', function(e){
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.indexOf('#') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 || href.indexOf('javascript:') === 0) return;
      var url;
      try { url = new URL(href, location.href); } catch(err) { return; }
      if (url.hostname !== location.hostname) return;
      push({ event:'internal_navigation_click', link_url:url.href, link_text:(a.textContent || '').trim(), page_path: location.pathname });
    }, true);
  }
})();
</script>`;

  await ensureHtmlTag('Listener - Scroll Timer Internal Nav', listenerHtml, ['2147479553']);
  const trigScroll = await ensureTrigger('CE - scroll_50', 'scroll_50');
  const trigTimer = await ensureTrigger('CE - timer_20_seconds', 'timer_20_seconds');
  const trigNav = await ensureTrigger('CE - internal_navigation_click', 'internal_navigation_click');

  await ensureGa4Tag('GA4 - scroll_50', 'scroll_50', trigScroll, [
    ['scroll_threshold', '{{dlv - scroll_threshold}}'],
    ['page_path', '{{Page Path}}']
  ]);
  await ensureGa4Tag('GA4 - timer_20_seconds', 'timer_20_seconds', trigTimer, [
    ['engagement_time_seconds', '{{dlv - engagement_time_seconds}}'],
    ['page_path', '{{Page Path}}']
  ]);
  await ensureGa4Tag('GA4 - internal_navigation_click', 'internal_navigation_click', trigNav, [
    ['link_url', '{{dlv - link_url}}'],
    ['link_text', '{{dlv - link_text}}'],
    ['page_path', '{{Page Path}}']
  ]);

  const version = await api(`${WS}:create_version`, 'POST', { name:'Add scroll_50, timer_20_seconds, internal_navigation_click' });
  const cvPath = version.containerVersion?.path;
  console.log('Version:', cvPath);
  const pub = await api(`${cvPath}:publish`, 'POST');
  console.log('Published:', JSON.stringify(pub, null, 2));
})();
