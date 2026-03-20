const { GoogleAuth } = require('google-auth-library');
const { BigQuery } = require('@google-cloud/bigquery');

const PROJECT_ID = 'big-button-383207';
const LOCATION = 'europe-west4';
const KEYFILE = 'C:/Users/wouter/Documents/pages-v2/big-button-383207-c50b2059a006.json';
const RAW = `${PROJECT_ID}.analytics_527840866`;

const DATASETS = ['ga4_staging', 'ga4_intermediate', 'ga4_marts'];

const SQL = {
  stg_events: `CREATE OR REPLACE VIEW \`${PROJECT_ID}.ga4_staging.stg_events\` AS
SELECT
  PARSE_DATE('%Y%m%d', event_date) AS event_date,
  TIMESTAMP_MICROS(event_timestamp) AS event_timestamp,
  event_name,
  user_pseudo_id,
  user_id,
  platform,
  device.category AS device_category,
  geo.country AS country,
  traffic_source.name AS first_user_campaign,
  traffic_source.medium AS first_user_medium,
  traffic_source.source AS first_user_source,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_number') AS session_number,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title') AS page_title,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_referrer') AS page_referrer,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'source') AS session_source,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'medium') AS session_medium,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'campaign') AS session_campaign,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'content_group') AS content_group,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'article_slug') AS article_slug,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'article_title') AS article_title,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_type') AS page_type,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'contact_method') AS contact_method,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec') AS engagement_time_msec,
  ecommerce.purchase_revenue AS purchase_revenue
FROM \`${RAW}.events_*\`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE('Europe/Amsterdam'), INTERVAL 90 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE('Europe/Amsterdam'))`,

  stg_pageviews: `CREATE OR REPLACE VIEW \`${PROJECT_ID}.ga4_staging.stg_pageviews\` AS
SELECT *
FROM \`${PROJECT_ID}.ga4_staging.stg_events\`
WHERE event_name = 'page_view'`,

  stg_key_events: `CREATE OR REPLACE VIEW \`${PROJECT_ID}.ga4_staging.stg_key_events\` AS
SELECT *
FROM \`${PROJECT_ID}.ga4_staging.stg_events\`
WHERE event_name IN ('generate_lead','contact','form_submit','purchase','sign_up','submit_lead_form')`,

  int_sessions: `CREATE OR REPLACE VIEW \`${PROJECT_ID}.ga4_intermediate.int_sessions\` AS
SELECT
  event_date,
  user_pseudo_id,
  session_id,
  ANY_VALUE(session_source) AS session_source,
  ANY_VALUE(session_medium) AS session_medium,
  ANY_VALUE(session_campaign) AS session_campaign,
  ARRAY_AGG(page_location IGNORE NULLS ORDER BY event_timestamp LIMIT 1)[SAFE_OFFSET(0)] AS landing_page,
  COUNTIF(event_name = 'page_view') AS pageviews,
  COUNT(*) AS event_count,
  COUNTIF(event_name IN ('generate_lead','contact','form_submit','purchase','sign_up','submit_lead_form')) AS key_events,
  SUM(IFNULL(engagement_time_msec,0)) / 1000.0 AS engagement_seconds,
  SUM(IFNULL(purchase_revenue,0)) AS revenue
FROM \`${PROJECT_ID}.ga4_staging.stg_events\`
WHERE session_id IS NOT NULL
GROUP BY 1,2,3`,

  mart_landing_pages: `CREATE OR REPLACE TABLE \`${PROJECT_ID}.ga4_marts.mart_daily_landing_pages\`
PARTITION BY event_date AS
SELECT
  event_date,
  landing_page,
  COUNT(*) AS sessions,
  SUM(pageviews) AS pageviews,
  SUM(key_events) AS key_events,
  SAFE_DIVIDE(SUM(key_events), COUNT(*)) AS session_key_event_rate,
  SUM(revenue) AS revenue
FROM \`${PROJECT_ID}.ga4_intermediate.int_sessions\`
WHERE event_date >= DATE_SUB(CURRENT_DATE('Europe/Amsterdam'), INTERVAL 90 DAY)
GROUP BY 1,2`,

  mart_channels: `CREATE OR REPLACE TABLE \`${PROJECT_ID}.ga4_marts.mart_daily_channel_performance\`
PARTITION BY event_date AS
SELECT
  event_date,
  COALESCE(session_source,'(direct)') AS source,
  COALESCE(session_medium,'(none)') AS medium,
  COALESCE(session_campaign,'(not set)') AS campaign,
  COUNT(*) AS sessions,
  SUM(pageviews) AS pageviews,
  SUM(key_events) AS key_events,
  SAFE_DIVIDE(SUM(key_events), COUNT(*)) AS session_key_event_rate,
  SUM(revenue) AS revenue
FROM \`${PROJECT_ID}.ga4_intermediate.int_sessions\`
WHERE event_date >= DATE_SUB(CURRENT_DATE('Europe/Amsterdam'), INTERVAL 90 DAY)
GROUP BY 1,2,3,4`,

  mart_content: `CREATE OR REPLACE TABLE \`${PROJECT_ID}.ga4_marts.mart_daily_content_performance\`
PARTITION BY event_date AS
SELECT
  event_date,
  COALESCE(article_slug, REGEXP_EXTRACT(page_location, r'/posts/([^/?#]+)')) AS article_slug,
  ANY_VALUE(article_title) AS article_title,
  COUNT(*) AS pageviews,
  COUNT(DISTINCT user_pseudo_id) AS users,
  COUNTIF(event_name IN ('generate_lead','contact','form_submit','purchase','sign_up','submit_lead_form')) AS key_events
FROM \`${PROJECT_ID}.ga4_staging.stg_events\`
WHERE event_date >= DATE_SUB(CURRENT_DATE('Europe/Amsterdam'), INTERVAL 90 DAY)
  AND (page_location LIKE '%/posts/%' OR article_slug IS NOT NULL)
GROUP BY 1,2`
};

const SCHEDULES = [
  { name: 'ga4 mart daily landing pages', query: SQL.mart_landing_pages },
  { name: 'ga4 mart daily channel performance', query: SQL.mart_channels },
  { name: 'ga4 mart daily content performance', query: SQL.mart_content },
];

async function getToken(auth) {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token || token;
}

async function api(token, method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : {};
}

(async()=>{
  const auth = new GoogleAuth({ keyFilename: KEYFILE, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const authClient = await auth.getClient();
  const bq = new BigQuery({ projectId: PROJECT_ID, authClient });
  const token = await getToken(auth);

  for (const ds of DATASETS) {
    const dataset = bq.dataset(ds);
    const [exists] = await dataset.exists();
    if (!exists) await dataset.create({ location: LOCATION });
    console.log(`dataset:${ds}`);
  }

  for (const [name, sql] of Object.entries(SQL).slice(0,4)) {
    const [job] = await bq.createQueryJob({ query: sql, location: LOCATION, useLegacySql: false });
    await job.getQueryResults();
    console.log(`view:${name}`);
  }

  for (const [name, sql] of Object.entries(SQL).slice(4)) {
    const [job] = await bq.createQueryJob({ query: sql, location: LOCATION, useLegacySql: false });
    await job.getQueryResults();
    console.log(`table:${name}`);
  }

  const listUrl = `https://bigquerydatatransfer.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/transferConfigs`;
  const existing = await api(token, 'GET', listUrl);
  for (const sched of SCHEDULES) {
    const found = (existing.transferConfigs || []).find(x => x.displayName === sched.name);
    const body = {
      displayName: sched.name,
      dataSourceId: 'scheduled_query',
      schedule: 'every day 04:00',
      params: {
        query: sched.query,
        write_disposition: 'WRITE_TRUNCATE'
      }
    };
    if (found) {
      await api(token, 'PATCH', `https://bigquerydatatransfer.googleapis.com/v1/${found.name}?updateMask=display_name,schedule,params`, body);
      console.log(`schedule:update:${sched.name}`);
    } else {
      await api(token, 'POST', listUrl, body);
      console.log(`schedule:create:${sched.name}`);
    }
  }
})().catch(err=>{console.error(err.stack||String(err));process.exit(1)})
