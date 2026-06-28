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

// ---------------------------------------------------------------------------
// Calendar timezone. Demo dates are stored as absolute UTC instants but the
// picker/chip operate in the prospect's local timezone. The current market is
// all Newfoundland (NDT/NST), so the default is St. John's. As we expand into
// new cities, add city → IANA-zone entries here (e.g. 'Halifax':
// 'America/Halifax') and the demo calendar follows automatically.
// ---------------------------------------------------------------------------
export const DEFAULT_TIMEZONE = 'America/St_Johns';

export const CITY_TIMEZONE: Record<string, string> = {
  // 'Halifax': 'America/Halifax',
  // 'Toronto': 'America/Toronto',
};

export function timezoneForCity(city: string): string {
  return CITY_TIMEZONE[city] ?? DEFAULT_TIMEZONE;
}

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
