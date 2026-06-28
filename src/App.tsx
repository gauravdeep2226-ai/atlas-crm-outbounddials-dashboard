import { useMemo, useState } from 'react';
import { useProspects } from './hooks/useProspects';
import { DEAD_STATUSES } from './constants';
import { defaultSort, isDueOrOverdue } from './utils';
import Funnel from './components/Funnel';
import Filters, { EMPTY_FILTERS, type FilterState } from './components/Filters';
import ProspectList from './components/ProspectList';

const PRIORITY_ORDER = ['A', 'B', 'C'];

export default function App() {
  const { rows, count, loading, error, lastLoaded, saveStates, reload, save } = useProspects();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const verticals = useMemo(
    () => [...new Set(rows.map((r) => r.vertical).filter(Boolean))].sort(),
    [rows],
  );
  const priorities = useMemo(() => {
    const present = new Set(rows.map((r) => r.priority).filter(Boolean));
    return PRIORITY_ORDER.filter((p) => present.has(p));
  }, [rows]);

  // Due/overdue callbacks — call these before fresh dials.
  const callbacks = useMemo(
    () =>
      rows
        .filter((r) => !DEAD_STATUSES.has(r.status) && isDueOrOverdue(r.next_date))
        .sort((a, b) => (a.next_date < b.next_date ? -1 : a.next_date > b.next_date ? 1 : 0)),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filters.hideDead && DEAD_STATUSES.has(r.status)) return false;
        if (filters.vertical && r.vertical !== filters.vertical) return false;
        if (filters.priority && r.priority !== filters.priority) return false;
        if (filters.status && r.status !== filters.status) return false;
        if (q && !r.business.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort(defaultSort);
  }, [rows, filters]);

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  const updated = lastLoaded
    ? lastLoaded.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div className="brand-text">
            <h1>Call Engine</h1>
            <span className="muted small">The Atlas HQ · St. John&rsquo;s outbound</span>
          </div>
        </div>
        <div className="topbar-right">
          <div className="livecount">
            <span className="livecount-num tnum">{loading && rows.length === 0 ? '…' : count}</span>
            <span className="livecount-label">prospects</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={reload} disabled={loading} title="Reload from the Sheet">
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {error && (
        <div className="banner banner-error" role="alert">
          <strong>Couldn&rsquo;t reach the backend.</strong>
          <span>{error}</span>
          <button className="btn btn-sm" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {loading && rows.length === 0 && !error ? (
        <div className="loading">
          <div className="spinner" aria-hidden />
          <p>Loading prospects…</p>
        </div>
      ) : (
        <main className="main">
          <Funnel />

          {callbacks.length > 0 && (
            <section className="card">
              <div className="card-head">
                <h2>Today&rsquo;s callbacks</h2>
                <span className="count-chip tnum">{callbacks.length}</span>
              </div>
              <p className="muted small section-sub">Due or overdue — clear these before fresh dials.</p>
              <ProspectList
                rows={callbacks}
                saveStates={saveStates}
                expandedId={expandedId}
                onToggle={toggle}
                onSave={save}
              />
            </section>
          )}

          <section className="card">
            <div className="card-head">
              <h2>Call list</h2>
              {updated && <span className="muted small">updated {updated}</span>}
            </div>
            <Filters
              filters={filters}
              setFilters={setFilters}
              verticals={verticals}
              priorities={priorities}
              resultCount={filtered.length}
              totalCount={rows.length}
            />
            <ProspectList
              rows={filtered}
              saveStates={saveStates}
              expandedId={expandedId}
              onToggle={toggle}
              onSave={save}
              emptyText="No businesses match these filters."
            />
          </section>

          <footer className="foot muted small">
            The Atlas HQ Call Engine · data writes straight to the Google Sheet · {count} live prospects
          </footer>
        </main>
      )}
    </div>
  );
}
