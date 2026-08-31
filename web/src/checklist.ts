import type { CampaignJson } from './types';

export interface ChecklistSection {
  level: 'Campaign' | 'Ad Set' | 'Ad';
  items: string[];
}

export function buildChecklist(c: CampaignJson): ChecklistSection[] {
  const budgetLabel =
    c.adset.budget.type === 'DAILY'
      ? `$${c.adset.budget.amount}/day daily budget`
      : `$${c.adset.budget.amount} lifetime budget`;

  const scheduleLabel = c.adset.schedule.end_date
    ? `Run ${c.adset.schedule.start_date} → ${c.adset.schedule.end_date}`
    : `Start ${c.adset.schedule.start_date}, run continuously`;

  const campaign: ChecklistSection = {
    level: 'Campaign',
    items: [
      `Set objective to ${c.objective}`,
      `Set Special Ad Category to ${c.special_ad_category}`,
      `Name the campaign "${c.name}"`,
    ],
  };

  const adset: ChecklistSection = {
    level: 'Ad Set',
    items: [
      `Target ${c.market_city} with a ${c.adset.market_radius_miles}-mile radius (no ZIP code targeting)`,
      budgetLabel,
      scheduleLabel,
      `Set optimization event to ${c.adset.optimization_event}`,
      `Set placements to ${c.adset.placements === 'ADVANTAGE_PLUS' ? 'Advantage+ placements' : c.adset.placements}`,
    ],
  };

  const adItems: string[] = [
    `Set destination to ${c.ad.destination_type.replace('_', ' ')}`,
    `Primary text: "${c.ad.primary_text}"`,
    `Headline: "${c.ad.headline}"`,
    `Description: "${c.ad.description}"`,
  ];

  if (c.ad.video_script_snippet) {
    adItems.push(`Video script: "${c.ad.video_script_snippet}"`);
  }

  if (c.ad.destination_type === 'LEAD_FORM' && c.ad.lead_form) {
    adItems.push(`Create a ${c.ad.lead_form.type.replace('_', ' ')} lead form`);
    adItems.push('Add core fields: Full name, Phone number');
    if (c.ad.lead_form.sms_consent) {
      adItems.push('Enable SMS consent checkbox on the lead form');
    }
    for (const q of c.ad.lead_form.custom_questions) {
      adItems.push(`Add custom question (${q.type}): "${q.question}"`);
    }
  }

  adItems.push(`Enable Meta Pixel: ${c.tracking.pixel ? 'yes' : 'NOT ENABLED — fix before launch'}`);
  adItems.push(`Enable Conversions API: ${c.tracking.capi ? 'yes' : 'NOT ENABLED — fix before launch'}`);

  return [campaign, adset, { level: 'Ad', items: adItems }];
}
