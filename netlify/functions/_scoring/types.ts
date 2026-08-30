export interface CampaignJson {
  name: string;
  special_ad_category: string;
  adset: {
    market_radius_miles: number;
    optimization_event: string;
    placements: string;
  };
  ad: {
    destination_type: 'LEAD_FORM' | 'WEBSITE' | 'MESSENGER' | string;
    primary_text: string;
    headline: string;
    description: string;
    lead_form?: {
      type: string;
      sms_consent: boolean;
    };
  };
  tracking: {
    pixel: boolean;
    capi: boolean;
  };
}

export type FlagSeverity = 'low' | 'medium' | 'high';

export interface ScoreFlag {
  category: string;
  severity: FlagSeverity;
  message: string;
}

export interface ScoreResult {
  totalScore: number;
  housingScore: number;
  creativeScore: number;
  destinationScore: number;
  trackingScore: number;
  algorithmScore: number;
  flags: ScoreFlag[];
}
