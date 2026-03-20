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
    stg_microsoft_ads_campaign:
      "SELECT\n" +
      "  'microsoft_ads' AS platform,\n" +
      "  CAST(parent_id AS STRING) AS account_id,\n" +
      "  CAST(NULL AS STRING) AS account_name,\n" +
      "  CAST(id AS STRING) AS campaign_id,\n" +
      "  campaign AS campaign_name,\n" +
      "  status AS campaign_status,\n" +
      "  type AS campaign_type,\n" +
      "  sub_type AS campaign_subtype,\n" +
      "  bid_strategy_type AS bidding_strategy_type,\n" +
      "  CAST(NULL AS STRING) AS budget_id,\n" +
      "  SAFE_CAST(budget AS NUMERIC) AS budget_amount,\n" +
      "  CAST(NULL AS STRING) AS currency_code,\n" +
      "  CAST(NULL AS STRING) AS tracking_template,\n" +
      "  final_url_suffix AS final_url_suffix,\n" +
      "  CAST(NULL AS DATE) AS start_date,\n" +
      "  CAST(NULL AS DATE) AS end_date,\n" +
      "  DATETIME(datetime_modified) AS modified_at,\n" +
      "  CURRENT_TIMESTAMP() AS ingested_at\n" +
      "FROM " + tableRef(projectId, 'bing_ads', 'bing_campaign_settings'),

    stg_microsoft_ads_campaign_daily:
      "SELECT\n" +
      "  'microsoft_ads' AS platform,\n" +
      "  CAST(AccountId AS STRING) AS account_id,\n" +
      "  CAST(CampaignId AS STRING) AS campaign_id,\n" +
      "  DATE(TimePeriod) AS date,\n" +
      "  DeviceType AS device_type,\n" +
      "  Impressions AS impressions,\n" +
      "  Clicks AS clicks,\n" +
      "  SAFE_CAST(Spend AS NUMERIC) AS cost,\n" +
      "  SAFE_CAST(REPLACE(Ctr, '%', '') AS FLOAT64) / 100 AS ctr,\n" +
      "  SAFE_CAST(AverageCpc AS NUMERIC) AS cpc,\n" +
      "  CAST(NULL AS NUMERIC) AS conversions,\n" +
      "  CAST(NULL AS NUMERIC) AS conversion_rate,\n" +
      "  CAST(NULL AS NUMERIC) AS conversion_value,\n" +
      "  CAST(NULL AS NUMERIC) AS cost_per_conversion,\n" +
      "  CAST(NULL AS NUMERIC) AS roas,\n" +
      "  CAST(NULL AS NUMERIC) AS view_through_conversions,\n" +
      "  Network AS network\n" +
      "FROM " + tableRef(projectId, 'bing_ads', 'daily_performance') + "\n" +
      "WHERE CampaignId IS NOT NULL",

    stg_microsoft_ads_ad_group:
      "SELECT\n" +
      "  'microsoft_ads' AS platform,\n" +
      "  CAST(campaign_id AS STRING) AS account_id,\n" +
      "  CAST(campaign_id AS STRING) AS campaign_id,\n" +
      "  CAST(id AS STRING) AS ad_group_id,\n" +
      "  ad_group AS ad_group_name,\n" +
      "  status AS ad_group_status,\n" +
      "  CAST(NULL AS STRING) AS ad_group_type,\n" +
      "  language AS language,\n" +
      "  network_distribution AS network,\n" +
      "  bid_strategy_type AS bid_strategy_type,\n" +
      "  SAFE_CAST(cpc_bid AS NUMERIC) AS cpc_bid,\n" +
      "  CAST(NULL AS NUMERIC) AS target_cpa,\n" +
      "  CAST(NULL AS NUMERIC) AS target_roas,\n" +
      "  DATETIME(datetime_modified) AS modified_at,\n" +
      "  CURRENT_TIMESTAMP() AS ingested_at\n" +
      "FROM " + tableRef(projectId, 'bing_ads', 'bing_ad_group_settings'),

    stg_microsoft_ads_ad_group_daily:
      "SELECT\n" +
      "  'microsoft_ads' AS platform,\n" +
      "  CAST(AccountId AS STRING) AS account_id,\n" +
      "  CAST(CampaignId AS STRING) AS campaign_id,\n" +
      "  CAST(AdGroupId AS STRING) AS ad_group_id,\n" +
      "  DATE(TimePeriod) AS date,\n" +
      "  DeviceType AS device_type,\n" +
      "  Impressions AS impressions,\n" +
      "  Clicks AS clicks,\n" +
      "  SAFE_CAST(Spend AS NUMERIC) AS cost,\n" +
      "  SAFE_CAST(REPLACE(Ctr, '%', '') AS FLOAT64) / 100 AS ctr,\n" +
      "  SAFE_CAST(AverageCpc AS NUMERIC) AS cpc,\n" +
      "  CAST(NULL AS NUMERIC) AS conversions,\n" +
      "  CAST(NULL AS NUMERIC) AS conversion_rate,\n" +
      "  CAST(NULL AS NUMERIC) AS conversion_value,\n" +
      "  CAST(NULL AS NUMERIC) AS cost_per_conversion,\n" +
      "  CAST(NULL AS NUMERIC) AS roas,\n" +
      "  CAST(NULL AS NUMERIC) AS view_through_conversions,\n" +
      "  Network AS network\n" +
      "FROM " + tableRef(projectId, 'bing_ads', 'daily_performance') + "\n" +
      "WHERE AdGroupId IS NOT NULL"
  };

  for (const [tableId, query] of Object.entries(views)) {
    await upsertView(projectId, ds, tableId, query);
  }
}

main().catch(err => {
  console.error(err.stack || String(err));
  process.exit(1);
});