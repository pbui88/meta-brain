import type { Handler, HandlerEvent } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseClient } from './_supabase';

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

interface GeneratePayload {
  marketCity: string;
  marketState?: string;
  marketRadiusMiles: number;
  hookPattern: string;
  offerPattern: string;
  format: 'VIDEO' | 'STATIC' | 'LEAD_AD' | string;
  funnelStage?: 'awareness' | 'consideration' | 'conversion';
  campaignTemplateId?: string;
}

interface GeneratedAdBody {
  primary_text: string;
  headline: string;
  description: string;
  video_script: string;
  lead_form_questions: Array<{ question: string; type: string }>;
}

const SYSTEM_PROMPT = `You write Meta (Facebook/Instagram) ad copy for real estate investors targeting
motivated single-family home sellers. The offer pattern may describe different buyer programs:
- "Cash offer" style patterns: a direct cash purchase, fast close, as-is condition.
- "Retail buyer program" style patterns: the seller's home is marketed to retail (owner-occupant) buyers to
  net a higher price than a cash investor offer, typically with more flexible timing.
- "Novation" style patterns: the investor makes light repairs/improvements and lists the home on the seller's
  behalf via a novation agreement, splitting the increased sale proceeds with the seller.
Adapt the copy's claims and CTA to whichever buyer program the offer pattern describes; never claim a cash-only
close speed for a retail or novation offer, and never imply a retail sale price for a cash offer.
You must comply with Meta's Special Ad Category (HOUSING) policy:
- Never reference personal attributes or financial distress (e.g. "behind on your mortgage", "struggling
  financially", "foreclosure", "bad credit", "divorce", "bankruptcy", "eviction"). Focus on the PROPERTY and
  the OFFER, not the seller's personal situation.
- Keep tone direct, benefit-focused, and compliant with housing ad transparency norms.
Respond with ONLY a JSON object matching this shape, no prose, no markdown fences:
{
  "primary_text": string,
  "headline": string (max 40 chars),
  "description": string (max 30 chars),
  "video_script": string (a hook -> situation -> relief -> CTA script, 4-6 short lines),
  "lead_form_questions": [{ "question": string, "type": "TIMELINE" | "PROPERTY_TYPE" | "OCCUPANCY" | "CUSTOM" }]
}`;

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(400, { error: 'ANTHROPIC_API_KEY is not configured.' });
  }

  let body: GeneratePayload;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' });
  }

  if (!body.marketCity || !body.hookPattern || !body.offerPattern || !body.format) {
    return jsonResponse(400, {
      error: 'marketCity, hookPattern, offerPattern, and format are required.',
    });
  }

  const marketLabel = body.marketState ? `${body.marketCity}, ${body.marketState}` : body.marketCity;
  const userPrompt = `Market: ${marketLabel}, ${body.marketRadiusMiles || 20}-mile radius.
Audience: motivated single-family home sellers.
Hook pattern to use: "${body.hookPattern}"
Offer pattern to use: "${body.offerPattern}"
Ad format: ${body.format}
Funnel stage: ${body.funnelStage || 'consideration'}

Generate one ad concept.`;

  try {
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
    const anthropic = new Anthropic({
      apiKey,
      defaultHeaders: workspaceId ? { 'anthropic-workspace-id': workspaceId } : undefined,
    });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return jsonResponse(500, { error: 'Model returned no text content.' });
    }

    let generated: GeneratedAdBody;
    try {
      generated = JSON.parse(textBlock.text);
    } catch {
      return jsonResponse(500, { error: 'Model response was not valid JSON.', raw: textBlock.text });
    }

    const supabase = getSupabaseClient();
    const { data: saved, error } = await supabase
      .from('generated_ads')
      .insert({
        campaign_template_id: body.campaignTemplateId || null,
        market_city: body.marketCity,
        market_state: body.marketState || null,
        market_radius_miles: body.marketRadiusMiles,
        hook_pattern: body.hookPattern,
        offer_pattern: body.offerPattern,
        format: body.format,
        primary_text: generated.primary_text,
        headline: generated.headline,
        description: generated.description,
        video_script: generated.video_script,
        lead_form_questions: generated.lead_form_questions,
      })
      .select()
      .single();

    if (error) {
      return jsonResponse(207, { ...generated, warning: `Generated but failed to save: ${error.message}` });
    }

    return jsonResponse(200, saved);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error generating ad.';
    return jsonResponse(500, { error: message });
  }
};
