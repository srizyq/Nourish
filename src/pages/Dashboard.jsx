// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useFoodLogs } from '../hooks/useFoodLogs';
import { useCheckins } from '../hooks/useCheckins';
import { useHistory } from '../hooks/useHistory';
import { useWeightLogs } from '../hooks/useWeightLogs';
import { useAdaptiveTarget } from '../hooks/useAdaptiveTarget';
import { useFavouriteFoods } from '../hooks/useFavouriteFoods';
import { todayLocalDate, dateNDaysAgo, dateRange, generateInsights, computeStreak } from '../lib/patterns';
import { goalMacroSplits, buildTargets } from '../lib/calorieTargets';
import { getCategoryStyle } from '../lib/foodCategories';
import AppNav from '../components/AppNav';
import LogItemRow from '../components/LogItemRow';
import LogCalendar from '../components/LogCalendar';
import HourlyTimeline from '../components/HourlyTimeline';
import { round1 } from '../lib/format';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// Chart.js renders to canvas, which can't resolve CSS custom properties —
// see the note in WeightCard below. Accent/water-blue/ai-purple are the
// same hex in both themes by design, so hardcoding them here is correct,
// not a theming gap.
const ACCENT = '#8fbc8f';
const WATER_BLUE = '#6aabcf';
const AI_PURPLE = '#9f97e8';

// ─── Calorie hero — real weekly/monthly/quarterly trend, no decorative
// elements without real data behind them (no fake "uncertainty band" —
// this is a chart of actual logged calories, not an estimate). ──────────
const CHART_RANGES = [{ id: '1W', days: 7 }, { id: '1M', days: 30 }, { id: '3M', days: 90 }];

function CalorieHero({ consumed, target, chartDays, chartRange, setChartRange, onClick }) {
  const max = Math.max(target, ...chartDays.map(d => d.calories), 1);
  const min = Math.min(...chartDays.map(d => d.calories), target);
  const span = max - min || 1;
  const norm = (v) => 70 - ((v - min) / span) * 60 - 5;
  const w = 600;
  const points = chartDays.map((d, i) => [
    (i / Math.max(1, chartDays.length - 1)) * w,
    norm(d.calories),
  ]);
  const linePts = points.map(p => p.join(',')).join(' ');
  const areaPts = `0,70 ${linePts} ${w},70`;
  const showDots = chartDays.length <= 10;

  // A handful of evenly-spaced labels regardless of range, so 90 days
  // doesn't cram 90 labels under the axis.
  const labelCount = Math.min(chartDays.length, chartRange === '1W' ? 7 : 5);
  const labelStep = Math.max(1, Math.floor((chartDays.length - 1) / (labelCount - 1)));
  const labelIdxs = new Set();
  for (let i = 0; i < chartDays.length; i += labelStep) labelIdxs.add(i);
  labelIdxs.add(chartDays.length - 1);

  return (
    <div style={{ border: '1px solid var(--border-strong)', borderRadius: 16, padding: 20, cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>TODAY</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 34, fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(consumed).toLocaleString()}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>/ {target.toLocaleString()} kcal</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>REMAINING</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
            {round1(Math.max(0, target - consumed))}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} 78`} style={{ width: '100%', height: 110, marginTop: 10 }} preserveAspectRatio="none">
        <polygon points={areaPts} fill="var(--accent)" opacity="0.08" />
        <polyline points={linePts} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {showDots && points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 4 : 2.5} fill={i === points.length - 1 ? 'var(--accent)' : 'var(--bg-card)'} stroke="var(--accent)" strokeWidth="1.5" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }} onClick={e => e.stopPropagation()}>
        {chartDays.map((d, i) => (
          <span key={d.date} style={{ fontSize: 10, color: 'var(--text-hint)', visibility: labelIdxs.has(i) ? 'visible' : 'hidden' }}>
            {chartRange === '1W'
              ? new Date(d.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short' })
              : new Date(d.date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
          </span>
        ))}
      </div>

      <div onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', gap: 2, background: 'var(--pill-track)', borderRadius: 99, padding: 3 }}>
        {CHART_RANGES.map(r => (
          <button
            key={r.id}
            onClick={() => setChartRange(r.id)}
            style={{
              padding: '6px 14px', borderRadius: 99, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              background: chartRange === r.id ? 'var(--pill-bg)' : 'transparent',
              color: chartRange === r.id ? 'var(--pill-text)' : 'var(--text-muted)',
            }}
          >
            {r.id}
          </button>
        ))}
      </div>
    </div>
  );
}

function MacroCell({ label, value, target, color }) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color }}>
        {round1(value)}<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>g / {target}g</span>
      </div>
    </div>
  );
}

// ─── Favourites — real starred foods with a real quick-add, same "always
// log the default 1 serving" behaviour as the Food Search quick-add
// button (Phase 4), not decorative. Nothing renders if there are none
// yet, rather than showing empty/fake placeholders. ─────────────────────
function FavouritesRow({ favourites, onQuickAdd }) {
  const [addedId, setAddedId] = useState(null);
  if (!favourites.length) return null;

  function handleAdd(fav) {
    const style = getCategoryStyle({ name: fav.name });
    onQuickAdd(fav);
    setAddedId(fav.id);
    setTimeout(() => setAddedId(prev => (prev === fav.id ? null : prev)), 1100);
    return style;
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.04em' }}>FAVOURITES</div>
      <div style={{ display: 'flex', gap: 18, overflowX: 'auto' }}>
        {favourites.map(fav => {
          const style = getCategoryStyle({ name: fav.name });
          const justAdded = addedId === fav.id;
          return (
            <div key={fav.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 48, height: 48 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: style.color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: style.color }}>
                  <i className={`ti ${style.icon}`} />
                </div>
                <button
                  onClick={() => handleAdd(fav)}
                  disabled={justAdded}
                  title={`Quick add — 1 serving`}
                  style={{
                    position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%',
                    background: justAdded ? 'var(--accent-bg)' : 'var(--accent)', border: `2px solid ${justAdded ? 'var(--accent-border)' : 'var(--bg-primary)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: justAdded ? 'default' : 'pointer', padding: 0,
                  }}
                >
                  <i className={`ti ${justAdded ? 'ti-check' : 'ti-plus'}`} style={{ fontSize: 10, color: justAdded ? 'var(--accent)' : '#0f0f0f' }} />
                </button>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>{fav.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Progress (weight) ──────────────────────────────────────────────────
function WeightCard({ weightLogs, latest, unit, onLog, navigate }) {
  const [showInput, setShowInput] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Chart.js renders to <canvas>, which can't resolve CSS custom
  // properties the way DOM elements can — it needs an actual color
  // string at paint time. That's fine here since accent is the same hex
  // in both themes by design; only DOM backgrounds/borders/text below
  // need var()s.
  const chartData = {
    labels: weightLogs.map(w => w.logged_date),
    datasets: [{
      data: weightLogs.map(w => Number(w.weight)),
      borderColor: ACCENT,
      backgroundColor: ACCENT + '22',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
    }],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
  };

  async function submit() {
    if (!value || saving) return;
    setSaving(true);
    try {
      await onLog(Number(value), unit);
      setValue('');
      setShowInput(false);
    } catch (err) {
      console.error('Failed to log weight:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ border: '1px solid var(--border-strong)', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Weight</span>
        <button onClick={() => setShowInput(s => !s)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          {showInput ? 'Cancel' : '+ Log'}
        </button>
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
        {latest ? `${latest.weight}${latest.unit}` : '—'}
      </div>
      {showInput ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={`Weight (${unit})`}
            style={{ flex: 1, background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 7, padding: '7px 10px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={submit} disabled={!value || saving} style={{ background: !value || saving ? 'var(--border-default)' : 'var(--accent)', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: !value || saving ? 'var(--text-muted)' : '#0f0f0f', cursor: !value || saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Save</button>
        </div>
      ) : weightLogs.length > 1 ? (
        <div style={{ height: 60 }}><Line data={chartData} options={chartOptions} /></div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>Log your weight to see a trend here</div>
      )}
      <button onClick={() => navigate('/progress')} style={{ background: 'none', border: 'none', color: 'var(--text-hint)', fontSize: 11, cursor: 'pointer', marginTop: 12, padding: 0, fontFamily: 'inherit' }}>View full history →</button>
    </div>
  );
}

// ─── Water Tracker ────────────────────────────────────────────────────────────
function WaterTracker({ glasses, setGlasses, target = 8 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {Array.from({ length: target }).map((_, i) => (
        <button key={i} onClick={() => setGlasses(i < glasses ? i : i + 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${i < glasses ? WATER_BLUE : 'var(--border-default)'}`, background: i < glasses ? WATER_BLUE + '22' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transition: 'background 0.15s, border-color 0.15s, color 0.15s', color: i < glasses ? WATER_BLUE : 'var(--border-default)' }}>
          💧
        </button>
      ))}
      <span style={{ color: 'var(--text-hint)', fontSize: '12px', marginLeft: '4px' }}>{glasses}/{target}</span>
    </div>
  );
}

// ─── Mood Check-in ────────────────────────────────────────────────────────────
function MoodCheckin({ mood, setMood, energy, setEnergy }) {
  const moods = [
    { id: 'great', emoji: '😄', label: 'Great' },
    { id: 'good',  emoji: '🙂', label: 'Good' },
    { id: 'okay',  emoji: '😐', label: 'Okay' },
    { id: 'low',   emoji: '😔', label: 'Low' },
    { id: 'tired', emoji: '😴', label: 'Tired' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {moods.map(m => (
          <button key={m.id} onClick={() => setMood(m.id)} title={m.label} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: `1px solid ${mood === m.id ? 'var(--border-active)' : 'var(--border-default)'}`, background: mood === m.id ? 'var(--accent-bg)' : 'transparent', cursor: 'pointer', fontSize: '20px', transition: 'background 0.15s, border-color 0.15s' }}>
            {m.emoji}
          </button>
        ))}
      </div>
      <div>
        <div style={{ color: 'var(--text-hint)', fontSize: '11px', marginBottom: '6px' }}>Energy level</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setEnergy(n)} style={{ flex: 1, height: '6px', borderRadius: '99px', border: 'none', background: n <= energy ? 'var(--accent)' : 'var(--border-default)', cursor: 'pointer', transition: 'background 0.15s', padding: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ color: 'var(--text-hint)', fontSize: '10px' }}>low</span>
          <span style={{ color: 'var(--text-hint)', fontSize: '10px' }}>high</span>
        </div>
      </div>
    </div>
  );
}

// ─── Meal Log ─────────────────────────────────────────────────────────────────
function MealLog({ groups, onDelete, onSave, onNavigateFood }) {
  const [open, setOpen] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {groups.map(({ key, label, items }) => {
        const total = Math.round(items.reduce((s, i) => s + i.cal, 0));
        const protein = round1(items.reduce((s, i) => s + i.protein, 0));
        const carbs = round1(items.reduce((s, i) => s + i.carbs, 0));
        const fat = round1(items.reduce((s, i) => s + i.fat, 0));
        const isOpen = open[key];
        return (
          <div key={key} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden' }}>
            <button onClick={() => setOpen(o => ({ ...o, [key]: !o[key] }))} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>{label}</div>
                {items.length > 0 && <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: 2 }}>P {protein}g · C {carbs}g · F {fat}g</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{total} kcal</span>
                <span style={{ color: 'var(--text-hint)', fontSize: '12px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </div>
            </button>
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border-default)' }}>
                {items.length === 0 ? (
                  <p style={{ color: 'var(--text-hint)', fontSize: '13px', padding: '12px 16px' }}>Nothing logged yet</p>
                ) : (
                  items.map((item) => (
                    <LogItemRow
                      key={item.id}
                      item={item}
                      isExpanded={expandedId === item.id}
                      onToggle={() => setExpandedId(prev => (prev === item.id ? null : item.id))}
                      onDelete={() => onDelete(item.id)}
                      onSave={async (fields) => { await onSave(item.id, fields); setExpandedId(null); }}
                    />
                  ))
                )}
                <button onClick={() => onNavigateFood(key)} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--accent-dark)', fontSize: '13px', cursor: 'pointer', padding: '10px 16px', textAlign: 'left', transition: 'color 0.15s' }} onMouseEnter={e => e.target.style.color = 'var(--accent)'} onMouseLeave={e => e.target.style.color = 'var(--accent-dark)'}>
                  + Add food
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Guest Banner ─────────────────────────────────────────────────────────────
function GuestBanner({ daysRemaining, onSave }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: 'var(--accent)', fontSize: '14px' }}>🌿</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Guest mode — <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{daysRemaining} days</span> remaining.
          <button onClick={onSave} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', cursor: 'pointer', marginLeft: '4px', padding: 0, textDecoration: 'underline' }}>Save your data →</button>
        </span>
      </div>
      <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>×</button>
    </div>
  );
}

// ─── Shortcut buttons ───────────────────────────────────────────────────────────
function ShortcutRow({ navigate }) {
  const shortcuts = [
    { label: 'Log food',  icon: 'ti-plus', action: () => navigate('/food') },
    { label: 'Scan barcode', icon: 'ti-barcode', action: () => navigate('/food', { state: { openScan: true } }) },
  ];
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
      {shortcuts.map((s, i) => (
        <button key={i} onClick={s.action} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '14px', padding: '15px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: 'var(--text-primary)' }} />
          <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{s.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Insights & Data ────────────────────────────────────────────────────────
function ChangeRow({ label, value, trend }) {
  const up = trend === 'up';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border-default)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
        {trend && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
            <i className={`ti ti-trending-${up ? 'up' : 'down'}`} style={{ fontSize: 12 }} />
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const today = todayLocalDate();
  const { profile, save: saveProfile } = useProfile();
  const isPremium = !!profile?.is_premium;
  const { meals, dayTimeline, deleteFood, updateFood, addFood } = useFoodLogs(today);
  const { checkin, save: saveCheckin } = useCheckins(today);
  // 90 days (not 30) so the pattern engine's more specific candidates
  // (fibre, hydration, sugar, breakfast) have a real chance to each reach
  // their own 5-day-per-bucket minimum, not just the broadest ones — and
  // so the calorie hero's 1M/3M views can be sliced from data already in
  // hand instead of a second fetch.
  const { dailyData } = useHistory(dateNDaysAgo(90), today);
  const weightUnit = profile?.unit === 'imperial' ? 'lb' : 'kg';
  const { logs: weightLogs, latest: latestWeight, logWeight } = useWeightLogs(dateNDaysAgo(89), today);
  const favourites = useFavouriteFoods();

  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const calMonthStart = todayLocalDate(calMonth);
  const calMonthEnd = todayLocalDate(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0));
  const { dailyData: calData, loading: calLoading } = useHistory(calMonthStart, calMonthEnd);
  const calByDate = new Map(calData.map(d => [d.date, d]));
  const canGoNextMonth = calMonthStart < todayLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const targets = {
    calories: profile?.calorie_target || 2000,
    protein: { g: profile?.protein_g || 150 },
    carbs: { g: profile?.carbs_g || 200 },
    fat: { g: profile?.fat_g || 67 },
  };
  const calorieTarget = targets.calories;

  const { compute: computeAdaptive } = useAdaptiveTarget();

  // No server-side cron for this — an adaptive target is only ever
  // "fresh as of last app open", recomputed once per mount here (the
  // most-visited page) and again whenever Settings' Adaptive tab is
  // opened. Only writes back when the new number actually differs, so a
  // string of dashboard visits in one sitting doesn't spam profile
  // updates for a value that hasn't changed.
  const adaptiveRefreshedRef = useRef(false);
  useEffect(() => {
    if (!profile || profile.calorie_mode !== 'adaptive' || adaptiveRefreshedRef.current) return;
    adaptiveRefreshedRef.current = true;
    (async () => {
      const result = await computeAdaptive(profile.goal || 'maintain');
      if (!result.ready || Math.abs(result.target - (profile.calorie_target || 0)) < 10) return;
      const split = goalMacroSplits[profile.goal] || goalMacroSplits.maintain;
      const built = buildTargets(result.target, split, profile.water_target || 8);
      await saveProfile({
        calorie_target: built.calories,
        protein_g: built.protein.g,
        carbs_g: built.carbs.g,
        fat_g: built.fat.g,
      });
    })();
  }, [profile, computeAdaptive, saveProfile]);

  // Separate from the effect above — this one is purely for the "Avg.
  // expenditure" row below and runs regardless of calorie_mode, so
  // Calculated/Custom-mode users still see their real estimated
  // maintenance if they've logged enough to support one. Gated by the
  // same honesty rules as everywhere else the adaptive engine appears —
  // omitted entirely (not faked) when there isn't enough data yet.
  const [expenditureEstimate, setExpenditureEstimate] = useState(null);
  const expenditureFetchedRef = useRef(false);
  useEffect(() => {
    if (!profile || expenditureFetchedRef.current) return;
    expenditureFetchedRef.current = true;
    (async () => {
      const result = await computeAdaptive(profile.goal || 'maintain');
      if (result.ready) setExpenditureEstimate(result.estimate.tdee);
    })();
  }, [profile, computeAdaptive]);

  const name = profile?.name || 'there';
  const isGuest = !!user?.is_anonymous;
  const daysRemaining = user?.created_at
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000))
    : 7;
  const streak = computeStreak(dailyData);
  const insight = generateInsights(dailyData, 1)[0];

  const initials = (name || 'A').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';

  const mood = checkin?.mood ?? null;
  const energy = checkin?.energy ?? 6;
  const glasses = checkin?.water_glasses ?? 0;
  const setMood = (m) => saveCheckin({ mood: m, energy });
  const setEnergy = (e) => saveCheckin({ mood, energy: e });
  const setGlasses = (n) => saveCheckin({ mood, energy, water_glasses: n });

  const allItems = Object.values(meals).flat();
  const consumed        = allItems.reduce((s, i) => s + i.cal,     0);
  const consumedProtein = allItems.reduce((s, i) => s + i.protein, 0);
  const consumedCarbs   = allItems.reduce((s, i) => s + i.carbs,   0);
  const consumedFat     = allItems.reduce((s, i) => s + i.fat,     0);

  const byDate = new Map(dailyData.map(d => [d.date, d]));

  const [chartRange, setChartRange] = useState('1W');
  const chartRangeDays = { '1W': 7, '1M': 30, '3M': 90 }[chartRange];
  const chartDays = dateRange(dateNDaysAgo(chartRangeDays - 1), today).map(date => byDate.get(date) || { date, calories: 0 });

  // Real 7-day weight change from actually-logged entries — omitted (not
  // faked) if there isn't at least one weight log in each end of the
  // window to compare.
  const sevenDaysAgo = dateNDaysAgo(6);
  const weightWindow = weightLogs.filter(w => w.logged_date >= sevenDaysAgo);
  const weightTrendKg = weightWindow.length >= 2
    ? (() => {
        const toKg = (w) => w.unit === 'lb' ? Number(w.weight) * 0.453592 : Number(w.weight);
        const sorted = [...weightWindow].sort((a, b) => a.logged_date.localeCompare(b.logged_date));
        return toKg(sorted[sorted.length - 1]) - toKg(sorted[0]);
      })()
    : null;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });

  async function quickAddFavourite(fav) {
    const food = {
      name: fav.name, cal: fav.calories, protein: fav.protein_g, carbs: fav.carbs_g, fat: fav.fat_g,
      fibre: fav.fibre_g, sodium: fav.sodium_mg, sugar: fav.sugar_g, servingGrams: fav.serving_grams,
      source: 'favourite',
    };
    await addFood(food, isPremium ? null : 'snacks', isPremium ? new Date() : null);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <AppNav active="dashboard" initials={initials} />

      <div className="app-content-pad" style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div className="page-pad-top" style={{ minHeight: 52, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 12px', paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-default)', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
          <div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{greeting}, {name} 👋</span>
            <span style={{ color: 'var(--text-hint)', fontSize: '13px', marginLeft: '12px' }}>{dateStr}</span>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '20px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px' }}>🔥</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{streak}</span>
            <span style={{ color: 'var(--text-hint)', fontSize: '12px' }}>day streak</span>
          </div>
        </div>

        <div className="page-pad app-content-pad" style={{ maxWidth: '1100px' }}>
          {isGuest && <GuestBanner daysRemaining={daysRemaining} onSave={() => navigate('/settings')} />}

          <div style={{ marginBottom: '16px' }}>
            <CalorieHero
              consumed={consumed}
              target={calorieTarget}
              chartDays={chartDays}
              chartRange={chartRange}
              setChartRange={setChartRange}
              onClick={() => navigate('/nutrients')}
            />
          </div>

          <div className="grid-3" style={{ border: '1px solid var(--border-strong)', borderRadius: 16, overflow: 'hidden', marginBottom: '20px', gap: 0 }}>
            <div style={{ borderRight: '1px solid var(--border-default)' }}><MacroCell label="Protein" value={consumedProtein} target={targets.protein.g} color={ACCENT} /></div>
            <div style={{ borderRight: '1px solid var(--border-default)' }}><MacroCell label="Carbs" value={consumedCarbs} target={targets.carbs.g} color={WATER_BLUE} /></div>
            <MacroCell label="Fat" value={consumedFat} target={targets.fat.g} color={AI_PURPLE} />
          </div>

          <FavouritesRow favourites={favourites.rows} onQuickAdd={quickAddFavourite} />

          <ShortcutRow navigate={navigate} />

          {/* Progress: weight + logging calendar */}
          <div style={{ marginBottom: '16px' }}>
            <div className="grid-2">
              <WeightCard weightLogs={weightLogs} latest={latestWeight} unit={weightUnit} onLog={(w, u) => logWeight(today, w, u)} navigate={navigate} />
              <LogCalendar
                month={calMonth}
                byDate={calByDate}
                calorieTarget={calorieTarget}
                loading={calLoading}
                onPrevMonth={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                onNextMonth={() => canGoNextMonth && setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                canGoNext={canGoNextMonth}
                onSelectDay={(date) => navigate('/log', { state: { date } })}
              />
            </div>
          </div>

          {/* Check in: water + mood */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Check in</div>
            <div className="grid-2">
              <div style={{ border: '1px solid var(--border-strong)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>Water</span>
                  <span style={{ color: WATER_BLUE, fontSize: '13px', fontWeight: 600 }}>{glasses}/8 glasses</span>
                </div>
                <WaterTracker glasses={glasses} setGlasses={setGlasses} />
              </div>
              <div style={{ border: '1px solid var(--border-strong)', borderRadius: '16px', padding: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '14px' }}>How are you feeling?</span>
                <MoodCheckin mood={mood} setMood={setMood} energy={energy} setEnergy={setEnergy} />
              </div>
            </div>
          </div>

          {/* Insights & Data */}
          <div style={{ border: '1px solid var(--border-strong)', borderRadius: 16, padding: 20, marginBottom: '16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.04em' }}>INSIGHTS &amp; DATA</div>
            <div
              onClick={() => navigate('/insights')}
              style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 12, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}
            >
              <i className="ti ti-sparkles" style={{ color: 'var(--accent)', fontSize: 15, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {insight?.body || 'Start logging your meals to get personalised tips based on your patterns.'}
              </div>
            </div>
            <div>
              <ChangeRow label="Logging streak" value={`${streak} days`} trend="up" />
              {weightTrendKg !== null && (
                <ChangeRow
                  label="Weight trend (7-day)"
                  value={`${weightTrendKg >= 0 ? '+' : ''}${round1(weightUnit === 'lb' ? weightTrendKg / 0.453592 : weightTrendKg)} ${weightUnit}`}
                  trend={weightTrendKg >= 0 ? 'up' : 'down'}
                />
              )}
              {expenditureEstimate != null && (
                <ChangeRow label="Estimated maintenance" value={`${expenditureEstimate.toLocaleString()} kcal`} />
              )}
            </div>
          </div>

          {/* Daily food log */}
          <div style={{ border: '1px solid var(--border-strong)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span onClick={() => navigate('/log')} style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                Daily food log <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
              </span>
              <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>{Math.round(consumed)} kcal logged</span>
            </div>
            {isPremium ? (
              <HourlyTimeline
                segments={dayTimeline}
                onDelete={deleteFood}
                onSave={updateFood}
                onNavigateAdd={() => navigate('/food')}
              />
            ) : (
              <MealLog
                groups={Object.entries(meals).map(([key, items]) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), items }))}
                onDelete={deleteFood}
                onSave={updateFood}
                onNavigateFood={(key) => navigate('/food', { state: { openMeal: key } })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
