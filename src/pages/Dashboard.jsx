// src/pages/Dashboard.jsx
import { useState } from 'react';
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
import { todayLocalDate, dateNDaysAgo, dateRange, generateInsights, computeStreak } from '../lib/patterns';
import AppNav from '../components/AppNav';
import LogItemRow from '../components/LogItemRow';
import { round1 } from '../lib/format';
import { WeekBars } from './Progress';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// ─── Daily Nutrition ───────────────────────────────────────────────────────
// "eaten" shows the raw logged value, "remaining" shows target minus logged
// (negative once over budget, labelled accordingly), "percent" shows logged
// as a share of target — same underlying numbers, three ways to read them.
function displayAmount(mode, value, target, unit) {
  if (mode === 'percent') return target ? `${Math.round((value / target) * 100)}%` : '—';
  if (mode === 'remaining') {
    const left = round1(target - value);
    return left >= 0 ? `${left}${unit} left` : `${round1(Math.abs(left))}${unit} over`;
  }
  return `${round1(value)}${unit}`;
}

function MacroTile({ label, value, target, color, icon, mode }) {
  const pct = target ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div style={{ background: '#181818', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <i className={`ti ${icon}`} style={{ color, fontSize: 13 }} />
        <span style={{ color: '#666', fontSize: 11 }}>{label}</span>
      </div>
      <div style={{ color: '#e8e8e8', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
        {mode === 'eaten'
          ? <>{round1(value)}{target ? <span style={{ color: '#444', fontSize: 11, fontWeight: 400 }}>/{target}g</span> : 'g'}</>
          : displayAmount(mode, value, target, 'g')}
      </div>
      <div style={{ height: 4, background: '#1e1e1e', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

const NUTRITION_MODES = [
  { id: 'eaten', label: 'Eaten' },
  { id: 'remaining', label: 'Remaining' },
  { id: 'percent', label: '%' },
];

function NutritionCard({ consumed, target, protein, carbs, fat, targets, onClick }) {
  const [mode, setMode] = useState('eaten');
  const pct = target ? Math.min((consumed / target) * 100, 100) : 0;
  return (
    <div
      onClick={onClick}
      style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, padding: 22, cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#3a5a3a'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ color: '#666', fontSize: 13, fontWeight: 500 }}>Daily Nutrition</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 20, padding: 2 }}>
            {NUTRITION_MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  background: mode === m.id ? '#2a3a2a' : 'transparent', border: 'none', borderRadius: 18,
                  padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  color: mode === m.id ? '#8fbc8f' : '#555', transition: 'background 0.15s, color 0.15s',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <span style={{ color: '#444', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            Nutrients <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        {mode === 'eaten' ? (
          <>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 34, fontWeight: 700, color: '#e8e8e8' }}>{Math.round(consumed).toLocaleString()}</span>
            <span style={{ color: '#555', fontSize: 14 }}>/ {target.toLocaleString()} kcal</span>
          </>
        ) : (
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 34, fontWeight: 700, color: '#e8e8e8' }}>{displayAmount(mode, consumed, target, ' kcal')}</span>
        )}
      </div>
      <div style={{ height: 8, background: '#1e1e1e', borderRadius: 99, marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#8fbc8f', borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
      <div className="grid-3">
        <MacroTile label="Protein" value={protein} target={targets.protein} color="#8fbc8f" icon="ti-meat" mode={mode} />
        <MacroTile label="Carbs" value={carbs} target={targets.carbs} color="#6aabcf" icon="ti-bread" mode={mode} />
        <MacroTile label="Fat" value={fat} target={targets.fat} color="#9f97e8" icon="ti-droplet" mode={mode} />
      </div>
    </div>
  );
}

// ─── Progress (weight + week calories) ─────────────────────────────────────
function WeightCard({ weightLogs, latest, unit, onLog, navigate }) {
  const [showInput, setShowInput] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const chartData = {
    labels: weightLogs.map(w => w.logged_date),
    datasets: [{
      data: weightLogs.map(w => Number(w.weight)),
      borderColor: '#8fbc8f',
      backgroundColor: '#8fbc8f22',
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
    <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#666', fontSize: 13, fontWeight: 500 }}>Weight</span>
        <button onClick={() => setShowInput(s => !s)} style={{ background: 'none', border: 'none', color: '#8fbc8f', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          {showInput ? 'Cancel' : '+ Log'}
        </button>
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: '#e8e8e8', marginBottom: 14 }}>
        {latest ? `${latest.weight}${latest.unit}` : '—'}
      </div>
      {showInput ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={`Weight (${unit})`}
            style={{ flex: 1, background: '#181818', border: '1px solid #2a2a2a', borderRadius: 7, padding: '7px 10px', color: '#e8e8e8', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={submit} disabled={!value || saving} style={{ background: !value || saving ? '#2a2a2a' : '#8fbc8f', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: !value || saving ? '#666' : '#0f0f0f', cursor: !value || saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Save</button>
        </div>
      ) : weightLogs.length > 1 ? (
        <div style={{ height: 60 }}><Line data={chartData} options={chartOptions} /></div>
      ) : (
        <div style={{ fontSize: 12, color: '#444' }}>Log your weight to see a trend here</div>
      )}
      <button onClick={() => navigate('/progress')} style={{ background: 'none', border: 'none', color: '#444', fontSize: 11, cursor: 'pointer', marginTop: 12, padding: 0, fontFamily: 'inherit' }}>View full history →</button>
    </div>
  );
}

// ─── Water Tracker ────────────────────────────────────────────────────────────
function WaterTracker({ glasses, setGlasses, target = 8 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {Array.from({ length: target }).map((_, i) => (
        <button key={i} onClick={() => setGlasses(i < glasses ? i : i + 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${i < glasses ? '#2a4a6a' : '#1e1e1e'}`, background: i < glasses ? '#6aabcf22' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transition: 'all 0.15s', color: i < glasses ? '#6aabcf' : '#2a2a2a' }}>
          💧
        </button>
      ))}
      <span style={{ color: '#444', fontSize: '12px', marginLeft: '4px' }}>{glasses}/{target}</span>
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
          <button key={m.id} onClick={() => setMood(m.id)} title={m.label} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: `1px solid ${mood === m.id ? '#3a5a3a' : '#1e1e1e'}`, background: mood === m.id ? '#0f1a0f' : 'transparent', cursor: 'pointer', fontSize: '20px', transition: 'all 0.15s' }}>
            {m.emoji}
          </button>
        ))}
      </div>
      <div>
        <div style={{ color: '#444', fontSize: '11px', marginBottom: '6px' }}>Energy level</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setEnergy(n)} style={{ flex: 1, height: '6px', borderRadius: '99px', border: 'none', background: n <= energy ? '#8fbc8f' : '#1e1e1e', cursor: 'pointer', transition: 'background 0.15s', padding: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ color: '#333', fontSize: '10px' }}>low</span>
          <span style={{ color: '#333', fontSize: '10px' }}>high</span>
        </div>
      </div>
    </div>
  );
}

// ─── Meal Log ─────────────────────────────────────────────────────────────────
function MealLog({ meals, onDelete, onSave, onNavigateFood }) {
  // Nothing auto-opens — the per-meal macro line below each meal name
  // already covers the "doesn't look empty" concern without forcing any one
  // meal open regardless of what's actually in it.
  const [open, setOpen] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Object.entries(meals).map(([mealName, items]) => {
        const total = Math.round(items.reduce((s, i) => s + i.cal, 0));
        const protein = round1(items.reduce((s, i) => s + i.protein, 0));
        const carbs = round1(items.reduce((s, i) => s + i.carbs, 0));
        const fat = round1(items.reduce((s, i) => s + i.fat, 0));
        const isOpen = open[mealName];
        return (
          <div key={mealName} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '12px', overflow: 'hidden' }}>
            <button onClick={() => setOpen(o => ({ ...o, [mealName]: !o[mealName] }))} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: '#ccc', textTransform: 'capitalize' }}>{mealName}</div>
                {items.length > 0 && <div style={{ color: '#555', fontSize: '12px', marginTop: 2 }}>P {protein}g · C {carbs}g · F {fat}g</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#555', fontSize: '13px' }}>{total} kcal</span>
                <span style={{ color: '#444', fontSize: '12px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </div>
            </button>
            {isOpen && (
              <div style={{ borderTop: '1px solid #1e1e1e' }}>
                {items.length === 0 ? (
                  <p style={{ color: '#333', fontSize: '13px', padding: '12px 16px' }}>Nothing logged yet</p>
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
                <button onClick={() => onNavigateFood(mealName)} style={{ width: '100%', background: 'none', border: 'none', color: '#3a5a3a', fontSize: '13px', cursor: 'pointer', padding: '10px 16px', textAlign: 'left', transition: 'color 0.15s' }} onMouseEnter={e => e.target.style.color = '#8fbc8f'} onMouseLeave={e => e.target.style.color = '#3a5a3a'}>
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
    <div style={{ background: '#0f1a0f', border: '1px solid #1e3a1e', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: '#8fbc8f', fontSize: '14px' }}>🌿</span>
        <span style={{ color: '#ccc', fontSize: '13px' }}>
          Guest mode — <span style={{ color: '#8fbc8f', fontWeight: 600 }}>{daysRemaining} days</span> remaining.
          <button onClick={onSave} style={{ background: 'none', border: 'none', color: '#8fbc8f', fontSize: '13px', cursor: 'pointer', marginLeft: '4px', padding: 0, textDecoration: 'underline' }}>Save your data →</button>
        </span>
      </div>
      <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>×</button>
    </div>
  );
}

// ─── Shortcut Cards ───────────────────────────────────────────────────────────
function ShortcutRow({ navigate }) {
  const shortcuts = [
    { label: 'Log food',  icon: '＋', action: () => navigate('/food') },
    { label: 'Scan barcode', icon: '📷', action: () => navigate('/food', { state: { openScan: true } }) },
  ];
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      {shortcuts.map((s, i) => (
        <button key={i} onClick={s.action} style={{ flex: 1, maxWidth: 160, background: '#141414', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '14px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#3a5a3a'} onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}>
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{s.icon}</span>
          <span style={{ color: '#666', fontSize: '11px', fontWeight: 500 }}>{s.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const today = todayLocalDate();
  const { profile } = useProfile();
  const { meals, deleteFood, updateFood } = useFoodLogs(today);
  const { checkin, save: saveCheckin } = useCheckins(today);
  const { dailyData } = useHistory(dateNDaysAgo(30), today);
  const weightUnit = profile?.unit === 'imperial' ? 'lb' : 'kg';
  const { logs: weightLogs, latest: latestWeight, logWeight } = useWeightLogs(dateNDaysAgo(29), today);

  const targets = {
    calories: profile?.calorie_target || 2000,
    protein: { g: profile?.protein_g || 150 },
    carbs: { g: profile?.carbs_g || 200 },
    fat: { g: profile?.fat_g || 67 },
  };
  const calorieTarget = targets.calories;
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
  const weekDays = dateRange(dateNDaysAgo(6), today).map(date => byDate.get(date) || { date, calories: 0 });

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f0f0f', fontFamily: "'DM Sans', sans-serif" }}>
      <AppNav active="dashboard" initials={initials} />

      <div className="app-content-pad" style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {/* Top bar */}
        <div className="page-pad-top" style={{ minHeight: 52, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 12px', paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid #1e1e1e', position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10 }}>
          <div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 600, color: '#e8e8e8' }}>{greeting}, {name} 👋</span>
            <span style={{ color: '#444', fontSize: '13px', marginLeft: '12px' }}>{dateStr}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '20px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px' }}>🔥</span>
              <span style={{ color: '#e8e8e8', fontSize: '13px', fontWeight: 600 }}>{streak}</span>
              <span style={{ color: '#444', fontSize: '12px' }}>day streak</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="page-pad app-content-pad" style={{ maxWidth: '1100px' }}>
          {isGuest && <GuestBanner daysRemaining={daysRemaining} onSave={() => navigate('/settings')} />}
          <ShortcutRow navigate={navigate} />

          {/* Daily Nutrition */}
          <div style={{ marginBottom: '16px' }}>
            <NutritionCard
              consumed={consumed}
              target={calorieTarget}
              protein={consumedProtein}
              carbs={consumedCarbs}
              fat={consumedFat}
              targets={{ protein: targets.protein.g, carbs: targets.carbs.g, fat: targets.fat.g }}
              onClick={() => navigate('/nutrients')}
            />
          </div>

          {/* Progress: weight + this week's calories */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#666', fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Progress</div>
            <div className="grid-2">
              <WeightCard weightLogs={weightLogs} latest={latestWeight} unit={weightUnit} onLog={(w, u) => logWeight(today, w, u)} navigate={navigate} />
              <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px' }}>
                <div style={{ color: '#666', fontSize: '13px', fontWeight: 500, marginBottom: '14px' }}>This week's calories</div>
                <WeekBars days={weekDays} calorieTarget={calorieTarget} />
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div
            onClick={() => navigate('/insights')}
            style={{ background: '#0f1a0f', border: '1px solid #1e3a1e', borderRadius: '16px', padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#3a5a3a'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1e3a1e'}
          >
            <div style={{ width: '36px', height: '36px', background: '#4a7a4a22', border: '1px solid #3a5a3a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-sparkles" style={{ fontSize: 16, color: '#8fbc8f' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#4a7a4a', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Insights</span>
                <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#4a7a4a' }} />
              </div>
              <p style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.6, margin: '6px 0 0' }}>
                {insight?.body || 'Start logging your meals to get personalised tips based on your patterns.'}
              </p>
            </div>
          </div>

          {/* Check in: water + mood */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#666', fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Check in</div>
            <div className="grid-2">
              <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ color: '#666', fontSize: '13px', fontWeight: 500 }}>Water</span>
                  <span style={{ color: '#6aabcf', fontSize: '13px', fontWeight: 600 }}>{glasses}/8 glasses</span>
                </div>
                <WaterTracker glasses={glasses} setGlasses={setGlasses} />
              </div>
              <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px' }}>
                <span style={{ color: '#666', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '14px' }}>How are you feeling?</span>
                <MoodCheckin mood={mood} setMood={setMood} energy={energy} setEnergy={setEnergy} />
              </div>
            </div>
          </div>

          {/* Daily food log */}
          <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span onClick={() => navigate('/log')} style={{ color: '#666', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                Daily food log <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
              </span>
              <span style={{ color: '#8fbc8f', fontSize: '13px', fontWeight: 600 }}>{Math.round(consumed)} kcal logged</span>
            </div>
            <MealLog
              meals={meals}
              onDelete={deleteFood}
              onSave={updateFood}
              onNavigateFood={(mealName) => navigate('/food', { state: { openMeal: mealName } })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
