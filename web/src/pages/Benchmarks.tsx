import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBenchmarks } from '../api';
import type { BenchmarksResult } from '../types';
import { card, colors, sectionTitle } from '../styles';

function Bar({ label: text, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
        <span>{text}</span>
        <span style={{ color: colors.muted }}>{count}</span>
      </div>
      <div style={{ background: colors.bg, borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: colors.primary }} />
      </div>
    </div>
  );
}

export function Benchmarks() {
  const [data, setData] = useState<BenchmarksResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBenchmarks().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ padding: 24, color: colors.bad }}>{error}</div>;
  if (!data) return <div style={{ padding: 24, color: colors.muted }}>Loading...</div>;

  const maxHook = Math.max(1, ...data.topHooks.map((h) => h.count));
  const maxFormat = Math.max(1, ...data.formatDistribution.map((f) => f.count));
  const maxCta = Math.max(1, ...data.ctaDistribution.map((c) => c.count));

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/research" style={{ fontSize: 13, color: colors.primary }}>
          ← Industry Research
        </Link>
        <h1 style={{ margin: '4px 0' }}>Patterns & Benchmarks</h1>
        <div style={{ color: colors.muted }}>{data.totalAds} ads analyzed</div>
      </div>

      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 14 }}>{data.note}</div>
        {data.avgLongevityDays != null && (
          <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            Average ad longevity: {data.avgLongevityDays} days
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={card}>
          <div style={sectionTitle}>Top Hooks</div>
          {data.topHooks.length === 0 && <div style={{ color: colors.muted }}>No hooks tagged yet.</div>}
          {data.topHooks.map((h) => (
            <div key={h.label} style={{ marginBottom: 12 }}>
              <Bar label={h.label} count={h.count} max={maxHook} />
              <div style={{ fontSize: 11, color: colors.muted }}>
                {h.brands} brand{h.brands === 1 ? '' : 's'}
                {h.avgLongevityDays != null ? ` · avg ${h.avgLongevityDays}d live` : ''}
              </div>
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={sectionTitle}>Format Distribution</div>
          {data.formatDistribution.length === 0 && <div style={{ color: colors.muted }}>No formats tagged yet.</div>}
          {data.formatDistribution.map((f) => (
            <Bar key={f.format} label={f.format} count={f.count} max={maxFormat} />
          ))}
        </div>

        <div style={card}>
          <div style={sectionTitle}>CTA Distribution</div>
          {data.ctaDistribution.length === 0 && <div style={{ color: colors.muted }}>No CTAs tagged yet.</div>}
          {data.ctaDistribution.map((c) => (
            <Bar key={c.cta} label={c.cta} count={c.count} max={maxCta} />
          ))}
        </div>

        <div style={card}>
          <div style={sectionTitle}>Funnel Stage Mix</div>
          {Object.keys(data.funnelStageDistribution).length === 0 && (
            <div style={{ color: colors.muted }}>No funnel stages tagged yet.</div>
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
  );
}
