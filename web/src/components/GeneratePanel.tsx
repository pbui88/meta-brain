import { useEffect, useState } from 'react';
import { getBenchmarks, generateAdFromPattern } from '../api';
import type { CampaignJson, GeneratedAd } from '../types';
import { button, card, colors, input, label, sectionTitle } from '../styles';

const OFFER_OPTIONS = ['Cash offer', 'As-is purchase', 'Fast close', 'No fees'];
const FORMAT_OPTIONS = [
  { value: 'VIDEO', label: 'Video Script' },
  { value: 'STATIC', label: 'Static Image' },
  { value: 'LEAD_AD', label: 'Lead Ad' },
];

interface Props {
  campaign: CampaignJson;
  onApply: (next: CampaignJson) => void;
}

export function GeneratePanel({ campaign, onApply }: Props) {
  const [hookOptions, setHookOptions] = useState<string[]>([]);
  const [hookPattern, setHookPattern] = useState('');
  const [offerPattern, setOfferPattern] = useState(OFFER_OPTIONS[0]);
  const [format, setFormat] = useState(FORMAT_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedAd | null>(null);

  useEffect(() => {
    getBenchmarks()
      .then((b) => {
        const labels = b.topHooks.map((h) => h.label);
        setHookOptions(labels);
        if (labels.length) setHookPattern(labels[0]);
      })
      .catch(() => {
        // Benchmarks unavailable; fall back to manual hook entry below.
      });
  }, []);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const generated = await generateAdFromPattern({
        marketCity: campaign.market_city,
        marketRadiusMiles: campaign.adset.market_radius_miles,
        hookPattern,
        offerPattern,
        format,
      });
      setResult(generated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.');
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!result) return;
    onApply({
      ...campaign,
      ad: {
        ...campaign.ad,
        primary_text: result.primary_text,
        headline: result.headline,
        description: result.description,
        video_script_snippet: result.video_script,
        lead_form:
          campaign.ad.destination_type === 'LEAD_FORM'
            ? {
                type: campaign.ad.lead_form?.type || 'HIGHER_INTENT',
                sms_consent: campaign.ad.lead_form?.sms_consent ?? true,
                custom_questions: result.lead_form_questions,
              }
            : campaign.ad.lead_form,
      },
    });
  }

  return (
    <div style={card}>
      <div style={sectionTitle}>Generate Ad from Patterns</div>

      <label style={label}>Hook Pattern</label>
      {hookOptions.length > 0 ? (
        <select style={{ ...input, marginBottom: 8 }} value={hookPattern} onChange={(e) => setHookPattern(e.target.value)}>
          {hookOptions.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      ) : (
        <input
          style={{ ...input, marginBottom: 8 }}
          placeholder="e.g. Sell as-is, skip repairs"
          value={hookPattern}
          onChange={(e) => setHookPattern(e.target.value)}
        />
      )}

      <label style={label}>Offer Pattern</label>
      <select style={{ ...input, marginBottom: 8 }} value={offerPattern} onChange={(e) => setOfferPattern(e.target.value)}>
        {OFFER_OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <label style={label}>Format</label>
      <select style={{ ...input, marginBottom: 12 }} value={format} onChange={(e) => setFormat(e.target.value)}>
        {FORMAT_OPTIONS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <button style={{ ...button('primary'), width: '100%' }} onClick={generate} disabled={loading || !hookPattern}>
        {loading ? 'Generating...' : `Generate ad for ${campaign.market_city || 'your market'}`}
      </button>

      {error && <div style={{ color: colors.bad, marginTop: 8, fontSize: 13 }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${colors.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{result.headline}</div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>{result.primary_text}</div>
          <div style={{ fontSize: 12, color: colors.muted, whiteSpace: 'pre-wrap', marginBottom: 10 }}>
            {result.video_script}
          </div>
          <button style={{ ...button('secondary'), width: '100%' }} onClick={apply}>
            Apply to Ad Builder
          </button>
        </div>
      )}
    </div>
  );
}
