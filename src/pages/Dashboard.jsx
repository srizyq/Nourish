// src/pages/Dashboard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useFoodLogs } from '../hooks/useFoodLogs';
import { useCheckins } from '../hooks/useCheckins';
import { useHistory } from '../hooks/useHistory';
import { todayLocalDate, dateNDaysAgo, generateInsights, computeStreak } from '../lib/patterns';
import AppNav from '../components/AppNav';

// ─── Calorie Ring ─────────────────────────────────────────────────────────────
function CalorieRing({ consumed, target }) {
  const pct = Math.min(consumed / target, 1);
  const r = 72;
  const cx = 90, cy = 90;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const remaining = target - consumed;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e1e1e" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#8fbc8f" strokeWidth="10" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 700, color: '#e8e8e8', lineHeight: 1 }}>
          {remaining > 0 ? remaining.toLocaleString() : '0'}
        </div>
        <div style={{ color: '#555', fontSize: '11px', marginTop: '3px' }}>kcal left</div>
      </div>
    </div>
  );
}

// ─── Macro Bar ────────────────────────────────────────────────────────────────
function MacroBar({ label, current, target, color }) {
  const pct = Math.min(current / target, 1) * 100;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ color: '#666', fontSize: '12px' }}>{label}</span>
        <span style={{ color: '#555', fontSize: '12px' }}>{current}<span style={{ color: '#333' }}>/{target}g</span></span>
      </div>
      <div style={{ height: '4px', background: '#1e1e1e', borderRadius: '99px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
      </div>
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
function MealLog({ meals, onDelete, onNavigateFood }) {
  const [open, setOpen] = useState({ breakfast: true, lunch: false, dinner: false, snacks: false });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Object.entries(meals).map(([mealName, items]) => {
        const total = items.reduce((s, i) => s + i.cal, 0);
        const isOpen = open[mealName];
        return (
          <div key={mealName} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '12px', overflow: 'hidden' }}>
            <button onClick={() => setOpen(o => ({ ...o, [mealName]: !o[mealName] }))} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: '#ccc', textTransform: 'capitalize' }}>{mealName}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#555', fontSize: '13px' }}>{total} kcal</span>
                <span style={{ color: '#444', fontSize: '12px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </div>
            </button>
            {isOpen && (
              <div style={{ borderTop: '1px solid #1e1e1e', padding: '4px 0' }}>
                {items.length === 0 ? (
                  <p style={{ color: '#333', fontSize: '13px', padding: '12px 16px' }}>Nothing logged yet</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#181818'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div>
                        <div style={{ color: '#ccc', fontSize: '14px' }}>{item.name}</div>
                        <div style={{ color: '#444', fontSize: '12px', marginTop: '1px' }}>P {item.protein}g · C {item.carbs}g · F {item.fat}g</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: '#8fbc8f', fontSize: '14px', fontWeight: 500 }}>{item.cal}</span>
                        <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '14px', padding: '2px 4px', transition: 'color 0.15s' }} onMouseEnter={e => e.target.style.color = '#c07070'} onMouseLeave={e => e.target.style.color = '#333'}>×</button>
                      </div>
                    </div>
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
    { label: 'Scan barcode', icon: '📷', action: () => navigate('/food') },
    { label: 'Water',     icon: '💧', action: null },
    { label: 'Patterns',  icon: '✦',  action: () => navigate('/insights') },
    { label: 'Progress',  icon: '📈', action: () => navigate('/progress') },
  ];
  return (
    <div className="grid-5" style={{ marginBottom: '20px' }}>
      {shortcuts.map((s, i) => (
        <button key={i} onClick={s.action} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '14px 8px', cursor: s.action ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }} onMouseEnter={e => { if (s.action) e.currentTarget.style.borderColor = '#3a5a3a'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; }}>
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
  const [glasses, setGlasses] = useState(0);

  const today = todayLocalDate();
  const { profile } = useProfile();
  const { meals, deleteFood } = useFoodLogs(today);
  const { checkin, save: saveCheckin } = useCheckins(today);
  const { dailyData } = useHistory(dateNDaysAgo(30), today);

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
  const setMood = (m) => saveCheckin({ mood: m, energy });
  const setEnergy = (e) => saveCheckin({ mood, energy: e });

  const allItems = Object.values(meals).flat();
  const consumed        = allItems.reduce((s, i) => s + i.cal,     0);
  const consumedProtein = allItems.reduce((s, i) => s + i.protein, 0);
  const consumedCarbs   = allItems.reduce((s, i) => s + i.carbs,   0);
  const consumedFat     = allItems.reduce((s, i) => s + i.fat,     0);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f0f', fontFamily: "'DM Sans', sans-serif" }}>
      <AppNav active="dashboard" initials={initials} />

      <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
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
            <button style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', color: '#444', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-bell" style={{ fontSize: 17 }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="page-pad app-content-pad" style={{ maxWidth: '1100px' }}>
          {isGuest && <GuestBanner daysRemaining={daysRemaining} onSave={() => navigate('/settings')} />}
          <ShortcutRow navigate={navigate} />

          <div className="grid-2" style={{ marginBottom: '16px' }}>
            {/* Calorie ring */}
            <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ color: '#666', fontSize: '13px', fontWeight: 500 }}>Calories</span>
                <span style={{ color: '#444', fontSize: '12px' }}>{calorieTarget.toLocaleString()} target</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <CalorieRing consumed={consumed} target={calorieTarget} />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ color: '#555', fontSize: '12px' }}>Consumed </span>
                    <span style={{ color: '#e8e8e8', fontWeight: 600 }}>{consumed}</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ color: '#555', fontSize: '12px' }}>Target </span>
                    <span style={{ color: '#e8e8e8', fontWeight: 600 }}>{calorieTarget.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <MacroBar label="Protein" current={consumedProtein} target={targets.protein?.g || 150} color="#8fbc8f" />
                    <MacroBar label="Carbs"   current={consumedCarbs}   target={targets.carbs?.g   || 200} color="#6aabcf" />
                    <MacroBar label="Fat"     current={consumedFat}     target={targets.fat?.g     || 67}  color="#9f97e8" />
                  </div>
                </div>
              </div>
            </div>

            {/* Water + Mood */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ color: '#666', fontSize: '13px', fontWeight: 500 }}>Water</span>
                  <span style={{ color: '#6aabcf', fontSize: '13px', fontWeight: 600 }}>{glasses}/8 glasses</span>
                </div>
                <WaterTracker glasses={glasses} setGlasses={setGlasses} />
              </div>
              <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px', flex: 1 }}>
                <span style={{ color: '#666', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '14px' }}>How are you feeling?</span>
                <MoodCheckin mood={mood} setMood={setMood} energy={energy} setEnergy={setEnergy} />
              </div>
            </div>
          </div>

          {/* Pattern insight */}
          <div style={{ background: '#0f1a0f', border: '1px solid #1e3a1e', borderRadius: '16px', padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: '#4a7a4a22', border: '1px solid #3a5a3a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-sparkles" style={{ fontSize: 16, color: '#8fbc8f' }} />
            </div>
            <div>
              <div style={{ color: '#4a7a4a', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Your pattern</div>
              <p style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                {insight?.body || 'Start logging your meals to get personalised insights based on your patterns.'}
              </p>
            </div>
          </div>

          {/* Meal log */}
          <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: '#666', fontSize: '13px', fontWeight: 500 }}>Today's meals</span>
              <span style={{ color: '#8fbc8f', fontSize: '13px', fontWeight: 600 }}>{consumed} kcal logged</span>
            </div>
            <MealLog
              meals={meals}
              onDelete={deleteFood}
              onNavigateFood={() => navigate('/food')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
