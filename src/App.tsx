import { useEffect, useMemo, useRef, useState } from 'react';
import { useProspects } from './hooks/useProspects';
import { DEAD_STATUSES } from './constants';
import { defaultSort, isDueOrOverdue } from './utils';
import Funnel from './components/Funnel';
import Filters, { EMPTY_FILTERS, type FilterState } from './components/Filters';
import ProspectList from './components/ProspectList';

const PRIORITY_ORDER = ['A', 'B', 'C'];
const PAGE_SIZE = 12; // one page of outbound dials

export default function App() {
  const { rows, count, loading, error, lastLoaded, saveStates, reload, save } = useProspects();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const listTopRef = useRef<HTMLElement>(null);

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
        if (filters.province && r.province !== filters.province) return false;
        if (filters.city && r.city !== filters.city) return false;
        if (filters.vertical && r.vertical !== filters.vertical) return false;
        if (filters.priority && r.priority !== filters.priority) return false;
        if (filters.status && r.status !== filters.status) return false;
        if (q && !r.business.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort(defaultSort);
  }, [rows, filters]);

  // Reset to the first page whenever the filtered set changes.
  useEffect(() => {
    setPage(0);
  }, [filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = safePage * PAGE_SIZE + pageRows.length;

  const goPage = (p: number) => {
    setPage(p);
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

          <section className="card" ref={listTopRef}>
            <div className="card-head">
              <h2>Call list</h2>
              {updated && <span className="muted small">updated {updated}</span>}
            </div>
            <Filters
              filters={filters}
              setFilters={setFilters}
              rows={rows}
              priorities={priorities}
              resultCount={filtered.length}
              totalCount={rows.length}
            />
            <ProspectList
              rows={pageRows}
              saveStates={saveStates}
              expandedId={expandedId}
              onToggle={toggle}
              onSave={save}
              emptyText="No businesses match these filters."
            />
            {pageCount > 1 && (
              <nav className="pager" aria-label="Call list pages">
                <button className="btn btn-sm" disabled={safePage === 0} onClick={() => goPage(safePage - 1)}>
                  ‹ Prev
                </button>
                <span className="pager-info tnum">
                  {rangeStart}–{rangeEnd} of {filtered.length}
                </span>
                <button
                  className="btn btn-sm"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => goPage(safePage + 1)}
                >
                  Next ›
                </button>
              </nav>
            )}
          </section>

          <footer className="foot muted small">
            The Atlas HQ Call Engine · data writes straight to the Google Sheet · {count} live prospects
          </footer>
        </main>
      )}
    </div>
  );
}
