import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTemplate, listTemplates, scoreCampaign } from '../api';
import { Checklist as ChecklistDisplay } from '../components/Checklist';
import { ScoreCard } from '../components/ScoreCard';
import { buildChecklist } from '../checklist';
import { TopNav } from '../components/TopNav';
import { button, card, colors, eyebrow, page, pageTitle, sectionTitle } from '../styles';
import type { CampaignJson, ComplianceScore, ScoreResult, TemplateSummary } from '../types';

interface ComplianceEntry {
  template: TemplateSummary;
  campaign: CampaignJson;
  score: ScoreResult;
  compliance: ComplianceScore;
}

function scale(value: number, max: number) {
  return Math.round((value / 100) * max);
}

function deriveCreativeQuality(campaign: CampaignJson) {
  let score = 4;
  if (campaign.ad.primary_text.trim()) score += 2;
  if (campaign.ad.headline.trim()) score += 2;
  if (campaign.ad.description.trim()) score += 1;
  if (campaign.ad.video_script_snippet?.trim()) score += 1;
  return Math.min(10, score);
}

function deriveTestQuality(campaign: CampaignJson, score: ScoreResult) {
  let value = 4;
  if (campaign.adset.placements === 'ADVANTAGE_PLUS') value += 2;
  if (campaign.adset.market_radius_miles >= 15) value += 2;
  if (campaign.adset.optimization_event === 'CONVERSION_LEAD') value += 1;
  if (score.flags.length <= 2) value += 1;
  return Math.min(10, value);
}

function toComplianceScore(score: ScoreResult, campaign: CampaignJson): ComplianceScore {
  const blockers = score.flags.filter((flag) => flag.severity === 'high').map((flag) => flag.message);
  const warnings = score.flags.filter((flag) => flag.severity === 'medium').map((flag) => flag.message);
  const suggestions = score.flags.filter((flag) => flag.severity === 'low').map((flag) => flag.message);

  const compliance = {
    housing: scale(score.housingScore, 30),
    creativePolicy: scale(score.creativeScore, 20),
    destinationConsent: scale(score.destinationScore, 15),
    conversionSetup: scale(score.trackingScore, 15),
    creativeQuality: deriveCreativeQuality(campaign),
    testQuality: deriveTestQuality(campaign, score),
    blockers,
    warnings,
    suggestions:
      suggestions.length > 0
        ? suggestions
        : ['Keep refreshing proof, offers, and variations as benchmark data improves.'],
  };

  return {
    total:
      compliance.housing +
      compliance.creativePolicy +
      compliance.destinationConsent +
      compliance.conversionSetup +
      compliance.creativeQuality +
      compliance.testQuality,
    ...compliance,
  };
}

function breakdownRow(label: string, value: number, max: number) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 8 }}>
      <span>{label}</span>
      <span>
        {value}/{max}
      </span>
    </div>
  );
}

export function Compliance() {
  const [entries, setEntries] = useState<ComplianceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openChecklistId, setOpenChecklistId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const templates = await listTemplates();
        const results = await Promise.all(
          templates.map(async (template) => {
            const [details, score] = await Promise.all([getTemplate(template.id), scoreCampaign({ campaignTemplateId: template.id })]);
            return {
              template,
              campaign: details.json_definition,
              score,
              compliance: toComplianceScore(score, details.json_definition),
            };
          })
        );
        setEntries(results);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load compliance center.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const disclaimer = 'Internal readiness score only. This does not guarantee Meta approval, delivery, legal compliance, CPL, or conversion rate.';

  return (
    <div>
      <TopNav />
      <div style={{ ...page, maxWidth: 1320 }} className="fade-up">
        <div style={{ marginBottom: 20 }}>
          <Link to="/" style={{ ...eyebrow, textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <h1 style={pageTitle}>Compliance Center</h1>
        </div>

        <div style={{ ...card, marginBottom: 20, borderColor: colors.borderStrong }}>{disclaimer}</div>

        {error && <div style={{ color: colors.bad, marginBottom: 12 }}>{error}</div>}
        {loading && <div style={{ color: colors.muted }}>Loading…</div>}
        {!loading && entries.length === 0 && (
          <div style={{ ...card, color: colors.muted }}>No templates found. Create a campaign template to run compliance review.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {entries.map((entry) => {
            const checklistSections = buildChecklist(entry.campaign);
            return (
              <div key={entry.template.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>{entry.template.name}</div>
                    <div style={{ color: colors.muted, fontSize: 13 }}>
                      {entry.template.market_city} · updated {new Date(entry.template.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    style={button(openChecklistId === entry.template.id ? 'primary' : 'secondary')}
                    onClick={() => setOpenChecklistId((current) => (current === entry.template.id ? null : entry.template.id))}
                  >
                    Generate Ads Manager Checklist ({checklistSections.length} sections)
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: 20, alignItems: 'start' }}>
                  <ScoreCard
                    result={{
                      totalScore: entry.compliance.total,
                      housingScore: entry.compliance.housing,
                      creativeScore: entry.compliance.creativePolicy,
                      destinationScore: entry.compliance.destinationConsent,
                      trackingScore: entry.compliance.conversionSetup,
                      algorithmScore: entry.compliance.creativeQuality + entry.compliance.testQuality,
                      flags: entry.score.flags,
                    }}
                  />

                  <div>
                    <div style={{ ...card, marginBottom: 16, background: '#fffdf9' }}>
                      <div style={sectionTitle}>100-Point Breakdown</div>
                      {breakdownRow('Housing compliance', entry.compliance.housing, 30)}
                      {breakdownRow('Creative policy safety', entry.compliance.creativePolicy, 20)}
                      {breakdownRow('Destination / consent', entry.compliance.destinationConsent, 15)}
                      {breakdownRow('Conversion setup', entry.compliance.conversionSetup, 15)}
                      {breakdownRow('Creative quality', entry.compliance.creativeQuality, 10)}
                      {breakdownRow('Test quality', entry.compliance.testQuality, 10)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div style={{ ...card, background: '#fffdf9' }}>
                        <div style={sectionTitle}>Hard Blockers</div>
                        {entry.compliance.blockers.length === 0 ? (
                          <div style={{ color: colors.good, fontSize: 13.5 }}>No hard blockers detected.</div>
                        ) : (
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {entry.compliance.blockers.map((item) => (
                              <li key={item} style={{ marginBottom: 6, fontSize: 13.5 }}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div style={{ ...card, background: '#fffdf9' }}>
                        <div style={sectionTitle}>Warnings</div>
                        {entry.compliance.warnings.length === 0 ? (
                          <div style={{ color: colors.muted, fontSize: 13.5 }}>No warnings right now.</div>
                        ) : (
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {entry.compliance.warnings.map((item) => (
                              <li key={item} style={{ marginBottom: 6, fontSize: 13.5 }}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div style={{ ...card, background: '#fffdf9' }}>
                        <div style={sectionTitle}>Optimization Suggestions</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {entry.compliance.suggestions.map((item) => (
                            <li key={item} style={{ marginBottom: 6, fontSize: 13.5 }}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {openChecklistId === entry.template.id && (
                  <div style={{ marginTop: 16 }}>
                    <ChecklistDisplay campaign={entry.campaign} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
