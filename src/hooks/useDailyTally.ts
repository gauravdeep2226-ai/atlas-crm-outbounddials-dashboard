import { useCallback, useEffect, useState } from 'react';
import type { DayTally } from '../types';
import { todayISO } from '../utils';

// The day's funnel counters live in the browser, NOT the Sheet. The Sheet is
// only the prospect pipeline; the funnel/projection is the user's personal tally.
const TODAY_KEY = 'atlas.tally.today';
const HISTORY_KEY = 'atlas.tally.history';

interface TodayState {
  date: string;
  dials: number;
  convos: number;
  demos: number;
}

function readToday(): TodayState {
  const today = todayISO();
  try {
    const raw = localStorage.getItem(TODAY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TodayState;
      // Roll over automatically at midnight — a new day starts fresh.
      if (parsed.date === today) return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { date: today, dials: 0, convos: 0, demos: 0 };
}

function readHistory(): DayTally[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as DayTally[];
  } catch {
    /* ignore */
  }
  return [];
}

export function useDailyTally() {
  const [today, setTodayState] = useState<TodayState>(readToday);
  const [history, setHistory] = useState<DayTally[]>(readHistory);

  useEffect(() => {
    localStorage.setItem(TODAY_KEY, JSON.stringify(today));
  }, [today]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const bump = useCallback((key: 'dials' | 'convos' | 'demos', delta: number) => {
    setTodayState((t) => {
      const date = todayISO();
      const base = t.date === date ? t : { date, dials: 0, convos: 0, demos: 0 };
      return { ...base, [key]: Math.max(0, base[key] + delta) };
    });
  }, []);

  // Snapshot today's tally into history (upsert by date). Counters stay put.
  const saveDay = useCallback(() => {
    setHistory((h) => {
      const rest = h.filter((d) => d.date !== today.date);
      const entry: DayTally = { date: today.date, dials: today.dials, convos: today.convos, demos: today.demos };
      return [entry, ...rest].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 90);
    });
  }, [today]);

  const resetToday = useCallback(() => {
    setTodayState({ date: todayISO(), dials: 0, convos: 0, demos: 0 });
  }, []);

  const savedToday = history.some((d) => d.date === today.date);

  return { today, history, bump, saveDay, resetToday, savedToday };
}
