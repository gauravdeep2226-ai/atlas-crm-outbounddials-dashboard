import type { Prospect } from './types';

/** Coerce a possibly-string numeric cell to a number (0 if blank/garbage). */
export function num(v: number | string | undefined | null): number {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Just the digits of a phone string, e.g. "+1 709-722-6888" -> "17097226888". */
export function phoneDigits(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

/** Pretty display, +1 stripped: "+1 709-722-6888" -> "(709) 722-6888". */
export function formatPhone(phone: string): string {
  let d = phoneDigits(phone);
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone || '—';
}

/** tel: href that keeps the country code so the dialer is unambiguous. */
export function telHref(phone: string): string {
  let d = phoneDigits(phone);
  if (d.length === 10) d = '1' + d;
  return `tel:+${d}`;
}

/** Local date as yyyy-mm-dd (matches the Sheet's date strings & <input type=date>). */
export function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

/** True if next_date is set and is today or earlier (a due/overdue callback). */
export function isDueOrOverdue(next_date: string, today = todayISO()): boolean {
  if (!next_date) return false;
  return next_date.slice(0, 10) <= today;
}

export function isOverdue(next_date: string, today = todayISO()): boolean {
  if (!next_date) return false;
  return next_date.slice(0, 10) < today;
}

/** Human label for a callback date relative to today. */
export function dueLabel(next_date: string, today = todayISO()): string {
  if (!next_date) return '';
  const d = next_date.slice(0, 10);
  if (d === today) return 'Today';
  if (d < today) {
    const days = daysBetween(d, today);
    return days === 1 ? '1 day overdue' : `${days} days overdue`;
  }
  const days = daysBetween(today, d);
  return days === 1 ? 'Tomorrow' : `in ${days} days`;
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime();
  return Math.round(ms / 86400000);
}

// ---------------------------------------------------------------------------
// Timezone-aware demo-date helpers. Demo dates are stored as absolute UTC
// instants (the backend round-trips an ISO ...Z faithfully), but the picker and
// chip operate in the prospect's local timezone (NDT for St. John's) so the
// time the user picks is the time they see — regardless of the device's clock.
// ---------------------------------------------------------------------------

const hasZoneInfo = (s: string) => /[zZ]|[+-]\d\d:?\d\d$/.test(s);

/** Offset (zone wall-clock minus UTC) in ms at a given instant, e.g. NDT = -2.5h. */
function zoneOffsetMs(utcMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(utcMs))) m[p.type] = p.value;
  const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
  return asUTC - utcMs;
}

/** Parts (year…minute) of an instant rendered in a timezone. */
function zonedParts(d: Date, timeZone: string): Record<string, string> {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(d)) m[p.type] = p.value;
  return m;
}

/** Stored value → "yyyy-mm-ddThh:mm" wall-clock in `timeZone` (for the picker). */
export function zonedToDateTimeLocal(value: string | null | undefined, timeZone: string): string {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';

  // No zone info: treat the wall-clock as already in the target zone.
  if (!hasZoneInfo(str)) {
    const naive = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(str);
    if (naive) return `${naive[1]}T${naive[2]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return `${str}T09:00`;
    return '';
  }
  // Absolute instant → render as wall-clock in the zone.
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return '';
  const p = zonedParts(d, timeZone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** "yyyy-mm-ddThh:mm" picked in `timeZone` → absolute UTC ISO instant (for writes). */
export function dateTimeLocalToISO(wallClock: string, timeZone: string): string {
  if (!wallClock) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(wallClock);
  if (!m) return '';
  const [, y, mo, d, h, mi] = m.map(Number);
  const asUTC = Date.UTC(y, mo - 1, d, h, mi); // wall-clock treated as if UTC
  const offset = zoneOffsetMs(asUTC, timeZone); // correct by the zone's offset
  return new Date(asUTC - offset).toISOString();
}

/** Friendly calendar date in `timeZone`, no time: "Jun 28, 2026". */
export function formatZonedDate(value: string | null | undefined, timeZone: string): string {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(str);
  // For a date-only value, anchor at noon UTC so the calendar date can't shift
  // when rendered in a timezone. Instants are parsed as-is.
  const d = new Date(hasZoneInfo(str) ? str : dateOnly ? `${str}T12:00:00Z` : str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleString('en-CA', { timeZone, year: 'numeric', month: 'short', day: 'numeric' });
}

/** Friendly chip label in `timeZone`: "Jun 29, 1:00 PM". */
export function formatZonedDateTime(value: string | null | undefined, timeZone: string): string {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(str);
  const d = new Date(hasZoneInfo(str) ? str : dateOnly ? `${str}T00:00:00` : str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleString('en-CA', {
    timeZone,
    month: 'short',
    day: 'numeric',
    ...(dateOnly ? {} : { hour: 'numeric', minute: '2-digit' }),
  });
}

const PRIORITY_RANK: Record<string, number> = { A: 0, B: 1, C: 2 };

/** Default sort: priority A→C, then score desc, then review_count desc. */
export function defaultSort(a: Prospect, b: Prospect): number {
  const pa = PRIORITY_RANK[a.priority] ?? 9;
  const pb = PRIORITY_RANK[b.priority] ?? 9;
  if (pa !== pb) return pa - pb;
  const sd = num(b.score) - num(a.score);
  if (sd !== 0) return sd;
  return num(b.review_count) - num(a.review_count);
}

export function pct(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n * 100)}%`;
}

export function money(n: number): string {
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
}
