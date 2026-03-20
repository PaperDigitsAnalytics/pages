const {GoogleAuth}=require('google-auth-library');
const fs=require('fs');
const keyFile='C:/Users/wouter/Documents/spreker/despreker-c1aa07772fee.json';
async function token(){const auth=new GoogleAuth({keyFile,scopes:['https://www.googleapis.com/auth/bigquery']});const c=await auth.getClient();return (await c.getAccessToken()).token;}
async function query(sql){const raw=JSON.parse(fs.readFileSync(keyFile,'utf8'));const project=raw.project_id;const t=await token();const r=await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/queries`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify({query:sql,useLegacySql:false,location:'europe-west1'})});const text=await r.text();const j=text?JSON.parse(text):{};if(!r.ok) throw new Error(`${r.status} ${text}`);return j;}
(async()=>{
const sql = `
MERGE \`despreker.mapping.conversion_action_map\` T
USING (
  SELECT 'google_ads' AS platform, source_conversion_id, source_conversion_name, source_conversion_category,
    CASE
      WHEN LOWER(source_conversion_name) LIKE '%purchase%' THEN 'purchase'
      WHEN LOWER(source_conversion_name) LIKE '%qualified%' THEN 'qualified_lead'
      WHEN LOWER(source_conversion_name) LIKE '%lead%' THEN 'lead_form_submit'
      WHEN LOWER(source_conversion_name) LIKE '%call%' THEN 'phone_call'
      ELSE 'other'
    END AS normalized_conversion_type,
    CASE
      WHEN LOWER(source_conversion_name) LIKE '%purchase%' THEN 'revenue'
      WHEN LOWER(source_conversion_name) LIKE '%qualified%' THEN 'qualified_lead'
      WHEN LOWER(source_conversion_name) LIKE '%lead%' OR LOWER(source_conversion_name) LIKE '%call%' THEN 'lead'
      ELSE 'other'
    END AS normalized_conversion_group,
    CASE
      WHEN LOWER(source_conversion_name) LIKE '%purchase%' THEN TRUE
      WHEN LOWER(source_conversion_name) LIKE '%qualified%' THEN TRUE
      WHEN LOWER(source_conversion_name) LIKE '%lead%' THEN TRUE
      WHEN LOWER(source_conversion_name) LIKE '%call%' THEN TRUE
      ELSE FALSE
    END AS is_primary_conversion,
    CASE
      WHEN LOWER(source_conversion_name) LIKE '%purchase%' THEN FALSE
      WHEN LOWER(source_conversion_name) LIKE '%qualified%' THEN FALSE
      WHEN LOWER(source_conversion_name) LIKE '%lead%' THEN FALSE
      WHEN LOWER(source_conversion_name) LIKE '%call%' THEN FALSE
      ELSE TRUE
    END AS is_secondary_conversion,
    FALSE AS is_micro_conversion,
    TRUE AS is_biddable_conversion,
    CASE
      WHEN LOWER(source_conversion_name) LIKE '%purchase%' THEN TRUE
      WHEN LOWER(source_conversion_name) LIKE '%qualified%' THEN TRUE
      WHEN LOWER(source_conversion_name) LIKE '%lead%' THEN TRUE
      WHEN LOWER(source_conversion_name) LIKE '%call%' THEN TRUE
      ELSE FALSE
    END AS is_business_conversion,
    CASE WHEN LOWER(source_conversion_name) LIKE '%purchase%' THEN TRUE ELSE FALSE END AS is_revenue_conversion,
    TRUE AS include_in_sea_reporting,
    FALSE AS include_in_seo_reporting,
    FALSE AS include_in_cro_reporting,
    'Seeded from Google Ads conversion action names' AS notes,
    TRUE AS active
  FROM \`despreker.intermediate_advertising.dim_conversion_action\`
  WHERE platform = 'google_ads'
) S
ON T.platform = S.platform
AND COALESCE(T.source_conversion_id,'') = COALESCE(S.source_conversion_id,'')
AND COALESCE(T.source_conversion_name,'') = COALESCE(S.source_conversion_name,'')
WHEN MATCHED THEN UPDATE SET
  source_conversion_category = S.source_conversion_category,
  normalized_conversion_type = S.normalized_conversion_type,
  normalized_conversion_group = S.normalized_conversion_group,
  is_primary_conversion = S.is_primary_conversion,
  is_secondary_conversion = S.is_secondary_conversion,
  is_micro_conversion = S.is_micro_conversion,
  is_biddable_conversion = S.is_biddable_conversion,
  is_business_conversion = S.is_business_conversion,
  is_revenue_conversion = S.is_revenue_conversion,
  include_in_sea_reporting = S.include_in_sea_reporting,
  include_in_seo_reporting = S.include_in_seo_reporting,
  include_in_cro_reporting = S.include_in_cro_reporting,
  notes = S.notes,
  active = S.active
WHEN NOT MATCHED THEN INSERT (
  platform, source_conversion_id, source_conversion_name, source_conversion_category,
  normalized_conversion_type, normalized_conversion_group,
  is_primary_conversion, is_secondary_conversion, is_micro_conversion,
  is_biddable_conversion, is_business_conversion, is_revenue_conversion,
  include_in_sea_reporting, include_in_seo_reporting, include_in_cro_reporting,
  notes, active
) VALUES (
  S.platform, S.source_conversion_id, S.source_conversion_name, S.source_conversion_category,
  S.normalized_conversion_type, S.normalized_conversion_group,
  S.is_primary_conversion, S.is_secondary_conversion, S.is_micro_conversion,
  S.is_biddable_conversion, S.is_business_conversion, S.is_revenue_conversion,
  S.include_in_sea_reporting, S.include_in_seo_reporting, S.include_in_cro_reporting,
  S.notes, S.active
)`;
await query(sql);
console.log('seeded conversion_action_map');
})();