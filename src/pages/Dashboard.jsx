// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ active, navigate }) {
  const [expanded, setExpanded] = useState(false);

  const items = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'food',      icon: '🔍', label: 'Food Search' },
    { id: 'progress',  icon: '📈', label: 'Progress' },
    { id: 'plans',     icon: '📋', label: 'Meal Plans' },
    { id: 'ai',        icon: '✦',  label: 'AI Insights' },
    { id: 'scan',      icon: '📷', label: 'Scan Menu' },
  ];

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? '200px' : '52px',
        minHeight: '100vh',
        background: '#0f0f0f',
        borderRight: '1px solid #1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '0 14px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}>
        <span style={{ fontSize: '20px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#8fbc8f', flexShrink: 0 }}>n</span>
        {expanded && <span style={{ fontSize: '18px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#8fbc8f', letterSpacing: '-0.5px' }}>ourish</span>}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        {items.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate('/' + item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '11px 14px',
                background: isActive ? '#141414' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${isActive ? '#8fbc8f' : 'transparent'}`,
                cursor: 'pointer',
                color: isActive ? '#8fbc8f' : '#444',
                fontSize: '18px',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <span style={{ flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
              {expanded && (
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#e8e8e8' : '#555',
                }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <button style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        width: '100%', padding: '11px 14px', background: 'transparent',
        border: 'none', cursor: 'pointer', color: '#333', fontSize: '18px',
        whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
        <span style={{ flexShrink: 0 }}>⚙</span>
        {expanded && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#444' }}>Settings</span>}
      </button>
    </aside>
  );
}

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
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e1e1e" strokeWidth="10" />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#8fbc8f"
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {/* Center text */}
      <div style={{
        position: 'absolute',
        textAlign: 'center',
      }}>
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
        <button
          key={i}
          onClick={() => setGlasses(i < glasses ? i : i + 1)}
          style={{
            width: '28px', height: '28px',
            borderRadius: '6px',
            border: `1px solid ${i < glasses ? '#2a4a6a' : '#1e1e1e'}`,
            background: i < glasses ? '#6aabcf22' : 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
            transition: 'all 0.15s',
            color: i < glasses ? '#6aabcf' : '#2a2a2a',
          }}
        >
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
    { id: 'great',   emoji: '😄', label: 'Great' },
    { id: 'good',    emoji: '🙂', label: 'Good' },
    { id: 'okay',    emoji: '😐', label: 'Okay' },
    { id: 'low',     emoji: '😔', label: 'Low' },
    { id: 'tired',   emoji: '😴', label: 'Tired' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {moods.map(m => (
          <button
            key={m.id}
            onClick={() => setMood(m.id)}
            title={m.label}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: '8px',
              border: `1px solid ${mood === m.id ? '#3a5a3a' : '#1e1e1e'}`,
              background: mood === m.id ? '#0f1a0f' : 'transparent',
              cursor: 'pointer',
              fontSize: '20px',
              transition: 'all 0.15s',
            }}
          >
            {m.emoji}
          </button>
        ))}
      </div>
      {/* Energy 1–10 dots */}
      <div>
        <div style={{ color: '#444', fontSize: '11px', marginBottom: '6px' }}>Energy level</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setEnergy(n)}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '99px',
                border: 'none',
                background: n <= energy ? '#8fbc8f' : '#1e1e1e',
                cursor: 'pointer',
                transition: 'background 0.15s',
                padding: 0,
              }}
            />
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
function MealLog({ meals, onDelete }) {
  const [open, setOpen] = useState({ breakfast: true, lunch: false, dinner: false, snacks: false });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Object.entries(meals).map(([mealName, items]) => {
        const total = items.reduce((s, i) => s + i.cal, 0);
        const isOpen = open[mealName];

        return (
          <div key={mealName} style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '12px', overflow: 'hidden' }}>
            <button
              onClick={() => setOpen(o => ({ ...o, [mealName]: !o[mealName] }))}
              style={{
                width: '100%', background: 'none', border: 'none',
                padding: '14px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: '#ccc', textTransform: 'capitalize' }}>
                {mealName}
              </span>
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
                  items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 16px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#181818'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ color: '#ccc', fontSize: '14px' }}>{item.name}</div>
                        <div style={{ color: '#444', fontSize: '12px', marginTop: '1px' }}>
                          P {item.protein}g · C {item.carbs}g · F {item.fat}g
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: '#8fbc8f', fontSize: '14px', fontWeight: 500 }}>{item.cal}</span>
                        <button
                          onClick={() => onDelete(mealName, idx)}
                          style={{
                            background: 'none', border: 'none',
                            color: '#333', cursor: 'pointer', fontSize: '14px',
                            padding: '2px 4px',
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => e.target.style.color = '#c07070'}
                          onMouseLeave={e => e.target.style.color = '#333'}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <button
                  style={{
                    width: '100%', background: 'none', border: 'none',
                    color: '#3a5a3a', fontSize: '13px', cursor: 'pointer',
                    padding: '10px 16px', textAlign: 'left',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.color = '#8fbc8f'}
                  onMouseLeave={e => e.target.style.color = '#3a5a3a'}
                >
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
function GuestBanner({ daysRemaining }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div style={{
      background: '#0f1a0f',
      border: '1px solid #1e3a1e',
      borderRadius: '10px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: '#8fbc8f', fontSize: '14px' }}>🌿</span>
        <span style={{ color: '#ccc', fontSize: '13px' }}>
          Guest mode — <span style={{ color: '#8fbc8f', fontWeight: 600 }}>{daysRemaining} days</span> remaining.
          <button style={{ background: 'none', border: 'none', color: '#8fbc8f', fontSize: '13px', cursor: 'pointer', marginLeft: '4px', padding: 0, textDecoration: 'underline' }}>
            Save your data →
          </button>
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Shortcut Cards ───────────────────────────────────────────────────────────
function ShortcutRow({ navigate }) {
  const shortcuts = [
    { label: 'Log food',  icon: '＋', action: () => navigate('/food') },
    { label: 'Scan menu', icon: '📷', action: () => navigate('/scan') },
    { label: 'Water',     icon: '💧', action: null },
    { label: 'AI coach',  icon: '✦',  action: () => navigate('/ai') },
    { label: 'Progress',  icon: '📈', action: () => navigate('/progress') },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '20px' }}>
      {shortcuts.map((s, i) => (
        <button
          key={i}
          onClick={s.action}
          style={{
            background: '#141414',
            border: '1px solid #1e1e1e',
            borderRadius: '12px',
            padding: '14px 8px',
            cursor: s.action ? 'pointer' : 'default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (s.action) e.currentTarget.style.borderColor = '#3a5a3a'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; }}
        >
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
  const [activeNav, setActiveNav] = useState('dashboard');
  const [glasses, setGlasses] = useState(3);
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(6);

  const [meals, setMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  });

  // Load onboarding data
  const data = JSON.parse(sessionStorage.getItem('nourish_onboarding') || '{}');
  const targets = data.targets || { calories: 2000, protein: { g: 150 }, carbs: { g: 200 }, fat: { g: 67 } };
  const calorieTarget = targets.calories || 2000;
  const name = data.name || 'there';
  const daysRemaining = data.guestDaysRemaining || 7;
  const isGuest = data.mode === 'guest' || !data.mode;

  // Calc consumed
  const allItems = Object.values(meals).flat();
  const consumed = allItems.reduce((s, i) => s + i.cal, 0);
  const consumedProtein = allItems.reduce((s, i) => s + i.protein, 0);
  const consumedCarbs   = allItems.reduce((s, i) => s + i.carbs,   0);
  const consumedFat     = allItems.reduce((s, i) => s + i.fat,     0);

  // Streak from sessionStorage (fake for now)
  const streak = 3;

  const handleDelete = (mealName, idx) => {
    setMeals(m => ({
      ...m,
      [mealName]: m[mealName].filter((_, i) => i !== idx),
    }));
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f0f', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar active={activeNav} navigate={navigate} />

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid #1e1e1e',
          position: 'sticky',
          top: 0,
          background: '#0f0f0f',
          zIndex: 10,
        }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, color: '#e8e8e8', margin: 0 }}>
              {greeting}, {name} 👋
            </h2>
            <p style={{ color: '#444', fontSize: '13px', margin: '2px 0 0' }}>{dateStr}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Streak */}
            <div style={{
              background: '#141414',
              border: '1px solid #1e1e1e',
              borderRadius: '20px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ fontSize: '14px' }}>🔥</span>
              <span style={{ color: '#e8e8e8', fontSize: '13px', fontWeight: 600 }}>{streak}</span>
              <span style={{ color: '#444', fontSize: '12px' }}>day streak</span>
            </div>
            {/* Notification */}
            <button style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', color: '#444', fontSize: '16px' }}>
              🔔
            </button>
          </div>
        </div>

        {/* Dashboard content */}
        <div style={{ padding: '24px 28px', maxWidth: '1100px' }}>

          {isGuest && <GuestBanner daysRemaining={daysRemaining} />}

          <ShortcutRow navigate={navigate} />

          {/* Main grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

            {/* Calorie ring card */}
            <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ color: '#666', fontSize: '13px', fontWeight: 500 }}>Calories</span>
                <span style={{ color: '#444', fontSize: '12px' }}>{calorieTarget.toLocaleString()} target</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <CalorieRing consumed={consumed} target={calorieTarget} />
                <div style={{ flex: 1 }}>
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
              {/* Water */}
              <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ color: '#666', fontSize: '13px', fontWeight: 500 }}>Water</span>
                  <span style={{ color: '#6aabcf', fontSize: '13px', fontWeight: 600 }}>{glasses}/8 glasses</span>
                </div>
                <WaterTracker glasses={glasses} setGlasses={setGlasses} />
              </div>

              {/* Mood */}
              <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px', flex: 1 }}>
                <span style={{ color: '#666', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '14px' }}>
                  How are you feeling?
                </span>
                <MoodCheckin mood={mood} setMood={setMood} energy={energy} setEnergy={setEnergy} />
              </div>
            </div>
          </div>

          {/* AI Insight card */}
          <div style={{
            background: '#0f1a0f',
            border: '1px solid #1e3a1e',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
          }}>
            <div style={{
              width: '36px', height: '36px',
              background: '#4a7a4a22',
              border: '1px solid #3a5a3a',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              fontSize: '16px',
            }}>
              ✦
            </div>
            <div>
              <div style={{ color: '#4a7a4a', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                AI insight
              </div>
              <p style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                You're {consumed < calorieTarget * 0.3 ? 'tracking well this morning' : 'ahead of pace today'} — 
                {consumed < 500 ? ' try adding a protein source to your next meal to hit your daily target.' : ' keep it up! You\'re on track to meet your goals.'}
              </p>
            </div>
          </div>

          {/* Meal log */}
          <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: '#666', fontSize: '13px', fontWeight: 500 }}>Today's meals</span>
              <span style={{ color: '#8fbc8f', fontSize: '13px', fontWeight: 600 }}>{consumed} kcal logged</span>
            </div>
            <MealLog meals={meals} onDelete={handleDelete} />
          </div>

        </div>
      </div>
    </div>
  );
}