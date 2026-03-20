const fs = require('fs');
const { GoogleAuth } = require('google-auth-library');

(async () => {
  const keyFilename = 'C:/Users/wouter/Documents/pages-v2/big-button-383207-6e3499248ef8.json';
  const auth = new GoogleAuth({
    keyFilename,
    scopes: ['https://www.googleapis.com/auth/analytics.edit']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const res = await fetch('https://analyticsadmin.googleapis.com/v1beta/properties/527840866', {
    headers: { Authorization: `Bearer ${token.token || token}` }
  });

  const text = await res.text();
  console.log(res.status);
  console.log(text);
})().catch(err => {
  console.error(err.stack || String(err));
  process.exit(1);
});
