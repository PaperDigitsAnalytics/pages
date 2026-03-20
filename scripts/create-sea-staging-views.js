const {GoogleAuth} = require('google-auth-library');
const fs = require('fs');

const keyFile = 'C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';

async function getToken() {
  const auth = new GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/bigquery'] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function api(url, method='GET', body) {
  const token = await getToken();
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`${method} ${url} -> HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function upsertView(projectId, datasetId, tableId, query) {
  const body = {
    tableReference: { projectId, datasetId, tableId },
    view: { query, useLegacySql: false }
  };
  try {
    await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${datasetId}/tables`, 'POST', body);
    console.log(`CREATED VIEW ${datasetId}.${tableId}`);
  } catch (err) {
    const msg = String(err);
    if (msg.includes('Already Exists') || msg.includes('already exists') || msg.includes('duplicate')) {
      await api(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${datasetId}/tables/${tableId}`, 'PUT', body);
      console.log(`UPDATED VIEW ${datasetId}.${tableId}`);
    } else {
      throw err;
    }
  }
}

function tableRef(projectId, dataset, table) {
  return '`' + projectId + '.' + dataset + '.' + table + '`';
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  const projectId = raw.project_id;
  const ds = 'staging_advertising';

  const views = {
    stg_google_ads_campaign:
      "SELECT\n" +
      "  'google_ads' AS platform,\n" +
      "  CAST(ExternalCustomerId AS STRING) AS account_id,\n" +
      "  CAST(CampaignId AS STRING) AS campaign_id,\n" +
      "  CampaignName AS campaign_name,\n" +
      "  AdvertisingChannelType AS channel_type,\n" +
      "  AdvertisingChannelSubType AS channel_subtype,\n" +
      "  BiddingStrategyType AS bidding_strategy_type,\n" +
      "  ServingStatus AS serving_status,\n" +
      "  CAST(BudgetId AS STRING) AS budget_id,\n" +
      "  SAFE_CAST(Amount AS NUMERIC) AS budget_amount,\n" +
      "  StartDate AS start_date,\n" +
      "  EndDate AS end_date,\n" +
      "  CURRENT_TIMESTAMP() AS ingested_at\n" +
      "FROM " + tableRef(projectId, 'google_ads', 'Campaign_3612505204'),

    stg_google_ads_campaign_daily:
      "SELECT\n" +
      "  'google_ads' AS platform,\n" +
      "  CAST(ExternalCustomerId AS STRING) AS account_id,\n" +
      "  CAST(CampaignId AS STRING) AS campaign_id,\n" +
      "  Date AS date,\n" +
      "  Device AS device,\n" +
      "  Impressions AS impressions,\n" +
      "  Clicks AS clicks,\n" +
      "  SAFE_DIVIDE(Cost, 1000000) AS cost,\n" +
      "  Conversions AS conversions,\n" +
      "  ConversionValue AS conversion_value,\n" +
      "  Interactions AS interactions,\n" +
      "  ViewThroughConversions AS view_through_conversions\n" +
      "FROM " + tableRef(projectId, 'google_ads', 'CampaignBasicStats_3612505204'),

    stg_google_ads_ad_group:
      "SELECT\n" +
      "  'google_ads' AS platform,\n" +
      "  CAST(ExternalCustomerId AS STRING) AS account_id,\n" +
      "  CAST(CampaignId AS STRING) AS campaign_id,\n" +
      "  CAST(AdGroupId AS STRING) AS ad_group_id,\n" +
      "  AdGroupName AS ad_group_name,\n" +
      "  AdGroupStatus AS ad_group_status,\n" +
      "  AdGroupType AS ad_group_type,\n" +
      "  BiddingStrategyType AS bidding_strategy_type,\n" +
      "  SAFE_CAST(CpcBid AS NUMERIC) AS cpc_bid,\n" +
      "  TargetCpa AS target_cpa,\n" +
      "  EffectiveTargetRoas AS target_roas,\n" +
      "  CURRENT_TIMESTAMP() AS ingested_at\n" +
      "FROM " + tableRef(projectId, 'google_ads', 'AdGroup_3612505204'),

    stg_google_ads_ad_group_daily:
      "SELECT\n" +
      "  'google_ads' AS platform,\n" +
      "  CAST(ExternalCustomerId AS STRING) AS account_id,\n" +
      "  CAST(CampaignId AS STRING) AS campaign_id,\n" +
      "  CAST(AdGroupId AS STRING) AS ad_group_id,\n" +
      "  Date AS date,\n" +
      "  Device AS device,\n" +
      "  Impressions AS impressions,\n" +
      "  Clicks AS clicks,\n" +
      "  SAFE_DIVIDE(Cost, 1000000) AS cost,\n" +
      "  Conversions AS conversions,\n" +
      "  ConversionValue AS conversion_value,\n" +
      "  Interactions AS interactions,\n" +
      "  ViewThroughConversions AS view_through_conversions\n" +
      "FROM " + tableRef(projectId, 'google_ads', 'AdGroupBasicStats_3612505204')
  };

  for (const [tableId, query] of Object.entries(views)) {
    await upsertView(projectId, ds, tableId, query);
  }
}

main().catch(err => {
  console.error(err.stack || String(err));
  process.exit(1);
});