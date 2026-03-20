const {GoogleAuth} = require('google-auth-library');
const path = require('path');

const PROPERTY_ID = '527840866';
const BASE = `properties/${PROPERTY_ID}`;

async function getToken() {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, '..', 'secrets', 'gtm-service-account.json'),
    scopes: [
      'https://www.googleapis.com/auth/analytics.edit',
      'https://www.googleapis.com/auth/analytics.readonly'
    ]
  });
  const client = await auth.getClient();
  return (await client.getAccessToken()).token;
}

async function api(urlPath, method='GET', body) {
  const token = await getToken();
  const res = await fetch(`https://analyticsadmin.googleapis.com/v1alpha/${urlPath}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json={}; try { json = text ? JSON.parse(text) : {}; } catch { json={raw:text}; }
  if (!res.ok) throw new Error(`${method} ${urlPath} -> HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

(async()=>{
  const existing = await api(`${BASE}/customDimensions`);
  const existingDims = new Set((existing.customDimensions || []).map(d => d.parameterName));
  const defs = [
    ['Page type', 'page_type', 'EVENT'],
    ['Content group', 'content_group', 'EVENT'],
    ['Article slug', 'article_slug', 'EVENT'],
    ['Article title', 'article_title', 'EVENT'],
    ['Contact method', 'contact_method', 'EVENT']
  ];

  for (const [displayName, parameterName, scope] of defs) {
    if (existingDims.has(parameterName)) {
      console.log('Exists custom dimension:', parameterName);
      continue;
    }
    const created = await api(`${BASE}/customDimensions`, 'POST', {
      displayName,
      parameterName,
      scope,
      description: `Created by OpenClaw for ${parameterName}`
    });
    console.log('Created custom dimension:', created.parameterName || parameterName);
  }

  const convs = await api(`${BASE}/conversionEvents`);
  const hasGenerateLead = (convs.conversionEvents || []).some(c => c.eventName === 'generate_lead');
  if (!hasGenerateLead) {
    const createdConv = await api(`${BASE}/conversionEvents`, 'POST', { eventName: 'generate_lead' });
    console.log('Created conversion event:', createdConv.eventName);
  } else {
    console.log('Conversion already exists: generate_lead');
  }
})();