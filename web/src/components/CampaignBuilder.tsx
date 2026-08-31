import type { CampaignJson, LeadFormQuestion } from '../types';
import { card, colors, input, label, sectionTitle } from '../styles';

interface Props {
  campaign: CampaignJson;
  onChange: (next: CampaignJson) => void;
}

function Field({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}>{children}</div>;
}

const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

export function CampaignBuilder({ campaign: c, onChange }: Props) {
  const update = (patch: Partial<CampaignJson>) => onChange({ ...c, ...patch });
  const updateAdset = (patch: Partial<CampaignJson['adset']>) =>
    onChange({ ...c, adset: { ...c.adset, ...patch } });
  const updateAd = (patch: Partial<CampaignJson['ad']>) => onChange({ ...c, ad: { ...c.ad, ...patch } });
  const updateTracking = (patch: Partial<CampaignJson['tracking']>) =>
    onChange({ ...c, tracking: { ...c.tracking, ...patch } });
  const updateLeadForm = (patch: Partial<NonNullable<CampaignJson['ad']['lead_form']>>) =>
    updateAd({
      lead_form: {
        type: 'HIGHER_INTENT',
        sms_consent: true,
        custom_questions: [],
        ...c.ad.lead_form,
        ...patch,
      },
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Basics */}
      <div style={card}>
        <div style={sectionTitle}>Campaign Basics</div>
        <Field>
          <label style={label}>Campaign Name</label>
          <input style={input} value={c.name} onChange={(e) => update({ name: e.target.value })} />
        </Field>
        <div style={row}>
          <Field>
            <label style={label}>Market City</label>
            <input
              style={input}
              value={c.market_city}
              onChange={(e) => update({ market_city: e.target.value })}
            />
          </Field>
          <Field>
            <label style={label}>Objective</label>
            <select style={input} value={c.objective} onChange={(e) => update({ objective: e.target.value })}>
              <option value="LEADS">Leads</option>
              <option value="SALES">Sales</option>
            </select>
          </Field>
        </div>
        <Field>
          <label style={label}>Special Ad Category</label>
          <input style={{ ...input, background: '#f0f0f0' }} value={c.special_ad_category} disabled />
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            Locked to HOUSING for real estate campaigns.
          </div>
        </Field>
      </div>

      {/* Ad Set Targeting */}
      <div style={card}>
        <div style={sectionTitle}>Ad Set Targeting</div>
        <div style={row}>
          <Field>
            <label style={label}>Market Radius (miles)</label>
            <input
              type="number"
              style={input}
              value={c.adset.market_radius_miles}
              onChange={(e) => updateAdset({ market_radius_miles: Number(e.target.value) })}
            />
            {c.adset.market_radius_miles < 15 && (
              <div style={{ fontSize: 12, color: colors.bad, marginTop: 4 }}>
                Must be ≥ 15 miles for HOUSING campaigns.
              </div>
            )}
          </Field>
          <Field>
            <label style={label}>Optimization Event</label>
            <select
              style={input}
              value={c.adset.optimization_event}
              onChange={(e) => updateAdset({ optimization_event: e.target.value })}
            >
              <option value="CONVERSION_LEAD">Conversion: Lead</option>
              <option value="LINK_CLICK">Link Click</option>
              <option value="LANDING_PAGE_VIEW">Landing Page View</option>
            </select>
          </Field>
        </div>
        <div style={row}>
          <Field>
            <label style={label}>Budget Type</label>
            <select
              style={input}
              value={c.adset.budget.type}
              onChange={(e) => updateAdset({ budget: { ...c.adset.budget, type: e.target.value as 'DAILY' | 'LIFETIME' } })}
            >
              <option value="DAILY">Daily</option>
              <option value="LIFETIME">Lifetime</option>
            </select>
          </Field>
          <Field>
            <label style={label}>Budget Amount ($)</label>
            <input
              type="number"
              style={input}
              value={c.adset.budget.amount}
              onChange={(e) => updateAdset({ budget: { ...c.adset.budget, amount: Number(e.target.value) } })}
            />
          </Field>
        </div>
        <div style={row}>
          <Field>
            <label style={label}>Start Date</label>
            <input
              type="date"
              style={input}
              value={c.adset.schedule.start_date}
              onChange={(e) => updateAdset({ schedule: { ...c.adset.schedule, start_date: e.target.value } })}
            />
          </Field>
          <Field>
            <label style={label}>End Date (optional)</label>
            <input
              type="date"
              style={input}
              value={c.adset.schedule.end_date || ''}
              onChange={(e) => updateAdset({ schedule: { ...c.adset.schedule, end_date: e.target.value || undefined } })}
            />
          </Field>
        </div>
        <Field>
          <label style={label}>Placements</label>
          <select
            style={input}
            value={c.adset.placements}
            onChange={(e) => updateAdset({ placements: e.target.value })}
          >
            <option value="ADVANTAGE_PLUS">Advantage+ (recommended)</option>
            <option value="MANUAL">Manual</option>
          </select>
        </Field>
      </div>

      {/* Ad Creative */}
      <div style={card}>
        <div style={sectionTitle}>Ad Creative</div>
        <Field>
          <label style={label}>Primary Text</label>
          <textarea
            style={{ ...input, height: 80, resize: 'vertical' }}
            value={c.ad.primary_text}
            onChange={(e) => updateAd({ primary_text: e.target.value })}
          />
        </Field>
        <div style={row}>
          <Field>
            <label style={label}>Headline</label>
            <input style={input} value={c.ad.headline} onChange={(e) => updateAd({ headline: e.target.value })} />
          </Field>
          <Field>
            <label style={label}>Description</label>
            <input
              style={input}
              value={c.ad.description}
              onChange={(e) => updateAd({ description: e.target.value })}
            />
          </Field>
        </div>
        <Field>
          <label style={label}>Video Script Snippet (optional)</label>
          <textarea
            style={{ ...input, height: 60, resize: 'vertical' }}
            value={c.ad.video_script_snippet || ''}
            onChange={(e) => updateAd({ video_script_snippet: e.target.value })}
          />
        </Field>
        <Field>
          <label style={label}>Destination</label>
          <select
            style={input}
            value={c.ad.destination_type}
            onChange={(e) => updateAd({ destination_type: e.target.value })}
          >
            <option value="LEAD_FORM">Lead Form</option>
            <option value="WEBSITE">Website</option>
            <option value="MESSENGER">Messenger</option>
          </select>
        </Field>
      </div>

      {/* Lead Form Questions */}
      {c.ad.destination_type === 'LEAD_FORM' && (
        <div style={card}>
          <div style={sectionTitle}>Lead Form Questions</div>
          <div style={row}>
            <Field>
              <label style={label}>Form Type</label>
              <select
                style={input}
                value={c.ad.lead_form?.type || 'HIGHER_INTENT'}
                onChange={(e) => updateLeadForm({ type: e.target.value })}
              >
                <option value="HIGHER_INTENT">Higher Intent (recommended)</option>
                <option value="MORE_VOLUME">More Volume</option>
              </select>
            </Field>
            <Field>
              <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={c.ad.lead_form?.sms_consent ?? true}
                  onChange={(e) => updateLeadForm({ sms_consent: e.target.checked })}
                />
                Capture SMS Consent
              </label>
            </Field>
          </div>

          <label style={label}>Custom Questions</label>
          {(c.ad.lead_form?.custom_questions || []).map((q, i) => (
            <div key={i} style={{ ...row, gridTemplateColumns: '2fr 1fr auto', marginBottom: 8 }}>
              <input
                style={input}
                value={q.question}
                onChange={(e) => {
                  const questions = [...(c.ad.lead_form?.custom_questions || [])];
                  questions[i] = { ...q, question: e.target.value };
                  updateLeadForm({ custom_questions: questions });
                }}
              />
              <select
                style={input}
                value={q.type}
                onChange={(e) => {
                  const questions = [...(c.ad.lead_form?.custom_questions || [])];
                  questions[i] = { ...q, type: e.target.value as LeadFormQuestion['type'] };
                  updateLeadForm({ custom_questions: questions });
                }}
              >
                <option value="TIMELINE">Timeline</option>
                <option value="PROPERTY_TYPE">Property Type</option>
                <option value="OCCUPANCY">Occupancy</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  const questions = (c.ad.lead_form?.custom_questions || []).filter((_, idx) => idx !== i);
                  updateLeadForm({ custom_questions: questions });
                }}
                style={{ border: 'none', background: 'none', color: colors.bad, cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              updateLeadForm({
                custom_questions: [
                  ...(c.ad.lead_form?.custom_questions || []),
                  { question: '', type: 'CUSTOM' },
                ],
              })
            }
            style={{
              border: `1px dashed ${colors.border}`,
              background: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            + Add Question
          </button>
        </div>
      )}

      {/* Tracking */}
      <div style={card}>
        <div style={sectionTitle}>Tracking & Optimization</div>
        <div style={row}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={c.tracking.pixel}
              onChange={(e) => updateTracking({ pixel: e.target.checked })}
            />
            Meta Pixel Enabled
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={c.tracking.capi}
              onChange={(e) => updateTracking({ capi: e.target.checked })}
            />
            Conversions API (CAPI) Enabled
          </label>
        </div>
      </div>
    </div>
  );
}
