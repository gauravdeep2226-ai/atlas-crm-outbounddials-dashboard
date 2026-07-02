// Row shape returned by the Apps Script backend. All values arrive as strings or
// numbers depending on the cell; we normalize the numeric-ish ones at read time.
export interface Prospect {
  business: string;
  owner_name: string;
  phone: string;
  vertical: string;
  city: string;
  province: string; // e.g. "NL"
  place_id: string; // unique key — used for React keys AND writes
  rating: number | string;
  review_count: number | string;
  score: number | string;
  priority: string; // "A" | "B" | "C"
  flag: string; // "" | DISQUALIFY | LOST | BIG | FRANCHISE | HOT-PAIN | VERIFY
  status: string; // defaults to "Not called"
  last_contact: string;
  next_action: string;
  next_date: string; // ISO yyyy-mm-dd — callback date for non-demo statuses
  demo_date: string; // ISO datetime — set only when status is "Demo booked"
  notes: string;
  call_log: string;
}

export interface GetResponse {
  ok: boolean;
  count: number;
  rows: Prospect[];
  error?: string;
}

// Only these fields are writable; the backend ignores anything else.
export type Writable = Partial<
  Pick<Prospect, 'status' | 'last_contact' | 'next_action' | 'next_date' | 'demo_date' | 'notes' | 'call_log'>
>;

export interface PostResponse {
  ok: boolean;
  place_id?: string;
  applied?: Record<string, unknown>;
  error?: string;
}

// Per-row write status for the optimistic-update UI.
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// A saved day's funnel tally (lives in localStorage, never the Sheet).
export interface DayTally {
  date: string; // yyyy-mm-dd
  dials: number;
  convos: number;
  demos: number;
}
