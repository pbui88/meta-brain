import type { CSSProperties } from 'react';

export const fonts = {
  display: "'Fraunces', ui-serif, Georgia, serif",
  body: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
};

export const colors = {
  border: '#e4dccb',
  borderStrong: '#d3c7a9',
  bg: '#f1ead9',
  paper: '#ffffff',
  text: '#211d18',
  muted: '#7a7360',
  primary: '#b6502f',
  primaryDark: '#8f3c22',
  good: '#33553f',
  goodSoft: '#e5ede5',
  warn: '#a1731f',
  warnSoft: '#f4ead4',
  bad: '#a13a2f',
  badSoft: '#f5e2dc',
};

export const page: CSSProperties = {
  fontFamily: fonts.body,
  color: colors.text,
  padding: '32px 32px 64px',
  maxWidth: 1180,
  margin: '0 auto',
};

export const pageTitle: CSSProperties = {
  fontFamily: fonts.display,
  fontWeight: 600,
  fontSize: 34,
  letterSpacing: '-0.01em',
  margin: '2px 0 4px',
};

export const eyebrow: CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.primary,
};

export const card: CSSProperties = {
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  padding: 20,
  background: colors.paper,
};

export const label: CSSProperties = {
  display: 'block',
  fontFamily: fonts.mono,
  fontSize: 11,
  fontWeight: 500,
  color: colors.muted,
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

export const input: CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 14,
  boxSizing: 'border-box',
  fontFamily: fonts.body,
  background: '#fffdf9',
  color: colors.text,
};

export const sectionTitle: CSSProperties = {
  fontFamily: fonts.display,
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 14,
  letterSpacing: '-0.005em',
};

export const statNumber: CSSProperties = {
  fontFamily: fonts.mono,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
};

export const divider: CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${colors.border}`,
  margin: '16px 0',
};

export const button = (
  variant: 'primary' | 'secondary' | 'danger' = 'primary',
  disabled = false
): CSSProperties => ({
  padding: '9px 16px',
  borderRadius: 8,
  border: variant === 'secondary' ? `1px solid ${colors.borderStrong}` : 'none',
  background: variant === 'primary' ? colors.text : variant === 'danger' ? colors.bad : colors.paper,
  color: variant === 'secondary' ? colors.text : '#fdf9f2',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: fonts.body,
  fontSize: 13.5,
  fontWeight: 600,
  opacity: disabled ? 0.4 : 1,
  transition: 'opacity 0.15s ease, transform 0.1s ease',
});

export const chip = (variant: 'good' | 'warn' | 'bad' | 'neutral'): CSSProperties => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 999,
  fontFamily: fonts.mono,
  fontSize: 10.5,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color:
    variant === 'good'
      ? colors.good
      : variant === 'warn'
        ? colors.warn
        : variant === 'bad'
          ? colors.bad
          : colors.muted,
  background:
    variant === 'good'
      ? colors.goodSoft
      : variant === 'warn'
        ? colors.warnSoft
        : variant === 'bad'
          ? colors.badSoft
          : colors.bg,
});
