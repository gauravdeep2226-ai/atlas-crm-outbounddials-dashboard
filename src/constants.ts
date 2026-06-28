// ---------------------------------------------------------------------------
// Status options (the dropdown). Order = pipeline progression.
// ---------------------------------------------------------------------------
export const STATUS_OPTIONS = [
  'Not called',
  'No answer',
  'Voicemail',
  'Reached',
  'Callback',
  'Demo booked',
  'Won',
  'Dead',
] as const;

export type Status = (typeof STATUS_OPTIONS)[number];

// Semantic color per status, mapped to the strictly-scoped Atlas accents:
//   slate = neutral, gold = connected/scheduled, orange = money state, maroon = dead.
export const STATUS_COLOR: Record<string, string> = {
  'Not called': 'var(--dim)',
  'No answer': 'var(--dim)',
  Voicemail: 'var(--dim)',
  Reached: 'var(--gold)',
  Callback: 'var(--gold)',
  'Demo booked': 'var(--accent)',
  Won: 'var(--accent)',
  Dead: 'var(--maroon-ink)',
};

// Statuses that pull a business out of the active queue.
export const DEAD_STATUSES = new Set(['Dead']);

// Statuses for which next_date is meaningful (a callback reminder or a demo
// slot). Changing away from one of these clears next_date so stale dates don't
// linger on the row.
export const DATE_STATUSES = new Set(['Callback', 'Demo booked']);

// ---------------------------------------------------------------------------
// Vertical badge tints — muted, low-chroma tones drawn from the Atlas
// teal→gold→maroon spectrum. They stay quiet (category tags) so the bright
// reserved accents (orange/gold/maroon) keep their meaning. Unknown verticals
// fall back to neutral slate.
// ---------------------------------------------------------------------------
export const VERTICAL_COLOR: Record<string, string> = {
  Automotive: '#b0875a', // bronze
  Plumbing: '#6f97a8', // slate-blue (water)
  HVAC: '#5aa394', // muted teal (air)
  Electrical: '#d9a92e', // muted gold (current)
  Renovation: '#bd6f48', // terracotta (build)
};

export function verticalColor(v: string): string {
  return VERTICAL_COLOR[v] ?? '#8aa0a2';
}

// ---------------------------------------------------------------------------
// Flag badge colors, on the Atlas palette:
//   DISQUALIFY/LOST = maroon (negative), HOT-PAIN = gold (high-value emphasis),
//   BIG/FRANCHISE/VERIFY = slate (neutral informational).
// ---------------------------------------------------------------------------
export function flagColor(flag: string): string {
  if (flag === 'DISQUALIFY' || flag === 'LOST') return 'var(--maroon-ink)';
  if (flag === 'HOT-PAIN') return 'var(--gold)';
  return 'var(--dim)'; // BIG / FRANCHISE / VERIFY / anything else
}

// ---------------------------------------------------------------------------
// 90-day projection defaults. Overridden by the user's real logged rates once
// there's enough data (see Funnel). Honest about the small market.
// ---------------------------------------------------------------------------
export const PROJECTION_DEFAULTS = {
  connectRate: 0.3, // conversations / dials
  demoRate: 0.13, // demos / conversation
  closeRate: 0.2, // clients / demo
  netPerClient: 350, // $ recurring net per client / month
  dialsPerDay: 10,
  horizonDays: 90,
};

// Roughly how many callable businesses exist in the current market. Used only
// for an honest ceiling note — never for counts (those come from the live API).
export const MARKET_CEILING = 55;
