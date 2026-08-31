import type { CampaignJson } from './types';

export function createDefaultCampaign(): CampaignJson {
  return {
    name: 'Denver SFH Motivated Sellers - Q3',
    market_city: 'Denver, CO',
    special_ad_category: 'HOUSING',
    objective: 'LEADS',
    adset: {
      market_radius_miles: 20,
      budget: {
        type: 'DAILY',
        amount: 50,
      },
      schedule: {
        start_date: new Date().toISOString().slice(0, 10),
      },
      optimization_event: 'CONVERSION_LEAD',
      placements: 'ADVANTAGE_PLUS',
    },
    ad: {
      destination_type: 'LEAD_FORM',
      primary_text:
        'Need to sell your single-family home in the Denver area? Get a fair cash offer in 24 hours, no repairs or showings required.',
      headline: 'Sell Your Denver Home Fast',
      description: 'Free, no-obligation cash offer for your single-family home.',
      video_script_snippet: '',
      lead_form: {
        type: 'HIGHER_INTENT',
        sms_consent: true,
        custom_questions: [
          { question: 'When are you looking to sell?', type: 'TIMELINE' },
          { question: 'Is the property a single-family home?', type: 'PROPERTY_TYPE' },
          { question: 'Is the property currently occupied?', type: 'OCCUPANCY' },
        ],
      },
    },
    tracking: {
      pixel: true,
      capi: true,
    },
  };
}
