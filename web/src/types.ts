export interface LeadFormQuestion {
  question: string;
  type: 'TIMELINE' | 'PROPERTY_TYPE' | 'OCCUPANCY' | 'CUSTOM';
}

export interface CampaignJson {
  name: string;
  market_city: string;
  special_ad_category: string;
  objective: 'LEADS' | 'SALES' | string;
  adset: {
    market_radius_miles: number;
    budget: {
      type: 'DAILY' | 'LIFETIME';
      amount: number;
    };
    schedule: {
      start_date: string;
      end_date?: string;
    };
    optimization_event: string;
    placements: string;
  };
  ad: {
    destination_type: 'LEAD_FORM' | 'WEBSITE' | 'MESSENGER' | string;
    primary_text: string;
    headline: string;
    description: string;
    video_script_snippet?: string;
    lead_form?: {
      type: string;
      sms_consent: boolean;
      custom_questions: LeadFormQuestion[];
    };
  };
  tracking: {
    pixel: boolean;
    capi: boolean;
  };
}

export interface ScoreFlag {
  category: string;
  severity: 'low' | 'medium' | 'high';
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

export interface TemplateSummary {
  id: string;
  name: string;
  market_city: string;
  market_radius_miles: number;
  objective: string;
  special_ad_category: string;
  created_at: string;
  updated_at: string;
  latest_score_id: string | null;
  latest_total_score: number | null;
  latest_flags: ScoreFlag[] | null;
  latest_score_at: string | null;
}

export interface TemplateRecord {
  id: string;
  name: string;
  market_city: string;
  market_radius_miles: number;
  objective: string;
  special_ad_category: string;
  json_definition: CampaignJson;
  created_at: string;
  updated_at: string;
}
