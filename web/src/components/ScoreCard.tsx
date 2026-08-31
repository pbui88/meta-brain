import type { ScoreResult } from '../types';
import { card, colors, fonts, sectionTitle, statNumber } from '../styles';

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
  low: colors.primary,
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', fontFamily: fonts.mono, letterSpacing: '0.08em' }}>
            Total Score
          </div>
          <div style={{ ...statNumber, fontSize: 52, lineHeight: 1 }}>{result.totalScore}</div>
        </div>
        <span
          style={{
            padding: '4px 11px',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            fontFamily: fonts.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            color: '#fdf9f2',
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
              borderRadius: 9,
              padding: 11,
            }}
          >
            <div style={{ fontSize: 10.5, color: colors.muted, fontFamily: fonts.mono, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {label}
            </div>
            <div style={{ ...statNumber, fontSize: 21, marginTop: 2 }}>{result[key] as number}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={sectionTitle}>Flags ({result.flags.length})</div>
        {result.flags.length === 0 && <div style={{ color: colors.good, fontSize: 14 }}>No issues detected.</div>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {result.flags.map((flag, i) => (
            <li
              key={i}
              style={{
                borderLeft: `3px solid ${severityColor[flag.severity]}`,
                padding: '8px 12px',
                marginBottom: 8,
                background: colors.bg,
                borderRadius: '0 6px 6px 0',
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  color: severityColor[flag.severity],
                  fontWeight: 600,
                  fontFamily: fonts.mono,
                  letterSpacing: '0.04em',
                  marginBottom: 2,
                }}
              >
                {flag.category} · {flag.severity}
              </div>
              <div style={{ fontSize: 13.5 }}>{flag.message}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
