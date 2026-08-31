import type { CategorizedAd, HookMatch, ImportedAdInput } from './types';

const HOOKS: HookMatch[] = [
  { label: 'Sell as-is, skip repairs', keywords: ['as-is', 'as is', 'skip repairs', 'no repairs'] },
  { label: 'Fast cash offer', keywords: ['cash offer', 'cash in', 'sell for cash'] },
  { label: 'Avoid showings/hassle', keywords: ['no showings', 'skip showings', 'avoid the hassle'] },
  { label: 'Fast/flexible closing', keywords: ['close in', 'fast close', 'flexible closing', 'close on your timeline'] },
  { label: 'No fees/commissions', keywords: ['no fees', 'no commission', 'zero fees'] },
  { label: 'Inherited property', keywords: ['inherited', 'inheritance'] },
  { label: 'Tired landlord', keywords: ['tired landlord', 'problem tenant', 'bad tenant'] },
];

const OFFERS: HookMatch[] = [
  { label: 'Cash offer', keywords: ['cash offer', 'cash in', 'all cash'] },
  { label: 'As-is purchase', keywords: ['as-is', 'as is', 'any condition'] },
  { label: 'Fast close', keywords: ['fast close', 'close in', 'quick close'] },
  { label: 'No fees', keywords: ['no fees', 'no commission'] },
];

const CONVERSION_KEYWORDS = ['get offer', 'get your offer', 'get a quote', 'sign up', 'apply now', 'contact us'];
const AWARENESS_KEYWORDS = ['learn more', 'see how', 'find out', 'discover'];

function matchFirst(text: string, matches: HookMatch[]): string | null {
  const lower = text.toLowerCase();
  for (const m of matches) {
    if (m.keywords.some((k) => lower.includes(k))) return m.label;
  }
  return null;
}

function guessFunnelStage(text: string, cta?: string): 'awareness' | 'consideration' | 'conversion' | null {
  const lower = `${text} ${cta || ''}`.toLowerCase();
  if (CONVERSION_KEYWORDS.some((k) => lower.includes(k))) return 'conversion';
  if (AWARENESS_KEYWORDS.some((k) => lower.includes(k))) return 'awareness';
  if (text) return 'consideration';
  return null;
}

function computeLongevity(start?: string, end?: string): number | null {
  if (!start) return null;
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Number.isFinite(days) && days >= 0 ? days : null;
}

export function categorizeAd(input: ImportedAdInput): CategorizedAd {
  const text = [input.primary_text, input.headline].filter(Boolean).join(' ');

  return {
    ...input,
    hook_text: matchFirst(text, HOOKS),
    offer_text: matchFirst(text, OFFERS),
    funnel_stage: guessFunnelStage(text, input.cta),
    longevity_days: computeLongevity(input.start_date, input.end_date),
  };
}
