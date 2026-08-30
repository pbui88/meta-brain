export const DEFAULT_CAMPAIGN = {
  name: 'Denver SFH Motivated Sellers - Q3',
  special_ad_category: 'HOUSING',
  adset: {
    market_radius_miles: 20,
    optimization_event: 'CONVERSION_LEAD',
    placements: 'ADVANTAGE_PLUS',
  },
  ad: {
    destination_type: 'LEAD_FORM',
    primary_text:
      'Need to sell your single-family home in the Denver area? Get a fair cash offer in 24 hours, no repairs or showings required.',
    headline: 'Sell Your Denver Home Fast',
    description: 'Free, no-obligation cash offer for your single-family home.',
    lead_form: {
      type: 'HIGHER_INTENT',
      sms_consent: true,
    },
  },
  tracking: {
    pixel: true,
    capi: true,
  },
};
