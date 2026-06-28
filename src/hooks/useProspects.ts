import { useCallback, useEffect, useRef, useState } from 'react';
import type { Prospect, SaveState, Writable } from '../types';
import { fetchProspects, updateProspect } from '../api';
import { todayISO } from '../utils';

interface State {
  rows: Prospect[];
  count: number;
  loading: boolean;
  error: string | null;
  lastLoaded: Date | null;
}

export function useProspects() {
  const [state, setState] = useState<State>({
    rows: [],
    count: 0,
    loading: true,
    error: null,
    lastLoaded: null,
  });
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async (signal?: AbortSignal) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchProspects(signal);
      if (signal?.aborted) return;
      setState({ rows: data.rows, count: data.count, loading: false, error: null, lastLoaded: new Date() });
    } catch (e) {
      if (signal?.aborted) return;
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const setSave = useCallback((id: string, s: SaveState) => {
    setSaveStates((prev) => ({ ...prev, [id]: s }));
    clearTimeout(timers.current[id]);
    if (s === 'saved') {
      timers.current[id] = setTimeout(() => {
        setSaveStates((prev) => ({ ...prev, [id]: 'idle' }));
      }, 1600);
    }
  }, []);

  /**
   * Optimistically apply `updates` to a row, then persist. On failure, revert
   * to the snapshot and flag the row as errored. Returns true on success.
   */
  const save = useCallback(
    async (place_id: string, updates: Writable): Promise<boolean> => {
      let snapshot: Prospect | undefined;

      setState((s) => ({
        ...s,
        rows: s.rows.map((r) => {
          if (r.place_id !== place_id) return r;
          snapshot = r;
          const next = { ...r, ...updates };
          // Mirror backend: stamp last_contact when status leaves "Not called".
          if (
            updates.status &&
            updates.status !== 'Not called' &&
            !r.last_contact &&
            updates.last_contact === undefined
          ) {
            next.last_contact = todayISO();
          }
          return next;
        }),
      }));

      setSave(place_id, 'saving');
      try {
        const res = await updateProspect(place_id, updates);
        // Merge whatever the backend actually applied (e.g. its real last_contact stamp).
        if (res.applied && typeof res.applied === 'object') {
          setState((s) => ({
            ...s,
            rows: s.rows.map((r) => (r.place_id === place_id ? { ...r, ...(res.applied as Partial<Prospect>) } : r)),
          }));
        }
        setSave(place_id, 'saved');
        return true;
      } catch (e) {
        // Revert the optimistic change.
        if (snapshot) {
          const snap = snapshot;
          setState((s) => ({ ...s, rows: s.rows.map((r) => (r.place_id === place_id ? snap : r)) }));
        }
        setSave(place_id, 'error');
        console.error('Write failed:', (e as Error).message);
        return false;
      }
    },
    [setSave],
  );

  return {
    rows: state.rows,
    count: state.count,
    loading: state.loading,
    error: state.error,
    lastLoaded: state.lastLoaded,
    saveStates,
    reload: () => load(),
    save,
  };
}
