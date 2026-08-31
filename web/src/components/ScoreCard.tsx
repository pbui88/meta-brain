import type { ScoreResult } from '../types';
import { card, colors, sectionTitle } from '../styles';

const SUB_SCORES: Array<{ key: keyof ScoreResult; label: string }> = [
  { key: 'housingScore', label: 'Housing Compliance' },
  { key: 'creativeScore', label: 'Creative' },
  { key: 'destinationScore', label: 'Destination' },
  { key: 'trackingScore', label: 'Tracking' },
  { key: 'algorithmScore', label: 'Algorithm Fit' },
];

const severityColor: Record<string, string> = {
  high: colors.bad,
  medium: colors.warn,
  low: '#0288d1',
};

function scoreBadge(score: number) {
  if (score >= 85) return { label: 'Good', color: colors.good };
  if (score >= 60) return { label: 'Needs Work', color: colors.warn };
  return { label: 'Blocking Issues', color: colors.bad };
}

export function ScoreCard({ result }: { result: ScoreResult }) {
  const badge = scoreBadge(result.totalScore);

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: colors.muted, textTransform: 'uppercase' }}>Total Score</div>
          <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{result.totalScore}</div>
        </div>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            background: badge.color,
          }}
        >
          {badge.label}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          marginBottom: 24,
        }}
      >
        {SUB_SCORES.map(({ key, label }) => (
          <div
            key={key}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div style={{ fontSize: 11, color: colors.muted }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{result[key] as number}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={sectionTitle}>Flags ({result.flags.length})</div>
        {result.flags.length === 0 && <div style={{ color: colors.good }}>No issues detected.</div>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {result.flags.map((flag, i) => (
            <li
              key={i}
              style={{
                borderLeft: `4px solid ${severityColor[flag.severity]}`,
                padding: '8px 12px',
                marginBottom: 8,
                background: '#fafafa',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  color: severityColor[flag.severity],
                  fontWeight: 700,
                }}
              >
                {flag.category} · {flag.severity}
              </div>
              <div>{flag.message}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
