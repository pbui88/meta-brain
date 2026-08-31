-- View combining each campaign template with its most recent score,
-- used by the Dashboard list.
create or replace view campaign_template_summaries as
select
  ct.id,
  ct.name,
  ct.market_city,
  ct.market_radius_miles,
  ct.objective,
  ct.special_ad_category,
  ct.created_at,
  ct.updated_at,
  cs.id as latest_score_id,
  cs.total_score as latest_total_score,
  cs.flags as latest_flags,
  cs.created_at as latest_score_at
from campaign_templates ct
left join lateral (
  select *
  from campaign_scores cs
  where cs.campaign_template_id = ct.id
  order by cs.created_at desc
  limit 1
) cs on true;
