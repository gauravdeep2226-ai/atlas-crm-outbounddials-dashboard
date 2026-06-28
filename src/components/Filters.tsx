import { STATUS_OPTIONS } from '../constants';

export interface FilterState {
  vertical: string;
  priority: string;
  status: string;
  search: string;
  hideDead: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  vertical: '',
  priority: '',
  status: '',
  search: '',
  hideDead: true,
};

interface Props {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  verticals: string[];
  priorities: string[];
  resultCount: number;
  totalCount: number;
}

export default function Filters({ filters, setFilters, verticals, priorities, resultCount, totalCount }: Props) {
  const set = (patch: Partial<FilterState>) => setFilters({ ...filters, ...patch });
  const active = filters.vertical || filters.priority || filters.status || filters.search || !filters.hideDead;

  return (
    <div className="filters">
      <div className="filters-search">
        <input
          type="search"
          className="input"
          placeholder="Search business name…"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          aria-label="Search business name"
        />
      </div>

      <div className="filters-row">
        <select className="select" value={filters.vertical} onChange={(e) => set({ vertical: e.target.value })} aria-label="Filter by vertical">
          <option value="">All verticals</option>
          {verticals.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select className="select" value={filters.priority} onChange={(e) => set({ priority: e.target.value })} aria-label="Filter by priority">
          <option value="">All priority</option>
          {priorities.map((p) => (
            <option key={p} value={p}>
              Priority {p}
            </option>
          ))}
        </select>

        <select className="select" value={filters.status} onChange={(e) => set({ status: e.target.value })} aria-label="Filter by status">
          <option value="">All status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-foot">
        <label className="check">
          <input type="checkbox" checked={filters.hideDead} onChange={(e) => set({ hideDead: e.target.checked })} />
          Hide dead
        </label>
        <span className="muted small tnum">
          {resultCount} of {totalCount}
        </span>
        {active && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
