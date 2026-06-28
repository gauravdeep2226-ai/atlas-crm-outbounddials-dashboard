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

/** Value for an <input type="datetime-local">. Date-only stamps default to 9am.
 *  A full ISO instant (the backend serializes datetimes to UTC with a Z) is
 *  converted to local wall-clock so the picker matches the row chip. A naive
 *  "yyyy-mm-ddThh:mm" (our own optimistic write) is used as-is. */
export function toDateTimeLocal(s: string): string {
  if (!s) return '';
  if (s.includes('T')) {
    const hasZone = /[zZ]$|[+-]\d\d:?\d\d$/.test(s);
    if (hasZone) {
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) {
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
    }
    return s.slice(0, 16);
  }
  return s.slice(0, 10) + 'T09:00';
}

/** Friendly date (+ time if the stored value carries one): "Jul 2" / "Jul 2, 2:30 PM". */
export function formatDateTime(s: string): string {
  if (!s) return '';
  const hasTime = s.includes('T');
  const d = new Date(hasTime ? s : s.slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    ...(hasTime ? { hour: 'numeric', minute: '2-digit' } : {}),
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
