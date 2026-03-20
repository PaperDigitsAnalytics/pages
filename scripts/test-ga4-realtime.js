const {GoogleAuth} = require('google-auth-library');
const path = require('path');

async function main() {
  const keyFile = path.join(__dirname, '..', 'secrets', 'gtm-service-account.json');
  const auth = new GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly']
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const propertyId = '527840866';

  const body = {
    dimensions: [
      { name: 'eventName' }
    ],
    metrics: [
      { name: 'eventCount' }
    ],
    limit: 10
  };

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  console.log('HTTP', res.status);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
}

main().catch(err => {
  console.error(err.stack || String(err));
  process.exit(1);
});