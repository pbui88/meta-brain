import type { Handler, HandlerEvent } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event: HandlerEvent) => {
  const supabase = getSupabaseClient();
  const id = event.queryStringParameters?.id;
  const campaignTemplateId = event.queryStringParameters?.campaignTemplateId;

  try {
    if (event.httpMethod === 'GET') {
      let query = supabase.from('generated_ads').select('*').order('created_at', { ascending: false });
      if (campaignTemplateId) query = query.eq('campaign_template_id', campaignTemplateId);

      const { data, error } = await query;
      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, data);
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) return jsonResponse(400, { error: 'id query parameter is required.' });
      const { error } = await supabase.from('generated_ads').delete().eq('id', id);
      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, { success: true });
    }

    return jsonResponse(405, { error: 'Method not allowed.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    return jsonResponse(500, { error: message });
  }
};
