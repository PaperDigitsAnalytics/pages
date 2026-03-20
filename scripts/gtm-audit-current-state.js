const {GoogleAuth} = require('google-auth-library');
const path = require('path');

const WS='accounts/6343431875/containers/245865019/workspaces/2';

async function getToken() {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname,'..','secrets','gtm-service-account.json'),
    scopes: [
      'https://www.googleapis.com/auth/tagmanager.edit.containers',
      'https://www.googleapis.com/auth/tagmanager.readonly'
    ]
  });
  const client = await auth.getClient();
  return (await client.getAccessToken()).token;
}

async function api(pathname) {
  const token = await getToken();
  const res = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${pathname}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const text = await res.text();
  let json={}; try{ json = text ? JSON.parse(text) : {}; } catch { json={raw:text}; }
  return { status: res.status, json };
}

(async()=>{
  for (const p of [`${WS}/tags`, `${WS}/triggers`, `${WS}/variables`, `${WS}/built_in_variables`]) {
    const r = await api(p);
    console.log('\nPATH', p, 'HTTP', r.status);
    console.log(JSON.stringify(r.json, null, 2));
  }
})();