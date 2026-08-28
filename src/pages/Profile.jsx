import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';

// ─── Sidebar (matches AI Insights — avatar active here) ────────────────────────
function Sidebar({ navigate, initials }) {
  const sbIconBase = {
    width: 36, height: 36, display: "flex", alignItems: "center",
    justifyContent: "center", borderRadius: 8, cursor: "pointer",
    color: "#666666", fontSize: 18,
  };

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

      <div style={sbIconBase} title="Settings" onClick={() => navigate("/settings")}><i className="ti ti-settings" /></div>
      <div
        title="Profile"
        style={{
          width: 32, height: 32, background: "#0f1a0f", border: "1px solid #4a7a4a",
          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color: "#8fbc8f", fontWeight: 600, cursor: "pointer",
        }}
      >{initials}</div>
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

function TextInput({ value, onChange, type = 'text', suffix, width = '120px' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width,
          padding: '9px 12px',
          background: '#0f0f0f',
          border: '1px solid #2a2a2a',
          borderRadius: '8px',
          color: '#e8e8e8',
          fontSize: '14px',
          fontFamily: "'DM Sans', sans-serif",
          outline: 'none',
        }}
        onFocus={e => (e.target.style.borderColor = '#4a7a4a')}
        onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
      />
      {suffix && <span style={{ color: '#555', fontSize: '13px' }}>{suffix}</span>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, save: saveProfile } = useProfile();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({ name: '', unit: 'metric', age: 30, weight: 70, height: 170 });

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || '',
      unit: profile.unit || 'metric',
      age: profile.age || 30,
      weight: profile.weight || 70,
      height: profile.height || 170,
    });
  }, [profile]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const isGuest = !!user?.is_anonymous;
  const daysRemaining = user?.created_at
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000))
    : 7;
  const initials = (form.name || 'A').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';

  const handleSave = async () => {
    await saveProfile({
      name: form.name,
      unit: form.unit,
      age: Number(form.age),
      weight: Number(form.weight),
      height: Number(form.height),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f0f', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar navigate={navigate} initials={initials} />

      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: '1px solid #1e1e1e',
          position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10,
        }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, color: '#e8e8e8', margin: 0 }}>
              Profile
            </h2>
            <p style={{ color: '#444', fontSize: '13px', margin: '2px 0 0' }}>Your personal details and body stats</p>
          </div>
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
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px' }}>

          {/* Identity header */}
          <Card style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#0f1a0f', border: '1px solid #4a7a4a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#8fbc8f', flexShrink: 0,
              fontFamily: "'Syne', sans-serif",
            }}>
              {initials}
            </div>
            <div>
              <div style={{ color: '#e8e8e8', fontSize: '20px', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
                {form.name || 'Your name'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{
                  fontSize: '12px', padding: '3px 10px', borderRadius: '99px',
                  background: isGuest ? '#1a1410' : '#0f1a0f',
                  border: `1px solid ${isGuest ? '#3a2e1e' : '#3a5a3a'}`,
                  color: isGuest ? '#b48250' : '#8fbc8f',
                }}>
                  {isGuest ? `Guest · ${daysRemaining} days left` : 'Member'}
                </span>
                {!isGuest && user?.email && <span style={{ color: '#555', fontSize: '13px' }}>{user.email}</span>}
              </div>
            </div>
          </Card>

          {/* Details + stats, side by side like the rest of the app */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
            <Card style={{ marginBottom: 0 }}>
              <SectionLabel>Your details</SectionLabel>
              <FieldRow label="Name">
                <TextInput value={form.name} onChange={v => set('name', v)} width="180px" />
              </FieldRow>
              <FieldRow label="Units">
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { value: 'metric',   label: 'Metric (kg/cm)' },
                    { value: 'imperial', label: 'Imperial (lb/in)' },
                  ].map(u => {
                    const sel = form.unit === u.value;
                    return (
                      <button
                        key={u.value}
                        onClick={() => set('unit', u.value)}
                        style={{
                          padding: '8px 12px',
                          background: sel ? '#0f1a0f' : '#0f0f0f',
                          border: `1px solid ${sel ? '#3a5a3a' : '#2a2a2a'}`,
                          borderRadius: '8px',
                          color: sel ? '#8fbc8f' : '#666',
                          fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              </FieldRow>
            </Card>

            <Card style={{ marginBottom: 0 }}>
              <SectionLabel>Body stats</SectionLabel>
              <FieldRow label="Age">
                <TextInput value={form.age} onChange={v => set('age', v)} type="number" suffix="years" width="90px" />
              </FieldRow>
              <FieldRow label="Weight">
                <TextInput value={form.weight} onChange={v => set('weight', v)} type="number" suffix={form.unit === 'imperial' ? 'lb' : 'kg'} width="90px" />
              </FieldRow>
              <FieldRow label="Height">
                <TextInput value={form.height} onChange={v => set('height', v)} type="number" suffix={form.unit === 'imperial' ? 'in' : 'cm'} width="90px" />
              </FieldRow>
              <p style={{ color: '#444', fontSize: '12px', margin: '14px 0 0' }}>
                These feed your calculated calorie target on the Goals tab in Settings.
              </p>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
