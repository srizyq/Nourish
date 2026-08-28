import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';

// ─── Shared calc (matches onboarding Step3) ────────────────────────────────────
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

const goalAdjustments = {
  lose: -400,
  maintain: 0,
  build: +300,
};

const goalMacroSplits = {
  lose:     { protein: 0.35, carbs: 0.35, fat: 0.30 },
  maintain: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  build:    { protein: 0.30, carbs: 0.45, fat: 0.25 },
};

function calcBMR(weight, height, age, unit) {
  let w = Number(weight), h = Number(height);
  if (unit === 'imperial') {
    w = w * 0.453592;   // lbs → kg
    h = h * 2.54;       // inches → cm
  }
  return 10 * w + 6.25 * h - 5 * Number(age) + 5;
}

function calcCalories(form) {
  const bmr = calcBMR(form.weight, form.height, form.age, form.unit);
  const tdee = bmr * (activityMultipliers[form.activity] || 1.55);
  return Math.round(tdee + (goalAdjustments[form.goal] || 0));
}

// Build a full targets object from a calorie number + macro % split
function buildTargets(calories, split, water = 8) {
  const proteinCal = calories * split.protein;
  const carbsCal   = calories * split.carbs;
  const fatCal     = calories * split.fat;
  return {
    calories,
    protein: { g: Math.round(proteinCal / 4), cal: Math.round(proteinCal), pct: split.protein },
    carbs:   { g: Math.round(carbsCal   / 4), cal: Math.round(carbsCal),   pct: split.carbs   },
    fat:     { g: Math.round(fatCal      / 9), cal: Math.round(fatCal),     pct: split.fat     },
    water,
  };
}

// Derive a protein/carbs/fat percentage split from stored gram targets.
function splitFromGrams(proteinG, carbsG, fatG) {
  const proteinCal = proteinG * 4, carbsCal = carbsG * 4, fatCal = fatG * 9;
  const total = proteinCal + carbsCal + fatCal;
  if (!total) return goalMacroSplits.maintain;
  return { protein: proteinCal / total, carbs: carbsCal / total, fat: fatCal / total };
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ navigate }) {
  const sbIconBase = {
    width: 36, height: 36, display: "flex", alignItems: "center",
    justifyContent: "center", borderRadius: 8, cursor: "pointer",
    color: "#666666", fontSize: 18,
  };
  const sbIconActive = { ...sbIconBase, color: "#8fbc8f", background: "#0f1a0f" };

  return (
    <div style={{
      width: 52, background: "#0f0f0f", borderRight: "1px solid #1e1e1e",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 0", gap: 28, flexShrink: 0,
      position: "sticky", top: 0, height: "100vh",
    }}>
      {/* logo mark */}
      <div style={{ width: 28, height: 28, background: "#8fbc8f", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#0f0f0f">
          <path d="M8 2C5.5 2 4 4 4 6c0 3 4 8 4 8s4-5 4-8c0-2-1.5-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
        </svg>
      </div>

      <div style={sbIconBase} title="Dashboard"   onClick={() => navigate("/dashboard")}><i className="ti ti-layout-dashboard" /></div>
      <div style={sbIconBase} title="Food search" onClick={() => navigate("/food")}><i className="ti ti-search" /></div>
      <div style={sbIconBase} title="Progress"    onClick={() => navigate("/progress")}><i className="ti ti-chart-line" /></div>
      <div style={sbIconBase} title="Meal plans"  onClick={() => navigate("/meals")}><i className="ti ti-calendar" /></div>
      <div style={sbIconBase} title="AI insights" onClick={() => navigate("/insights")}><i className="ti ti-sparkles" /></div>

      <div style={{ flex: 1 }} />

      <div style={sbIconActive} title="Settings"><i className="ti ti-settings" /></div>
      <div
        title="Profile"
        onClick={() => navigate("/profile")}
        style={{
        width: 32, height: 32, background: "#181818", border: "1px solid #2a2a2a",
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: "#8fbc8f", fontWeight: 600, cursor: "pointer",
      }} />
    </div>
  );
}

// ─── Reusable bits ──────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: '#141414',
      border: '1px solid #1e1e1e',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '16px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ color: '#555', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 18px' }}>
      {children}
    </p>
  );
}

function FieldRow({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
      <div>
        <div style={{ color: '#ccc', fontSize: '14px', fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ color: '#555', fontSize: '12px', marginTop: '2px' }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '9px 12px',
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: '8px',
        color: '#e8e8e8',
        fontSize: '14px',
        fontFamily: "'DM Sans', sans-serif",
        outline: 'none',
        cursor: 'pointer',
        minWidth: '160px',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {options.map(o => {
        const sel = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              flex: '1 1 auto',
              minWidth: '120px',
              padding: '14px 16px',
              background: sel ? '#0f1a0f' : '#0f0f0f',
              border: `1px solid ${sel ? '#3a5a3a' : '#2a2a2a'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{o.emoji}</div>
            <div style={{ color: sel ? '#8fbc8f' : '#ccc', fontSize: '14px', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{o.label}</div>
            {o.desc && <div style={{ color: '#555', fontSize: '12px', marginTop: '2px' }}>{o.desc}</div>}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: '44px', height: '26px',
        borderRadius: '99px',
        border: `1px solid ${on ? '#4a7a4a' : '#2a2a2a'}`,
        background: on ? '#4a7a4a33' : '#0f0f0f',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: '2px',
        left: on ? '20px' : '2px',
        width: '20px', height: '20px',
        borderRadius: '50%',
        background: on ? '#8fbc8f' : '#555',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

function Slider({ value, min, max, step = 1, onChange, color = '#8fbc8f' }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{
        width: '100%',
        appearance: 'none',
        WebkitAppearance: 'none',
        height: '6px',
        borderRadius: '99px',
        background: `linear-gradient(to right, ${color} ${pct}%, #1e1e1e ${pct}%)`,
        outline: 'none',
        cursor: 'pointer',
      }}
    />
  );
}

function MacroPreviewBar({ label, grams, calories, pct, color }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: '#ccc', fontSize: '13px', fontWeight: 500 }}>{label}</span>
        <span style={{ color: '#666', fontSize: '12px' }}>
          <span style={{ color: '#e8e8e8', fontWeight: 600 }}>{grams}g</span> · {calories} kcal · {Math.round(pct * 100)}%
        </span>
      </div>
      <div style={{ height: '6px', background: '#1e1e1e', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: '99px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'goals',    label: 'Goals & Targets' },
  { id: 'notifs',   label: 'Notifications' },
  { id: 'account',  label: 'Account' },
];

const DEFAULT_FORM = { unit: 'metric', age: 30, weight: 70, height: 170, goal: 'maintain', activity: 'moderate' };

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, save: saveProfile } = useProfile();
  const [tab, setTab] = useState('goals');
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [calMode, setCalMode] = useState('calculated');
  const [customCal, setCustomCal] = useState(2000);
  const [proteinPct, setProteinPct] = useState(30);
  const [fatPct, setFatPct] = useState(30);
  const [notifs, setNotifs] = useState({ meals: true, water: true, mood: true, recap: true, ai: true, trainer: false });

  // Sync form state once the real profile loads
  useEffect(() => {
    if (!profile) return;
    setForm({
      unit: profile.unit || 'metric',
      age: profile.age || 30,
      weight: profile.weight || 70,
      height: profile.height || 170,
      goal: profile.goal || 'maintain',
      activity: profile.activity || 'moderate',
    });
    if (profile.calorie_target) {
      setCustomCal(profile.calorie_target);
      const split = splitFromGrams(profile.protein_g || 0, profile.carbs_g || 0, profile.fat_g || 0);
      setProteinPct(Math.round(split.protein * 100));
      setFatPct(Math.round(split.fat * 100));
    }
  }, [profile]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const carbPct = Math.max(0, 100 - proteinPct - fatPct);

  // Live calorie + macro preview
  const calculatedCal = calcCalories(form);
  const calories = calMode === 'calculated' ? calculatedCal : customCal;
  const split = { protein: proteinPct / 100, carbs: carbPct / 100, fat: fatPct / 100 };
  const preview = buildTargets(calories, split, profile?.water_target || 8);

  // When goal changes in calculated mode, snap macros to that goal's recommended split
  const applyGoalSplit = (goal) => {
    set('goal', goal);
    const s = goalMacroSplits[goal];
    setProteinPct(Math.round(s.protein * 100));
    setFatPct(Math.round(s.fat * 100));
  };

  const handleSave = async () => {
    await saveProfile({
      unit: form.unit,
      age: Number(form.age),
      weight: Number(form.weight),
      height: Number(form.height),
      goal: form.goal,
      activity: form.activity,
      calorie_target: preview.calories,
      protein_g: preview.protein.g,
      carbs_g: preview.carbs.g,
      fat_g: preview.fat.g,
      water_target: preview.water,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isGuest = !!user?.is_anonymous;
  const daysRemaining = user?.created_at
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000))
    : 7;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f0f', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar navigate={navigate} />

      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: '1px solid #1e1e1e',
          position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10,
        }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, color: '#e8e8e8', margin: 0 }}>
              Settings
            </h2>
            <p style={{ color: '#444', fontSize: '13px', margin: '2px 0 0' }}>Manage your goals, profile and preferences</p>
          </div>
          {tab === 'goals' && (
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                background: saved ? '#0f1a0f' : '#8fbc8f',
                border: `1px solid ${saved ? '#3a5a3a' : '#8fbc8f'}`,
                borderRadius: '10px',
                color: saved ? '#8fbc8f' : '#0f0f0f',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
              }}
            >
              {saved ? '✓ Saved' : 'Save changes'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '16px 28px 0', borderBottom: '1px solid #1e1e1e' }}>
          {TABS.map(t => {
            const sel = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${sel ? '#8fbc8f' : 'transparent'}`,
                  color: sel ? '#e8e8e8' : '#555',
                  fontSize: '14px',
                  fontWeight: sel ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: '-1px',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px' }}>

          {/* ── GOALS & TARGETS ── */}
          {tab === 'goals' && (
            <>
              <Card>
                <SectionLabel>Goal</SectionLabel>
                <Segmented
                  value={form.goal}
                  onChange={applyGoalSplit}
                  options={[
                    { value: 'lose',     emoji: '📉', label: 'Lose weight',  desc: '−400 kcal/day' },
                    { value: 'maintain', emoji: '⚖️', label: 'Maintain',     desc: 'At maintenance' },
                    { value: 'build',    emoji: '💪', label: 'Build muscle', desc: '+300 kcal/day' },
                  ]}
                />
                <div style={{ marginTop: '16px' }}>
                  <FieldRow label="Activity level" hint="Used to estimate your daily energy use">
                    <Select
                      value={form.activity}
                      onChange={v => set('activity', v)}
                      options={[
                        { value: 'sedentary', label: 'Sedentary' },
                        { value: 'light',     label: 'Lightly active' },
                        { value: 'moderate',  label: 'Moderately active' },
                        { value: 'very',      label: 'Very active' },
                      ]}
                    />
                  </FieldRow>
                </div>
              </Card>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

              <Card style={{ marginBottom: 0 }}>
                <SectionLabel>Calorie target</SectionLabel>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                  {[
                    { value: 'calculated', label: 'Calculated' },
                    { value: 'custom',     label: 'Custom' },
                  ].map(m => {
                    const sel = calMode === m.value;
                    return (
                      <button
                        key={m.value}
                        onClick={() => { setCalMode(m.value); if (m.value === 'custom') setCustomCal(calculatedCal); }}
                        style={{
                          flex: 1, padding: '10px',
                          background: sel ? '#0f1a0f' : '#0f0f0f',
                          border: `1px solid ${sel ? '#3a5a3a' : '#2a2a2a'}`,
                          borderRadius: '8px',
                          color: sel ? '#8fbc8f' : '#666',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '40px', fontWeight: 700, color: '#8fbc8f' }}>
                    {calories.toLocaleString()}
                  </span>
                  <span style={{ color: '#555', fontSize: '14px', marginLeft: '6px' }}>kcal / day</span>
                </div>

                {calMode === 'custom' ? (
                  <>
                    <Slider value={customCal} min={1200} max={4000} step={10} onChange={setCustomCal} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444', fontSize: '11px', marginTop: '6px' }}>
                      <span>1,200</span><span>4,000</span>
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', margin: 0 }}>
                    Calculated from your stats, goal and activity level. Switch to Custom to set it manually.
                  </p>
                )}
              </Card>

              <Card style={{ marginBottom: 0 }}>
                <SectionLabel>Macro split</SectionLabel>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#ccc', fontSize: '13px', fontWeight: 500 }}>Protein</span>
                    <span style={{ color: '#8fbc8f', fontSize: '13px', fontWeight: 600 }}>{proteinPct}%</span>
                  </div>
                  <Slider value={proteinPct} min={10} max={60} onChange={v => setProteinPct(Math.min(v, 100 - fatPct))} color="#8fbc8f" />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#ccc', fontSize: '13px', fontWeight: 500 }}>Fat</span>
                    <span style={{ color: '#9f97e8', fontSize: '13px', fontWeight: 600 }}>{fatPct}%</span>
                  </div>
                  <Slider value={fatPct} min={10} max={50} onChange={v => setFatPct(Math.min(v, 100 - proteinPct))} color="#9f97e8" />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#ccc', fontSize: '13px', fontWeight: 500 }}>Carbs</span>
                    <span style={{ color: '#6aabcf', fontSize: '13px', fontWeight: 600 }}>{carbPct}% (auto)</span>
                  </div>
                  <div style={{ height: '6px', background: '#1e1e1e', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${carbPct}%`, background: '#6aabcf', borderRadius: '99px', transition: 'width 0.2s' }} />
                  </div>
                  <p style={{ color: '#444', fontSize: '11px', marginTop: '6px' }}>Carbs fill whatever's left so your split always totals 100%.</p>
                </div>

                {/* Live preview */}
                <div style={{ background: '#0f1a0f', border: '1px solid #1e3a1e', borderRadius: '12px', padding: '18px' }}>
                  <p style={{ color: '#4a7a4a', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                    Daily breakdown
                  </p>
                  <MacroPreviewBar label="Protein" grams={preview.protein.g} calories={preview.protein.cal} pct={preview.protein.pct} color="#8fbc8f" />
                  <MacroPreviewBar label="Carbs"   grams={preview.carbs.g}   calories={preview.carbs.cal}   pct={preview.carbs.pct}   color="#6aabcf" />
                  <MacroPreviewBar label="Fat"     grams={preview.fat.g}     calories={preview.fat.cal}     pct={preview.fat.pct}     color="#9f97e8" />
                </div>
              </Card>

              </div>
            </>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === 'notifs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              <Card style={{ marginBottom: 0 }}>
                <SectionLabel>Reminders</SectionLabel>
                {[
                  { key: 'meals', label: 'Meal reminders',      hint: 'Nudge to log breakfast, lunch and dinner' },
                  { key: 'water', label: 'Water reminders',     hint: 'Gentle reminders to stay hydrated' },
                  { key: 'mood',  label: 'Daily mood check-in', hint: 'One tap each evening' },
                ].map(n => (
                  <FieldRow key={n.key} label={n.label} hint={n.hint}>
                    <Toggle on={notifs[n.key]} onChange={v => setNotifs(s => ({ ...s, [n.key]: v }))} />
                  </FieldRow>
                ))}
              </Card>

              <Card style={{ marginBottom: 0 }}>
                <SectionLabel>Updates</SectionLabel>
                {[
                  { key: 'recap',   label: 'Weekly recap',    hint: 'Your shareable Sunday summary' },
                  { key: 'ai',      label: 'Pattern insights', hint: 'Nudges based on your logged patterns' },
                  { key: 'trainer', label: 'Trainer updates', hint: 'When your trainer comments on your data' },
                ].map(n => (
                  <FieldRow key={n.key} label={n.label} hint={n.hint}>
                    <Toggle on={notifs[n.key]} onChange={v => setNotifs(s => ({ ...s, [n.key]: v }))} />
                  </FieldRow>
                ))}
              </Card>
            </div>
          )}

          {/* ── ACCOUNT ── */}
          {tab === 'account' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              <Card style={{ marginBottom: 0 }}>
                <SectionLabel>Account</SectionLabel>
                <FieldRow label="Status" hint={isGuest ? `Guest mode · ${daysRemaining} days left` : 'Signed in'}>
                  {!isGuest && <span style={{ color: '#8fbc8f', fontSize: '13px' }}>{user?.email}</span>}
                </FieldRow>
                {isGuest && <UpgradeForm />}
                <button
                  onClick={handleLogout}
                  style={{
                    marginTop: '16px',
                    padding: '9px 16px', background: 'transparent', border: '1px solid #2a2a2a',
                    borderRadius: '8px', color: '#ccc', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Log out
                </button>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Upgrade guest → real account ────────────────────────────────────────────
function UpgradeForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'done' | error string

  async function handleUpgrade() {
    if (!email || password.length < 8) return;
    setStatus('loading');
    const { error } = await supabase.auth.updateUser({ email, password });
    if (error) { setStatus(error.message); return; }
    setStatus('done');
  }

  if (status === 'done') {
    return (
      <p style={{ color: '#8fbc8f', fontSize: '13px', margin: '14px 0 0' }}>
        Almost there — check your email to confirm the address, then you're a full account with all your guest data intact.
      </p>
    );
  }

  return (
    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ color: '#666', fontSize: '13px', margin: '0 0 6px' }}>Upgrade to a real account — keeps everything you've logged so far.</p>
      <input
        type="email" placeholder="Email address" value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ padding: '9px 12px', background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#e8e8e8', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
      />
      <input
        type="password" placeholder="Password (min. 8 characters)" value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ padding: '9px 12px', background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#e8e8e8', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
      />
      {status && status !== 'loading' && <span style={{ color: '#c07070', fontSize: '12px' }}>{status}</span>}
      <button
        onClick={handleUpgrade}
        disabled={!email || password.length < 8 || status === 'loading'}
        style={{
          padding: '9px 16px', background: '#8fbc8f', border: '1px solid #8fbc8f',
          borderRadius: '8px', color: '#0f0f0f', fontSize: '13px', fontWeight: 600,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: '4px',
        }}
      >
        {status === 'loading' ? 'Upgrading…' : 'Create account'}
      </button>
    </div>
  );
}
