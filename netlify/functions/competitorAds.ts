import type { Handler, HandlerEvent } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const EDITABLE_FIELDS = ['hook_text', 'offer_text', 'funnel_stage', 'format', 'cta', 'destination_url', 'raw_source'] as const;

export const handler: Handler = async (event: HandlerEvent) => {
  const supabase = getSupabaseClient();
  const id = event.queryStringParameters?.id;
  const watchlistId = event.queryStringParameters?.watchlistId;

  try {
    if (event.httpMethod === 'GET') {
      let query = supabase.from('competitor_ads').select('*').order('created_at', { ascending: false });
      if (watchlistId) query = query.eq('watchlist_id', watchlistId);

      const { data, error } = await query;
      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, data);
    }

    if (event.httpMethod === 'PUT') {
      if (!id) return jsonResponse(400, { error: 'id query parameter is required.' });

      let body: Record<string, unknown>;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return jsonResponse(400, { error: 'Invalid JSON body.' });
      }

      const patch: Record<string, unknown> = {};
      for (const field of EDITABLE_FIELDS) {
        if (field in body) patch[field] = body[field];
      }

      if (Object.keys(patch).length === 0) {
        return jsonResponse(400, { error: `No editable fields provided. Allowed: ${EDITABLE_FIELDS.join(', ')}` });
      }

      const { data, error } = await supabase.from('competitor_ads').update(patch).eq('id', id).select().single();
      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, data);
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) return jsonResponse(400, { error: 'id query parameter is required.' });
      const { error } = await supabase.from('competitor_ads').delete().eq('id', id);
      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, { success: true });
    }

    return jsonResponse(405, { error: 'Method not allowed.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    return jsonResponse(500, { error: message });
  }
};
