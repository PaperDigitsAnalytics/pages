const {GoogleAuth} = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const keyFile = 'C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';

async function getToken() {
  const auth = new GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/bigquery']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function api(url, method='GET', body) {
  const token = await getToken();
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  const projectId = raw.project_id;
  const location = 'EU';

  const datasets = [
    ['staging_advertising', 'Raw and lightly cleaned advertising source data'],
    ['staging_analytics', 'Raw and lightly cleaned analytics source data'],
    ['staging_crm', 'Raw and lightly cleaned CRM and sales source data'],
    ['staging_seo', 'Raw and lightly cleaned SEO source data'],
    ['staging_consent', 'Raw and lightly cleaned consent and privacy source data'],
    ['intermediate_advertising', 'Business-ready advertising transformation layer'],
    ['intermediate_analytics', 'Business-ready analytics transformation layer'],
    ['intermediate_growth', 'Cross-source growth modelling and joins'],
    ['marts_sea', 'SEA decision marts and performance use cases'],
    ['marts_seo', 'SEO decision marts and search growth use cases'],
    ['marts_cro', 'CRO decision marts and onsite conversion use cases']
  ];

  for (const [datasetId, description] of datasets) {
    const body = {
      datasetReference: { projectId, datasetId },
      location,
      description,
      labels: {
        layer: datasetId.split('_')[0],
        managed_by: 'openclaw'
      }
    };
    const res = await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets`, 'POST', body);
    if (res.ok) {
      console.log(`CREATED ${datasetId}`);
    } else if (res.status === 409) {
      console.log(`EXISTS ${datasetId}`);
    } else {
      console.log(`FAILED ${datasetId} HTTP ${res.status}`);
      console.log(JSON.stringify(res.json));
    }
  }
}

main().catch(err => {
  console.error(err.stack || String(err));
  process.exit(1);
});