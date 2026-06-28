import { flagColor, verticalColor } from '../constants';

export function VerticalBadge({ vertical }: { vertical: string }) {
  if (!vertical) return null;
  const c = verticalColor(vertical);
  return (
    <span className="badge" style={{ color: c, background: `color-mix(in srgb, ${c} 16%, transparent)`, borderColor: `color-mix(in srgb, ${c} 35%, transparent)` }}>
      {vertical}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  if (!priority) return null;
  const cls = priority === 'A' ? 'prio prio-a' : priority === 'B' ? 'prio prio-b' : 'prio prio-c';
  return <span className={cls} title={`Priority ${priority}`}>{priority}</span>;
}

export function FlagBadge({ flag }: { flag: string }) {
  if (!flag) return null;
  const c = flagColor(flag);
  return (
    <span className="badge flag" style={{ color: c, background: `color-mix(in srgb, ${c} 18%, transparent)`, borderColor: `color-mix(in srgb, ${c} 40%, transparent)` }}>
      {flag}
    </span>
  );
}
