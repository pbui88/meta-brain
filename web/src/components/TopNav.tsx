import { Link, useLocation } from 'react-router-dom';
import { colors, fonts } from '../styles';

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/architect', label: 'Campaign Architect' },
  { to: '/bulk-generate', label: 'Generate Ads' },
  { to: '/research', label: 'Research Lab' },
  { to: '/competitors', label: 'Competitors' },
  { to: '/benchmarks', label: 'Patterns' },
  { to: '/compliance', label: 'Compliance' },
  { to: '/reports', label: 'Reports' },
];

export function TopNav() {
  const location = useLocation();

  return (
    <div
      style={{
        borderBottom: `1px solid ${colors.border}`,
        background: 'rgba(250, 246, 239, 0.85)',
        backdropFilter: 'blur(6px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: colors.primary,
              display: 'inline-block',
            }}
          />
          <span style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 19, color: colors.text }}>
            meta-brain
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 4 }}>
          {LINKS.map((l) => {
            const active =
              l.to === '/'
                ? location.pathname === '/' || location.pathname === ''
                : location.pathname === l.to || location.pathname.startsWith(`${l.to}/`);
            return (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  textDecoration: 'none',
                  fontFamily: fonts.mono,
                  fontSize: 11.5,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '7px 12px',
                  borderRadius: 7,
                  color: active ? '#fdf9f2' : colors.muted,
                  background: active ? colors.text : 'transparent',
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
