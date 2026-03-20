# GA4 warehouse setup

Deze setup gebruikt de native GA4 BigQuery export in `analytics_527840866` en bouwt daar een lichte model-laag bovenop.

## Datasets
- `ga4_staging`
- `ga4_intermediate`
- `ga4_marts`

## Modellen

### Staging views
- `ga4_staging.stg_events`
- `ga4_staging.stg_pageviews`
- `ga4_staging.stg_key_events`

### Intermediate view
- `ga4_intermediate.int_sessions`

### Mart tabellen
- `ga4_marts.mart_daily_landing_pages`
- `ga4_marts.mart_daily_channel_performance`
- `ga4_marts.mart_daily_content_performance`

## Waarom dit goedkoop blijft
- staging en intermediate zijn views
- marts worden 1x per dag rebuilt
- alleen een rolling window van 90 dagen wordt gebruikt
- geen zware event-level backfills of attribution-jobs in deze eerste versie

## Dagelijkse refresh
Scheduled queries draaien dagelijks om `04:00` in BigQuery Data Transfer / Scheduled Queries.

## Script
Opnieuw uitrollen of bijwerken:

```bash
node scripts/setup-ga4-warehouse.js
```
