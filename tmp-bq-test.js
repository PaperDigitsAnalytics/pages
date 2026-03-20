const { GoogleAuth } = require('google-auth-library');
const { BigQuery } = require('@google-cloud/bigquery');

(async () => {
  const keyFilename = 'C:/Users/wouter/Documents/pages-v2/big-button-383207-6e3499248ef8.json';
  const auth = new GoogleAuth({
    keyFilename,
    scopes: ['https://www.googleapis.com/auth/bigquery.readonly']
  });
  const authClient = await auth.getClient();
  const client = new BigQuery({
    projectId: 'big-button-383207',
    authClient
  });
  const [datasets] = await client.getDatasets({ maxResults: 5 });
  console.log('OK');
  console.log(datasets.map(d => d.id).join('\n'));
})().catch(err => {
  console.error(err.stack || String(err));
  process.exit(1);
});
