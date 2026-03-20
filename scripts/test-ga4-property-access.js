const {GoogleAuth} = require('google-auth-library');
const path = require('path');

async function main() {
  const keyFile = path.join(__dirname, '..', 'secrets', 'gtm-service-account.json');
  const auth = new GoogleAuth({
    keyFile,
    scopes: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/analytics.edit'
    ]
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const propertyId = '527840866';
  const url = `https://analyticsadmin.googleapis.com/v1alpha/properties/${propertyId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token.token}` }
  });

  const text = await res.text();
  console.log('HTTP', res.status);
  try {
    const json = JSON.parse(text);
    console.log(JSON.stringify(json, null, 2));
  } catch {
    console.log(text);
  }
}

main().catch(err => {
  console.error(err.stack || String(err));
  process.exit(1);
});
