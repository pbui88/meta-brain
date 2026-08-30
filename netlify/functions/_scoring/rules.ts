import type { CampaignJson, ScoreFlag } from './types';

const clamp = (n: number) => Math.max(0, Math.min(100, n));

const DISTRESS_PHRASES = [
  'behind on your mortgage',
  'struggling financially',
  'foreclosure',
  'facing foreclosure',
  'losing your home',
  'bad credit',
  'divorce',
  'bankruptcy',
  'inherited a house you can\'t afford',
  'tax lien',
  'eviction',
];

export function scoreHousing(campaign: CampaignJson, flags: ScoreFlag[]): number {
  let score = 100;

  if (campaign.special_ad_category !== 'HOUSING') {
    score -= 60;
    flags.push({
      category: 'housing',
      severity: 'high',
      message: 'Housing category must be HOUSING for motivated seller campaigns.',
    });
  }

  const radius = campaign.adset?.market_radius_miles ?? 0;
  if (radius < 15) {
    score -= 40;
    flags.push({
      category: 'housing',
      severity: 'high',
      message: `Market radius targeting (${radius} mi) is below the 15-mile minimum required for HOUSING special ad category campaigns.`,
    });
  }

  return clamp(score);
}

export function scoreCreative(campaign: CampaignJson, flags: ScoreFlag[]): number {
  let score = 100;

  const textFields = [
    campaign.ad?.primary_text,
    campaign.ad?.headline,
    campaign.ad?.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matched = DISTRESS_PHRASES.filter((phrase) => textFields.includes(phrase));

  if (matched.length > 0) {
    score -= Math.min(80, matched.length * 30);
    flags.push({
      category: 'creative',
      severity: 'high',
      message: `Ad copy implies financial distress or personal attributes ("${matched.join('", "')}"); rewrite to avoid Meta housing policy violations.`,
    });
  }

  return clamp(score);
}

export function scoreDestination(campaign: CampaignJson, flags: ScoreFlag[]): number {
  let score = 100;

  if (campaign.ad?.destination_type === 'LEAD_FORM') {
    const leadForm = campaign.ad.lead_form;

    if (!leadForm || leadForm.type !== 'HIGHER_INTENT') {
      score -= 40;
      flags.push({
        category: 'destination',
        severity: 'medium',
        message: 'Lead form type should be HIGHER_INTENT to improve lead quality and reduce spam submissions.',
      });
    }

    if (!leadForm || !leadForm.sms_consent) {
      score -= 20;
      flags.push({
        category: 'destination',
        severity: 'low',
        message: 'Lead form is missing SMS consent capture; add it to enable compliant SMS follow-up.',
      });
    }
  }

  return clamp(score);
}

export function scoreTracking(campaign: CampaignJson, flags: ScoreFlag[]): number {
  let score = 100;

  if (!campaign.tracking?.pixel) {
    score -= 30;
    flags.push({
      category: 'tracking',
      severity: 'medium',
      message: 'Meta Pixel is not enabled; conversion tracking and optimization will be degraded.',
    });
  }

  if (!campaign.tracking?.capi) {
    score -= 30;
    flags.push({
      category: 'tracking',
      severity: 'medium',
      message: 'Conversions API (CAPI) is not enabled; enable it for more reliable event matching post-iOS14.',
    });
  }

  if (campaign.adset?.optimization_event !== 'CONVERSION_LEAD') {
    score -= 20;
    flags.push({
      category: 'tracking',
      severity: 'low',
      message: `Optimization event is "${campaign.adset?.optimization_event}"; use CONVERSION_LEAD for motivated seller campaigns.`,
    });
  }

  return clamp(score);
}

export function scoreAlgorithm(campaign: CampaignJson, flags: ScoreFlag[]): number {
  let score = 100;

  if (campaign.adset?.placements !== 'ADVANTAGE_PLUS') {
    score -= 15;
    flags.push({
      category: 'algorithm',
      severity: 'low',
      message: 'Placements are not set to ADVANTAGE_PLUS; broader placements typically improve delivery efficiency.',
    });
  }

  return clamp(score);
}
