const {GoogleAuth} = require('google-auth-library');
const fs = require('fs');

const keyFile = 'C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';

async function getToken() {
  const auth = new GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/bigquery.readonly']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function api(url) {
  const token = await getToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json)}`);
  return json;
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  const projectId = raw.project_id;
  const dsResp = await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets`);
  const datasets = (dsResp.datasets || []).map(d => d.datasetReference.datasetId).sort();
  console.log('DATASETS');
  for (const ds of datasets) console.log(ds);
  console.log('\nTABLE SAMPLES');
  for (const ds of datasets) {
    const tResp = await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${ds}/tables?maxResults=15`);
    const tables = (tResp.tables || []).map(t => `${t.type}:${t.tableReference.tableId}`);
    console.log(`\n[${ds}] ${tables.length} shown`);
    for (const t of tables) console.log(`- ${t}`);
  }
}

main().catch(err => { console.error(err.stack || String(err)); process.exit(1); });