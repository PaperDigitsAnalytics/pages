const { GoogleAuth } = require('google-auth-library');
const { BigQuery } = require('@google-cloud/bigquery');

(async () => {
  const keyFilename = 'C:/Users/wouter/Documents/pages-v2/big-button-383207-6e3499248ef8.json';
  const auth = new GoogleAuth({ keyFilename, scopes: ['https://www.googleapis.com/auth/bigquery.readonly'] });
  const authClient = await auth.getClient();
  const client = new BigQuery({ projectId: 'big-button-383207', authClient });

  const dataset = client.dataset('google_analytics_4');
  const [tables] = await dataset.getTables({ maxResults: 50 });
  const result = [];
  for (const table of tables) {
    const [metadata] = await table.getMetadata();
    result.push({
      id: metadata.id,
      tableId: metadata.tableReference.tableId,
      type: metadata.type,
      rows: metadata.numRows,
      created: metadata.creationTime,
      modified: metadata.lastModifiedTime,
      schema: (metadata.schema?.fields || []).slice(0, 20).map(f => ({ name: f.name, type: f.type, mode: f.mode }))
    });
  }
  console.log(JSON.stringify(result, null, 2));
})().catch(err => {
  console.error(err.stack || String(err));
  process.exit(1);
});
