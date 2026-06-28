import { useMemo } from 'react';
import { useDailyTally } from '../hooks/useDailyTally';
import { MARKET_CEILING, PROJECTION_DEFAULTS } from '../constants';
import { money, pct } from '../utils';

interface CounterProps {
  label: string;
  value: number;
  onBump: (delta: number) => void;
  accent?: boolean;
}

function Counter({ label, value, onBump, accent }: CounterProps) {
  return (
    <div className={'counter' + (accent ? ' counter-accent' : '')}>
      <div className="counter-label">{label}</div>
      <div className="counter-value tnum">{value}</div>
      <div className="counter-btns">
        <button className="cbtn" aria-label={`Decrease ${label}`} onClick={() => onBump(-1)}>
          −
        </button>
        <button className="cbtn cbtn-plus" aria-label={`Increase ${label}`} onClick={() => onBump(1)}>
          +
        </button>
      </div>
    </div>
  );
}

export default function Funnel() {
  const { today, history, bump, saveDay, resetToday, savedToday } = useDailyTally();

  // Blended rates across every logged day (today's live counts override its row).
  const agg = useMemo(() => {
    const byDate = new Map<string, { dials: number; convos: number; demos: number }>();
    for (const d of history) byDate.set(d.date, d);
    byDate.set(today.date, { dials: today.dials, convos: today.convos, demos: today.demos });
    return [...byDate.values()].reduce(
      (a, d) => ({ dials: a.dials + d.dials, convos: a.convos + d.convos, demos: a.demos + d.demos }),
      { dials: 0, convos: 0, demos: 0 },
    );
  }, [history, today]);

  // Today's live rates (what the funnel shows up top).
  const connectToday = today.dials > 0 ? today.convos / today.dials : null;
  const demoToday = today.convos > 0 ? today.demos / today.convos : null;

  // Projection uses real blended rates where we have them, else the defaults.
  const connectRate = agg.dials > 0 ? agg.convos / agg.dials : PROJECTION_DEFAULTS.connectRate;
  const demoRate = agg.convos > 0 ? agg.demos / agg.convos : PROJECTION_DEFAULTS.demoRate;
  const closeRate = PROJECTION_DEFAULTS.closeRate; // no close data tracked yet
  const usingLive = agg.dials > 0;

  const projDials = PROJECTION_DEFAULTS.dialsPerDay * PROJECTION_DEFAULTS.horizonDays;
  const projConvos = projDials * connectRate;
  const projDemos = projConvos * demoRate;
  const projClients = projDemos * closeRate;
  const netPerMonth = projClients * PROJECTION_DEFAULTS.netPerClient;
  const nearCeiling = projClients >= MARKET_CEILING * 0.13; // ~7 of ~55

  return (
    <section className="card funnel">
      <div className="card-head">
        <h2>Today&rsquo;s funnel</h2>
        <span className="muted small">{today.date}</span>
      </div>

      <div className="counters">
        <Counter label="Dials" value={today.dials} onBump={(d) => bump('dials', d)} accent />
        <Counter label="Conversations" value={today.convos} onBump={(d) => bump('convos', d)} />
        <Counter label="Demos" value={today.demos} onBump={(d) => bump('demos', d)} />
      </div>

      <div className="rates">
        <div className="rate">
          <span className="rate-label">Connect</span>
          <span className="rate-val tnum">{connectToday === null ? '—' : pct(connectToday)}</span>
          <span className="rate-sub tnum">
            {today.convos}/{today.dials}
          </span>
        </div>
        <div className="rate">
          <span className="rate-label">Demo</span>
          <span className="rate-val tnum">{demoToday === null ? '—' : pct(demoToday)}</span>
          <span className="rate-sub tnum">
            {today.demos}/{today.convos}
          </span>
        </div>
      </div>

      <div className="funnel-actions">
        <button className="btn btn-primary" onClick={saveDay}>
          {savedToday ? 'Update saved day ✓' : 'Save day'}
        </button>
        <button className="btn btn-ghost" onClick={resetToday}>
          Reset
        </button>
        {history.length > 0 && <span className="muted small">{history.length} day(s) logged</span>}
      </div>

      <div className="projection">
        <div className="proj-head">
          <h3>90-day projection</h3>
          <span className={'tag ' + (usingLive ? 'tag-live' : 'tag-default')}>
            {usingLive ? 'your logged rates' : 'starter assumptions'}
          </span>
        </div>
        <div className="proj-grid">
          <div className="proj-stat">
            <div className="proj-num tnum">{projClients.toFixed(1)}</div>
            <div className="proj-cap">clients projected</div>
          </div>
          <div className="proj-stat">
            <div className="proj-num tnum">{money(netPerMonth)}</div>
            <div className="proj-cap">est. net / month</div>
          </div>
        </div>
        <div className="proj-assumptions tnum">
          {PROJECTION_DEFAULTS.dialsPerDay} dials/day · connect {pct(connectRate)} · demo {pct(demoRate)} · close{' '}
          {pct(closeRate)} · {money(PROJECTION_DEFAULTS.netPerClient)}/client
        </div>
        <p className="proj-note">
          Market &asymp; {MARKET_CEILING} callable businesses.{' '}
          {nearCeiling
            ? 'You’re projecting near the ceiling — past ~8 closes, growth is referrals + new verticals, not more dials.'
            : 'Past ~8 closes, growth is referrals + new verticals, not more dials.'}
        </p>
      </div>
    </section>
  );
}
