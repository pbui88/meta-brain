import type { CSSProperties } from 'react';

export const colors = {
  border: '#dcdcdc',
  bg: '#fafafa',
  text: '#1a1a1a',
  muted: '#666',
  primary: '#1565c0',
  good: '#2e7d32',
  warn: '#ed6c02',
  bad: '#d32f2f',
};

export const card: CSSProperties = {
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: 16,
  background: '#fff',
};

export const label: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: colors.muted,
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
};

export const input: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  fontSize: 14,
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

export const sectionTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 12,
};

export const button = (variant: 'primary' | 'secondary' | 'danger' = 'primary'): CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 6,
  border: variant === 'secondary' ? `1px solid ${colors.border}` : 'none',
  background: variant === 'primary' ? colors.primary : variant === 'danger' ? colors.bad : '#fff',
  color: variant === 'secondary' ? colors.text : '#fff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
});

export const chip = (variant: 'good' | 'warn' | 'bad' | 'neutral'): CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  color: '#fff',
  background:
    variant === 'good' ? colors.good : variant === 'warn' ? colors.warn : variant === 'bad' ? colors.bad : '#999',
});
