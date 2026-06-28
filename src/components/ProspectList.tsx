import type { Prospect, SaveState, Writable } from '../types';
import ProspectRow from './ProspectRow';

interface Props {
  rows: Prospect[];
  saveStates: Record<string, SaveState>;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onSave: (place_id: string, updates: Writable) => Promise<boolean>;
  emptyText?: string;
}

export default function ProspectList({ rows, saveStates, expandedId, onToggle, onSave, emptyText }: Props) {
  if (rows.length === 0) {
    return <div className="empty muted">{emptyText ?? 'Nothing here.'}</div>;
  }
  return (
    <ul className="list">
      {rows.map((p) => (
        <ProspectRow
          key={p.place_id}
          p={p}
          saveState={saveStates[p.place_id] ?? 'idle'}
          expanded={expandedId === p.place_id}
          onToggle={() => onToggle(p.place_id)}
          onSave={onSave}
        />
      ))}
    </ul>
  );
}
