import type { Handler, HandlerEvent } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';
import type { CampaignJson } from './_scoring/types';

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

interface SavePayload {
  id?: string;
  campaignJson: CampaignJson;
}

export const handler: Handler = async (event: HandlerEvent) => {
  const supabase = getSupabaseClient();
  const id = event.queryStringParameters?.id;

  try {
    if (event.httpMethod === 'GET') {
      if (id) {
        const { data, error } = await supabase
          .from('campaign_templates')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          return jsonResponse(404, { error: `Campaign template ${id} not found.` });
        }

        return jsonResponse(200, data);
      }

      const { data, error } = await supabase
        .from('campaign_template_summaries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        return jsonResponse(500, { error: error.message });
      }

      return jsonResponse(200, data);
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      let body: SavePayload;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return jsonResponse(400, { error: 'Invalid JSON body.' });
      }

      const { campaignJson } = body;
      if (!campaignJson) {
        return jsonResponse(400, { error: 'campaignJson is required.' });
      }

      const row = {
        name: campaignJson.name,
        market_city: campaignJson.market_city,
        market_radius_miles: campaignJson.adset?.market_radius_miles,
        objective: campaignJson.objective,
        special_ad_category: campaignJson.special_ad_category,
        json_definition: campaignJson,
      };

      const targetId = event.httpMethod === 'PUT' ? id || body.id : body.id;

      const query = targetId
        ? supabase.from('campaign_templates').update(row).eq('id', targetId).select().single()
        : supabase.from('campaign_templates').insert(row).select().single();

      const { data, error } = await query;

      if (error || !data) {
        return jsonResponse(500, { error: error?.message || 'Failed to save campaign template.' });
      }

      return jsonResponse(200, data);
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) {
        return jsonResponse(400, { error: 'id query parameter is required.' });
      }

      const { error } = await supabase.from('campaign_templates').delete().eq('id', id);

      if (error) {
        return jsonResponse(500, { error: error.message });
      }

      return jsonResponse(200, { success: true });
    }

    return jsonResponse(405, { error: 'Method not allowed.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    return jsonResponse(500, { error: message });
  }
};
