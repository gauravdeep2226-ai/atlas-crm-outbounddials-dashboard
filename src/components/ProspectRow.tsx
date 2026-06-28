import { useEffect, useRef, useState } from 'react';
import type { Prospect, SaveState, Writable } from '../types';
import { DEAD_STATUSES, STATUS_COLOR, STATUS_OPTIONS, timezoneForCity } from '../constants';
import {
  dateTimeLocalToISO,
  dueLabel,
  formatPhone,
  formatZonedDate,
  formatZonedDateTime,
  isOverdue,
  isDueOrOverdue,
  num,
  telHref,
  zonedToDateTimeLocal,
} from '../utils';
import { FlagBadge, PriorityBadge, VerticalBadge } from './Badges';

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
  const [demoDate, setDemoDate] = useState(p.demo_date);
  const [nextAction, setNextAction] = useState(p.next_action);
  const editing = useRef(false);

  // Re-sync drafts when the underlying row changes from outside (reload / optimistic
  // merge), but not while the user is actively editing this row.
  useEffect(() => {
    if (!editing.current) {
      setNote(p.notes);
      setNextDate(p.next_date);
      setDemoDate(p.demo_date);
      setNextAction(p.next_action);
    }
  }, [p.notes, p.next_date, p.demo_date, p.next_action]);

  const dead = DEAD_STATUSES.has(p.status);
  const isDemo = p.status === 'Demo booked';
  const tz = timezoneForCity(p.city); // prospect's timezone — demo calendar + last-contact date
  const due = isDueOrOverdue(p.next_date);
  const overdue = isOverdue(p.next_date);
  const rating = num(p.rating);
  const reviews = num(p.review_count);

  // Changing status to "Demo booked" reveals the demo date/time picker by
  // auto-expanding the row. Leaving a date-bearing status clears its now-stale
  // date in the same write — callbacks live in next_date, demos in demo_date.
  const changeStatus = (v: string) => {
    const updates: Writable = { status: v };
    if (p.status === 'Callback' && p.next_date) updates.next_date = '';
    if (p.status === 'Demo booked' && p.demo_date) updates.demo_date = '';
    onSave(p.place_id, updates);
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

  // Demo bookings write to the dedicated demo_date column (not next_date). The
  // picker hands us an NDT wall-clock; store it as an absolute UTC instant so it
  // can't be reinterpreted by the sheet's timezone.
  const changeDemoDate = (wallClock: string) => {
    const iso = dateTimeLocalToISO(wallClock, tz);
    setDemoDate(iso);
    if (iso !== p.demo_date) onSave(p.place_id, { demo_date: iso });
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
            {rating > 0 && (
              <span className="meta tnum" title={`${reviews} reviews`}>
                ★ {rating.toFixed(1)} <span className="muted">({reviews})</span>
              </span>
            )}
            {p.city && <span className="meta muted">{p.city}</span>}
            {isDemo && p.demo_date ? (
              <span className="meta demo-chip">📅 Demo · {formatZonedDateTime(p.demo_date, tz)}</span>
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
                value={zonedToDateTimeLocal(demoDate, tz)}
                onChange={(e) => changeDemoDate(e.target.value)}
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
          {p.last_contact && (
            <div className="last-contact muted small">Last contact: {formatZonedDate(p.last_contact, tz)}</div>
          )}
        </div>
      )}
    </li>
  );
}
