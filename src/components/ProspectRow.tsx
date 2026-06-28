import { useEffect, useRef, useState } from 'react';
import type { Prospect, SaveState, Writable } from '../types';
import { DEAD_STATUSES, STATUS_COLOR, STATUS_OPTIONS } from '../constants';
import { dueLabel, formatDateTime, formatPhone, isOverdue, isDueOrOverdue, num, telHref, toDateTimeLocal } from '../utils';
import { FlagBadge, PriorityBadge, VerticalBadge } from './Badges';

function PersonIcon() {
  return (
    <svg className="owner-ico" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 1.4c-3.1 0-5.2 1.6-5.2 3.3 0 .7.5 1.3 1.2 1.3h8c.7 0 1.2-.6 1.2-1.3 0-1.7-2.1-3.3-5.2-3.3Z"
      />
    </svg>
  );
}

interface Props {
  p: Prospect;
  saveState: SaveState;
  expanded: boolean;
  onToggle: () => void;
  onSave: (place_id: string, updates: Writable) => Promise<boolean>;
}

function SavePill({ state }: { state: SaveState }) {
  if (state === 'saving') return <span className="pill pill-saving">saving…</span>;
  if (state === 'saved') return <span className="pill pill-saved">saved ✓</span>;
  if (state === 'error') return <span className="pill pill-error">save failed — retry</span>;
  return null;
}

export default function ProspectRow({ p, saveState, expanded, onToggle, onSave }: Props) {
  const [note, setNote] = useState(p.notes);
  const [nextDate, setNextDate] = useState(p.next_date);
  const [nextAction, setNextAction] = useState(p.next_action);
  const editing = useRef(false);

  // Re-sync drafts when the underlying row changes from outside (reload / optimistic
  // merge), but not while the user is actively editing this row.
  useEffect(() => {
    if (!editing.current) {
      setNote(p.notes);
      setNextDate(p.next_date);
      setNextAction(p.next_action);
    }
  }, [p.notes, p.next_date, p.next_action]);

  const dead = DEAD_STATUSES.has(p.status);
  const isDemo = p.status === 'Demo booked';
  const due = isDueOrOverdue(p.next_date);
  const overdue = isOverdue(p.next_date);
  const rating = num(p.rating);
  const reviews = num(p.review_count);
  const owner = p.owner_name && p.owner_name !== 'Unknown' ? p.owner_name : '—';

  // Changing status to "Demo booked" reveals the demo date/time picker by
  // auto-expanding the row.
  const changeStatus = (v: string) => {
    onSave(p.place_id, { status: v });
    if (v === 'Demo booked' && !expanded) onToggle();
  };

  const commitNote = () => {
    editing.current = false;
    if (note !== p.notes) onSave(p.place_id, { notes: note });
  };

  const commitNextAction = () => {
    editing.current = false;
    if (nextAction !== p.next_action) onSave(p.place_id, { next_action: nextAction });
  };

  const changeDate = (v: string) => {
    setNextDate(v);
    if (v !== p.next_date) onSave(p.place_id, { next_date: v });
  };

  return (
    <li className={'row' + (dead ? ' is-dead' : '') + (expanded ? ' is-open' : '')}>
      <div className="row-main">
        <button className="row-expand" onClick={onToggle} aria-expanded={expanded} aria-label={expanded ? 'Collapse' : 'Expand'}>
          <span className={'chev' + (expanded ? ' chev-open' : '')}>›</span>
        </button>

        <div className="row-body" onClick={onToggle}>
          <div className="row-top">
            <span className="biz">{p.business}</span>
            <PriorityBadge priority={p.priority} />
            <VerticalBadge vertical={p.vertical} />
            <FlagBadge flag={p.flag} />
          </div>
          <div className="row-meta">
            <span className="meta owner" title="Owner">
              <PersonIcon />
              {owner}
            </span>
            {rating > 0 && (
              <span className="meta tnum" title={`${reviews} reviews`}>
                ★ {rating.toFixed(1)} <span className="muted">({reviews})</span>
              </span>
            )}
            {p.city && <span className="meta muted">{p.city}</span>}
            {isDemo && p.next_date ? (
              <span className="meta demo-chip">📅 Demo · {formatDateTime(p.next_date)}</span>
            ) : p.next_date ? (
              <span className={'meta due' + (overdue ? ' due-over' : '')}>↻ {dueLabel(p.next_date)}</span>
            ) : null}
          </div>
        </div>

        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <a className="call" href={telHref(p.phone)} aria-label={`Call ${p.business}`}>
            <span className="call-ico">📞</span>
            <span className="call-num tnum">{formatPhone(p.phone)}</span>
          </a>
          <div className="status-wrap">
            <select
              className="status-select"
              value={STATUS_OPTIONS.includes(p.status as never) ? p.status : 'Not called'}
              onChange={(e) => changeStatus(e.target.value)}
              style={{ color: STATUS_COLOR[p.status] ?? 'var(--text)' }}
              aria-label={`Status for ${p.business}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <SavePill state={saveState} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="row-edit">
          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              className="textarea"
              rows={2}
              placeholder="What happened on the call…"
              value={note}
              onFocus={() => (editing.current = true)}
              onChange={(e) => setNote(e.target.value)}
              onBlur={commitNote}
            />
          </label>
          <label className="field">
            <span className="field-label">Next action</span>
            <input
              className="input"
              placeholder="e.g. follow up, send pricing"
              value={nextAction}
              onFocus={() => (editing.current = true)}
              onChange={(e) => setNextAction(e.target.value)}
              onBlur={commitNextAction}
            />
          </label>
          {isDemo ? (
            <label className="field field-demo">
              <span className="field-label field-label-demo">Demo date</span>
              <input
                className="input"
                type="datetime-local"
                value={toDateTimeLocal(nextDate)}
                onChange={(e) => changeDate(e.target.value)}
              />
            </label>
          ) : (
            <label className="field">
              <span className="field-label">Callback date {due && <em className="due-tag">due</em>}</span>
              <input
                className="input"
                type="date"
                value={nextDate.slice(0, 10)}
                onChange={(e) => changeDate(e.target.value)}
              />
            </label>
          )}
          {p.last_contact && <div className="last-contact muted small">Last contact: {p.last_contact}</div>}
        </div>
      )}
    </li>
  );
}
