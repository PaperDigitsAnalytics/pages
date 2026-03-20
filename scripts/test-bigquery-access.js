const {GoogleAuth} = require('google-auth-library');
const fs = require('fs');
const path = require('path');

async function main() {
  const keyFile = 'C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';
  if (!fs.existsSync(keyFile)) throw new Error('Key file not found');
  const raw = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  const projectId = raw.project_id;

  const auth = new GoogleAuth({
    keyFile,
    scopes: [
      'https://www.googleapis.com/auth/bigquery',
      'https://www.googleapis.com/auth/cloud-platform.read-only'
    ]
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token || !token.token) throw new Error('No access token');

  const res = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets`, {
    headers: { Authorization: `Bearer ${token.token}` }
  });

  const text = await res.text();
  console.log('PROJECT', projectId);
  console.log('HTTP', res.status);
  try {
    const json = JSON.parse(text);
    if (res.ok) {
      const datasets = json.datasets || [];
      console.log('Datasets visible:', datasets.length);
      for (const ds of datasets) {
        console.log('-', ds.datasetReference?.datasetId || '(unknown)');
      }
    } else {
      console.log(JSON.stringify(json, null, 2));
    }
  } catch {
    console.log(text);
  }
}

main().catch(err => {
  console.error(err.stack || String(err));
  process.exit(1);
});