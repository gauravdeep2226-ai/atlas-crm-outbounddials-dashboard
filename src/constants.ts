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

// Semantic color per status. green = progress/win, red = dead, amber = pending.
export const STATUS_COLOR: Record<string, string> = {
  'Not called': 'var(--dim)',
  'No answer': 'var(--amber)',
  Voicemail: 'var(--amber)',
  Reached: 'var(--green)',
  Callback: 'var(--accent)',
  'Demo booked': 'var(--green)',
  Won: 'var(--green)',
  Dead: 'var(--red)',
};

// Statuses that pull a business out of the active queue.
export const DEAD_STATUSES = new Set(['Dead']);

// ---------------------------------------------------------------------------
// Vertical badge colors — each distinct so they're scannable at a glance.
// Falls back to gray for any future vertical we don't know yet.
// ---------------------------------------------------------------------------
export const VERTICAL_COLOR: Record<string, string> = {
  Automotive: '#8b5cf6', // violet
  Plumbing: '#3b82f6', // blue (water)
  HVAC: '#06b6d4', // cyan (air)
  Electrical: '#f5a524', // amber (current)
  Renovation: '#f97316', // orange (build)
};

export function verticalColor(v: string): string {
  return VERTICAL_COLOR[v] ?? '#7c8696';
}

// ---------------------------------------------------------------------------
// Flag badge colors. DISQUALIFY/LOST = red, HOT-PAIN = green, others = amber.
// ---------------------------------------------------------------------------
export function flagColor(flag: string): string {
  if (flag === 'DISQUALIFY' || flag === 'LOST') return 'var(--red)';
  if (flag === 'HOT-PAIN') return 'var(--green)';
  return 'var(--amber)'; // BIG / FRANCHISE / VERIFY / anything else
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
