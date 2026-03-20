const fs = require('fs');
const path = require('path');
const http = require('http');

const credsPath = path.join(__dirname, '..', 'client_secret_221067728778-1bet6lnpp77k99p122dvhn8ltipfesje.apps.googleusercontent.com.json');

if (!fs.existsSync(credsPath)) {
  console.error('Credentials file not found:', credsPath);
  process.exit(1);
}

const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
const installed = creds.installed || creds.web;
if (!installed) {
  console.error('No installed/web OAuth config found in credentials file.');
  process.exit(1);
}

const clientId = installed.client_id;
const clientSecret = installed.client_secret;
const redirectUri = 'http://localhost:8090/callback';
const scope = 'https://www.googleapis.com/auth/adwords';

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data, null, 2)}`);
  }
  return data;
}

async function main() {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost:8090');
      if (url.pathname !== '/callback') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const error = url.searchParams.get('error');
      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Google returned an error: ${error}`);
        console.error('Google returned an error:', error);
        server.close();
        process.exit(1);
      }

      const code = url.searchParams.get('code');
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('No authorization code found in callback URL.');
        return;
      }

      const data = await exchangeCodeForToken(code);

      const output = {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: data.refresh_token,
        scope: data.scope,
        token_type: data.token_type,
        access_token_preview: data.access_token ? data.access_token.slice(0, 24) + '...' : null
      };

      const outPath = path.join(__dirname, '..', 'google-ads-oauth-token.json');
      fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 24px;">
            <h2>Authorization successful</h2>
            <p>You can close this window now.</p>
            <p>Refresh token saved to:</p>
            <pre>${outPath}</pre>
          </body>
        </html>
      `);

      console.log('\nSuccess. Refresh token saved to:');
      console.log(outPath);
      console.log('\nImportant: read-only is controlled by the Google Ads user role, not by OAuth scope.');
      server.close();
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Authorization failed. Check terminal output.');
      console.error(err.message || err);
      server.close();
      process.exit(1);
    }
  });

  server.listen(8090, '127.0.0.1', () => {
    console.log('\nOpen this URL in your browser and authorize with the Google user that has access to the Google Ads account:\n');
    console.log(authUrl.toString());
    console.log('\nWaiting for callback on http://localhost:8090/callback ...\n');
    console.log('Important: if you want read-only, make sure that Google user has Read-only access in Google Ads.');
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
