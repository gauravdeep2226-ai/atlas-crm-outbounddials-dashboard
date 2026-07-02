import { useMemo } from 'react';
import type { Prospect } from '../types';
import { STATUS_OPTIONS } from '../constants';

export interface FilterState {
  province: string;
  city: string;
  vertical: string;
  priority: string;
  status: string;
  search: string;
  hideDead: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  province: '',
  city: '',
  vertical: '',
  priority: '',
  status: '',
  search: '',
  hideDead: true,
};

interface Props {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  rows: Prospect[];
  priorities: string[];
  resultCount: number;
  totalCount: number;
}

const uniqSorted = (values: string[]) => [...new Set(values.filter(Boolean))].sort();

export default function Filters({ filters, setFilters, rows, priorities, resultCount, totalCount }: Props) {
  // Cascading option lists, derived live from the rows (never hardcoded). Each
  // level is scoped by the level(s) above it: Province → City → Vertical.
  const provinces = useMemo(() => uniqSorted(rows.map((r) => r.province)), [rows]);

  const cities = useMemo(() => {
    const scope = filters.province ? rows.filter((r) => r.province === filters.province) : rows;
    return uniqSorted(scope.map((r) => r.city));
  }, [rows, filters.province]);

  const verticals = useMemo(() => {
    let scope = rows;
    if (filters.province) scope = scope.filter((r) => r.province === filters.province);
    if (filters.city) scope = scope.filter((r) => r.city === filters.city);
    return uniqSorted(scope.map((r) => r.vertical));
  }, [rows, filters.province, filters.city]);

  const set = (patch: Partial<FilterState>) => setFilters({ ...filters, ...patch });
  // Changing a parent level resets its dependent children, so a stale, now-invalid
  // selection can't silently hide the whole list.
  const changeProvince = (province: string) => setFilters({ ...filters, province, city: '', vertical: '' });
  const changeCity = (city: string) => setFilters({ ...filters, city, vertical: '' });

  const active =
    filters.province ||
    filters.city ||
    filters.vertical ||
    filters.priority ||
    filters.status ||
    filters.search ||
    !filters.hideDead;

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
        <select
          className="select"
          value={filters.province}
          onChange={(e) => changeProvince(e.target.value)}
          aria-label="Filter by province"
        >
          <option value="">All provinces</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={filters.city}
          onChange={(e) => changeCity(e.target.value)}
          aria-label="Filter by city"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={filters.vertical}
          onChange={(e) => set({ vertical: e.target.value })}
          aria-label="Filter by vertical"
        >
          <option value="">All verticals</option>
          {verticals.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={filters.priority}
          onChange={(e) => set({ priority: e.target.value })}
          aria-label="Filter by priority"
        >
          <option value="">All priority</option>
          {priorities.map((p) => (
            <option key={p} value={p}>
              Priority {p}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={filters.status}
          onChange={(e) => set({ status: e.target.value })}
          aria-label="Filter by status"
        >
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
