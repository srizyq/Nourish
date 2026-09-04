import { todayLocalDate } from '../lib/patterns';

// Accent is deliberately a literal hex, not var(--accent) — it's used
// below with a string-concatenated alpha suffix (C.green + '50'), which
// only works with an actual hex value, not a CSS custom property
// reference. It's fine because accent is the same hex in both themes by
// design (see index.css) — only bg/border/text below need var()s.
const C = {
  green: '#8fbc8f',
};

// How "full" a day looks in the calendar — calories logged as a share of
// the calorie target (capped at 100%, since the point is showing progress
// toward the goal, not how far over it someone went). With no target set,
// any logging at all just shows as full.
function dayFillPct(day, calorieTarget) {
  if (!day || !day.calories) return 0;
  if (!calorieTarget) return day.loggedMeals > 0 ? 100 : 0;
  return Math.min(100, Math.round((day.calories / calorieTarget) * 100));
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Month calendar — each day cell fills up (bottom-to-top) based on how much
// was logged that day relative to the calorie target. Shared between the
// Progress page and the Dashboard so both stay visually in sync.
export default function LogCalendar({ month, byDate, calorieTarget, loading, onPrevMonth, onNextMonth, canGoNext, onSelectDay }) {
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstOfMonth = new Date(year, monthIdx, 1);
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();
  const monthLabel = firstOfMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  const today = todayLocalDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(todayLocalDate(new Date(year, monthIdx, day)));

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Logging calendar</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Each day fills up the more you log toward your calorie target</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onPrevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, display: 'flex' }} aria-label="Previous month">
            <i className="ti ti-chevron-left" />
          </button>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 110, textAlign: 'center' }}>{monthLabel}</div>
          <button onClick={onNextMonth} disabled={!canGoNext} style={{ background: 'none', border: 'none', color: canGoNext ? 'var(--text-muted)' : 'var(--text-faint, #2a2a2a)', cursor: canGoNext ? 'pointer' : 'default', fontSize: 16, display: 'flex' }} aria-label="Next month">
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {WEEKDAY_LABELS.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} />;
          const day = byDate.get(dateStr);
          const pct = dayFillPct(day, calorieTarget);
          const isToday = dateStr === today;
          const isFuture = dateStr > today;
          return (
            <div
              key={dateStr}
              onClick={() => !isFuture && onSelectDay(dateStr)}
              title={day?.calories ? `${Math.round(day.calories)} kcal logged` : 'Nothing logged'}
              style={{
                position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden',
                background: 'var(--bg-subtle)', border: `1px solid ${isToday ? C.green : 'var(--border-default)'}`,
                cursor: isFuture ? 'default' : 'pointer', opacity: isFuture ? 0.35 : 1,
              }}
            >
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${pct}%`, background: C.green + '50', transition: 'height 0.4s ease' }} />
              <div style={{ position: 'relative', fontSize: 10, color: pct > 55 ? 'var(--text-primary)' : 'var(--text-muted)', padding: 3 }}>{Number(dateStr.slice(-2))}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
