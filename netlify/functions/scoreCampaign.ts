import type { Handler, HandlerEvent } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';
import { scoreCampaignJson } from './_scoring';
import type { CampaignJson } from './_scoring/types';

interface RequestBody {
  campaignTemplateId?: string;
  campaignJson?: CampaignJson;
}

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' });
  }

  let body: RequestBody;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' });
  }

  const { campaignTemplateId, campaignJson: rawCampaignJson } = body;

  if (!campaignTemplateId && !rawCampaignJson) {
    return jsonResponse(400, {
      error: 'Provide either campaignTemplateId or campaignJson.',
    });
  }

  const supabase = getSupabaseClient();
  let campaignJson: CampaignJson;

  try {
    if (campaignTemplateId) {
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('json_definition')
        .eq('id', campaignTemplateId)
        .single();

      if (error || !data) {
        return jsonResponse(404, {
          error: `Campaign template ${campaignTemplateId} not found.`,
        });
      }

      campaignJson = data.json_definition as CampaignJson;
    } else {
      campaignJson = rawCampaignJson as CampaignJson;
    }

    const result = scoreCampaignJson(campaignJson);

    if (campaignTemplateId) {
      const { error: insertError } = await supabase.from('campaign_scores').insert({
        campaign_template_id: campaignTemplateId,
        total_score: result.totalScore,
        housing_score: result.housingScore,
        creative_score: result.creativeScore,
        destination_score: result.destinationScore,
        tracking_score: result.trackingScore,
        algorithm_score: result.algorithmScore,
        flags: result.flags,
      });

      if (insertError) {
        // Scoring succeeded even though persistence failed; surface both.
        return jsonResponse(207, {
          ...result,
          warning: `Score computed but failed to save: ${insertError.message}`,
        });
      }
    }

    return jsonResponse(200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error scoring campaign.';
    return jsonResponse(500, { error: message });
  }
};
