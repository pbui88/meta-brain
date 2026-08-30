import type { ScoreResult } from './types';

const SUB_SCORES: Array<{ key: keyof ScoreResult; label: string }> = [
  { key: 'housingScore', label: 'Housing Compliance' },
  { key: 'creativeScore', label: 'Creative' },
  { key: 'destinationScore', label: 'Destination' },
  { key: 'trackingScore', label: 'Tracking' },
  { key: 'algorithmScore', label: 'Algorithm Fit' },
];

const severityColor: Record<string, string> = {
  high: '#d32f2f',
  medium: '#ed6c02',
  low: '#0288d1',
};

export function ScoreCard({ result }: { result: ScoreResult }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: '#666' }}>Total Score</div>
        <div style={{ fontSize: 48, fontWeight: 700 }}>{result.totalScore}</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {SUB_SCORES.map(({ key, label }) => (
          <div
            key={key}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{result[key] as number}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Flags ({result.flags.length})
        </div>
        {result.flags.length === 0 && (
          <div style={{ color: '#2e7d32' }}>No issues detected.</div>
        )}
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
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: severityColor[flag.severity] }}>
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
