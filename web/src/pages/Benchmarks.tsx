import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBenchmarks } from '../api';
import type { BenchmarksResult, HookBreakdown, PatternConfidenceScore } from '../types';
import { TopNav } from '../components/TopNav';
import { button, card, chip, colors, eyebrow, fonts, page, pageTitle, sectionTitle } from '../styles';

function Bar({ label: text, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span>{text}</span>
        <span style={{ color: colors.muted, fontFamily: fonts.mono, fontSize: 12 }}>{count}</span>
      </div>
      <div style={{ background: colors.bg, borderRadius: 4, height: 7, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: colors.primary, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function confidenceLabel(score: number): PatternConfidenceScore['label'] {
  if (score >= 70) return 'strong';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'weak';
  return 'insufficient';
}

function confidenceChipVariant(label: PatternConfidenceScore['label']) {
  if (label === 'strong') return 'good';
  if (label === 'moderate') return 'warn';
  return 'bad';
}

function getPatternConfidence(hook: HookBreakdown): PatternConfidenceScore {
  const brandDiversity = Math.min(40, hook.brands * 10);
  const medianDaysLive = hook.medianLongevityDays ?? hook.avgLongevityDays ?? null;
  const longevityScore = medianDaysLive == null ? 0 : Math.min(30, Math.round((medianDaysLive / 30) * 30));
  const density = hook.variationDensity ?? Number((hook.count / Math.max(1, hook.brands)).toFixed(2));
  const variationDensity = Math.min(20, Math.round(density * 5));
  const relevanceScore = 10;
  const score = Math.max(0, Math.min(100, brandDiversity + longevityScore + variationDensity + relevanceScore));
  const label = confidenceLabel(score);

  return {
    score,
    brandDiversity,
    medianDaysLive,
    variationDensity,
    relevanceScore,
    label,
    explanation: `${hook.brands} brand signals, ${medianDaysLive ?? 'unknown'} median live days, and ${density.toFixed(
      1
    )} ads per brand drive this research-priority score.`,
  };
}

function buildBrief(hook: HookBreakdown) {
  return [
    `Test hook: "${hook.label}" against your current control.`,
    'Keep claims broad, property-solution focused, and safe for housing policy review.',
    'Use proof rooted in process simplicity, seller optionality, or speed rather than personal-attribute targeting.',
    'Rotate one offer angle and one format while holding audience settings constant.',
  ];
}

export function Benchmarks() {
  const [data, setData] = useState<BenchmarksResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeBrief, setActiveBrief] = useState<string | null>(null);

  useEffect(() => {
    getBenchmarks().then(setData).catch((e) => setError(e.message));
  }, []);

  const confidenceMap = useMemo(
    () =>
      new Map<string, PatternConfidenceScore>((data?.topHooks || []).map((hook) => [hook.label, getPatternConfidence(hook)])),
    [data]
  );

  if (error)
    return (
      <div>
        <TopNav />
        <div style={{ ...page, color: colors.bad }}>{error}</div>
      </div>
    );
  if (!data)
    return (
      <div>
        <TopNav />
        <div style={{ ...page, color: colors.muted }}>Loading…</div>
      </div>
    );

  const maxHook = Math.max(1, ...data.topHooks.map((h) => h.count));
  const maxFormat = Math.max(1, ...data.formatDistribution.map((f) => f.count));
  const maxCta = Math.max(1, ...data.ctaDistribution.map((c) => c.count));

  return (
    <div>
      <TopNav />
      <div style={page} className="fade-up">
        <div style={{ marginBottom: 20 }}>
          <Link to="/research" style={{ ...eyebrow, textDecoration: 'none' }}>
            ← Industry Research
          </Link>
          <h1 style={pageTitle}>Patterns &amp; Benchmarks</h1>
          <div style={{ color: colors.muted, fontSize: 13.5 }}>{data.totalAds} ads analyzed</div>
        </div>

        <div style={{ ...card, marginBottom: 16, borderColor: colors.borderStrong }}>
          <div style={sectionTitle}>Pattern Confidence Methodology</div>
          <div style={{ fontSize: 13.5, marginBottom: 8 }}>
            Brand diversity contributes up to 40 points, median days live up to 30, variation density up to 20, and
            single-family relevance 10.
          </div>
          <div style={{ color: colors.bad, fontSize: 12.5 }}>
            This score ranks research priority. It does NOT predict conversion rate, CTR, or CPL.
          </div>
        </div>

        <div style={{ ...card, marginBottom: 20, borderColor: colors.borderStrong }}>
          <div style={{ fontFamily: fonts.display, fontSize: 16 }}>{data.note}</div>
          {data.avgLongevityDays != null && (
            <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
              Average ad longevity: {data.avgLongevityDays} days
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={card}>
            <div style={sectionTitle}>Top Hooks</div>
            {data.topHooks.length === 0 && <div style={{ color: colors.muted, fontSize: 14 }}>No hooks tagged yet.</div>}
            {data.topHooks.map((hook) => {
              const confidence = confidenceMap.get(hook.label) || getPatternConfidence(hook);
              return (
                <div key={hook.label} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${colors.border}` }}>
                  <Bar label={hook.label} count={hook.count} max={maxHook} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={chip(confidenceChipVariant(confidence.label))}>
                      {confidence.label} confidence · {confidence.score}
                    </span>
                    <span style={{ fontSize: 11, color: colors.muted }}>
                      {hook.brands} brand{hook.brands === 1 ? '' : 's'}
                      {confidence.medianDaysLive != null ? ` · median ${confidence.medianDaysLive}d live` : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: colors.muted, marginBottom: 10 }}>{confidence.explanation}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: activeBrief === hook.label ? 10 : 0 }}>
                    <Link to={`/bulk-generate?hook=${encodeURIComponent(hook.label)}`}>
                      <button style={button('secondary')}>Use as Inspiration →</button>
                    </Link>
                    <button
                      style={button(activeBrief === hook.label ? 'primary' : 'secondary')}
                      onClick={() => setActiveBrief((current) => (current === hook.label ? null : hook.label))}
                    >
                      Generate Test Brief →
                    </button>
                  </div>
                  {activeBrief === hook.label && (
                    <div style={{ ...card, padding: 14, marginTop: 10, background: '#fffdf9' }}>
                      <div style={{ fontFamily: fonts.display, fontSize: 15, marginBottom: 6 }}>Test brief</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {buildBrief(hook).map((item) => (
                          <li key={item} style={{ marginBottom: 6, fontSize: 13.5 }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={card}>
            <div style={sectionTitle}>Format Distribution</div>
            {data.formatDistribution.length === 0 && (
              <div style={{ color: colors.muted, fontSize: 14 }}>No formats tagged yet.</div>
            )}
            {data.formatDistribution.map((f) => (
              <Bar key={f.format} label={f.format} count={f.count} max={maxFormat} />
            ))}
          </div>

          <div style={card}>
            <div style={sectionTitle}>CTA Distribution</div>
            {data.ctaDistribution.length === 0 && <div style={{ color: colors.muted, fontSize: 14 }}>No CTAs tagged yet.</div>}
            {data.ctaDistribution.map((c) => (
              <Bar key={c.cta} label={c.cta} count={c.count} max={maxCta} />
            ))}
          </div>

          <div style={card}>
            <div style={sectionTitle}>Funnel Stage Mix</div>
            {Object.keys(data.funnelStageDistribution).length === 0 && (
              <div style={{ color: colors.muted, fontSize: 14 }}>No funnel stages tagged yet.</div>
            )}
            {Object.entries(data.funnelStageDistribution).map(([stage, count]) => (
              <Bar
                key={stage}
                label={stage}
                count={count}
                max={Math.max(1, ...Object.values(data.funnelStageDistribution))}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
