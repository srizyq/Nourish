import { useState } from 'react';
import { round1 } from '../lib/format';
import { formatHourLabel } from '../lib/mealTime';
import LogItemRow from './LogItemRow';

// Pro users' hourly daily log, covering the full 12am–11pm day instead
// of only showing hours that have something logged in them (which read
// as basically empty for most of the day). Segments come from
// buildDayTimeline (lib/mealTime.js): real hours render as expandable
// cards identical in shape to the free-tier meal cards; empty stretches
// collapse into a single row that expands into individual empty-hour
// markers on tap, and collapses back on a second tap.
export default function HourlyTimeline({ segments, onDelete, onSave, onNavigateAdd, emptyMessage = 'Nothing logged today yet.' }) {
  const [openHours, setOpenHours] = useState({});
  const [openGaps, setOpenGaps] = useState({});
  const [expandedItemId, setExpandedItemId] = useState(null);

  // buildDayTimeline never returns an empty array — a day with nothing
  // logged is still one giant gap segment spanning all 24 hours. Render
  // the plain empty state instead of a single "12am – 12am" gap row,
  // which would be a confusing zero-width-looking range for what's
  // actually the entire day.
  const hasAnyLogged = segments.some(s => s.type === 'hour');
  if (!hasAnyLogged) {
    return (
      <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-hint)', fontSize: 13, background: 'var(--bg-subtle)', border: '1px dashed var(--border-strong)', borderRadius: 10 }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {segments.map(seg => (
        seg.type === 'hour' ? (
          <HourCard
            key={seg.hour}
            segment={seg}
            isOpen={!!openHours[seg.hour]}
            onToggle={() => setOpenHours(o => ({ ...o, [seg.hour]: !o[seg.hour] }))}
            expandedItemId={expandedItemId}
            onToggleItem={(id) => setExpandedItemId(prev => (prev === id ? null : id))}
            onDelete={onDelete}
            onSave={onSave}
            onNavigateAdd={onNavigateAdd}
          />
        ) : (
          <GapRow
            key={seg.id}
            segment={seg}
            isOpen={!!openGaps[seg.id]}
            onToggle={() => setOpenGaps(o => ({ ...o, [seg.id]: !o[seg.id] }))}
          />
        )
      ))}
    </div>
  );
}

function HourCard({ segment, isOpen, onToggle, expandedItemId, onToggleItem, onDelete, onSave, onNavigateAdd }) {
  const { hour, label, items } = segment;
  const total = Math.round(items.reduce((s, i) => s + i.cal, 0));
  const protein = round1(items.reduce((s, i) => s + i.protein, 0));
  const carbs = round1(items.reduce((s, i) => s + i.carbs, 0));
  const fat = round1(items.reduce((s, i) => s + i.fat, 0));

  return (
    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>{label}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>P {protein}g · C {carbs}g · F {fat}g</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{total} kcal</span>
          <span style={{ color: 'var(--text-hint)', fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
        </div>
      </button>
      {isOpen && (
        <div style={{ borderTop: '1px solid var(--border-default)' }}>
          {items.map(item => (
            <LogItemRow
              key={item.id}
              item={item}
              isExpanded={expandedItemId === item.id}
              onToggle={() => onToggleItem(item.id)}
              onDelete={() => onDelete(item.id)}
              onSave={async (fields) => { await onSave(item.id, fields); onToggleItem(item.id); }}
            />
          ))}
          <button onClick={() => onNavigateAdd(hour)} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--accent-dark)', fontSize: 13, cursor: 'pointer', padding: '10px 16px', textAlign: 'left', transition: 'color 0.15s' }} onMouseEnter={e => e.target.style.color = 'var(--accent)'} onMouseLeave={e => e.target.style.color = 'var(--accent-dark)'}>
            + Add food
          </button>
        </div>
      )}
    </div>
  );
}

function GapRow({ segment, isOpen, onToggle }) {
  return (
    <div style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border-default)', borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--text-hint)', fontSize: 12 }}>Nothing logged · {segment.label}</span>
        <span style={{ color: 'var(--text-hint)', fontSize: 11, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {isOpen && (
        <div style={{ borderTop: '1px solid var(--border-default)', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {segment.hours.map(h => (
            <div key={h} style={{ fontSize: 12, color: 'var(--text-hint)' }}>{formatHourLabel(h)} — nothing logged</div>
          ))}
        </div>
      )}
    </div>
  );
}
