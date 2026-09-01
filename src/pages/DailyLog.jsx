import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useFoodLogs } from '../hooks/useFoodLogs';
import { todayLocalDate } from '../lib/patterns';
import AppNav from '../components/AppNav';

const C = {
  bg: '#0f0f0f', bgCard: '#141414', bgRow: '#181818', border: '#1e1e1e', border2: '#2a2a2a',
  green: '#8fbc8f', blue: '#6aabcf', purple: '#9f97e8', textP: '#e8e8e8', textS: '#ccc', textM: '#555',
};

const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' };

const fieldStyle = { width: '100%', background: '#0f0f0f', border: `1px solid ${C.border2}`, borderRadius: 7, padding: '7px 10px', color: C.textP, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const labelStyle = { fontSize: 11, color: C.textM, marginBottom: 4, display: 'block' };

function LogItemRow({ item, isExpanded, onToggle, onDelete, onSave }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset the edit form whenever this row opens (or the underlying item
  // changes after a save), so stale edits from a previous expand don't
  // linger if you collapse without saving.
  useEffect(() => { if (isExpanded) setForm(item); }, [isExpanded, item]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        cal: Number(form.cal) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
        fibre: Number(form.fibre) || 0,
        sodium: Number(form.sodium) || 0,
        sugar: Number(form.sugar) || 0,
      });
    } catch (err) {
      console.error('Failed to save food log edits:', err);
      setError("Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', cursor: 'pointer' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: C.textS, fontSize: 14 }}>{item.name}</div>
          <div style={{ color: C.textM, fontSize: 12, marginTop: 2 }}>P {item.protein}g · C {item.carbs}g · F {item.fat}g</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ color: C.green, fontSize: 14, fontWeight: 500 }}>{item.cal}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', color: C.border2, cursor: 'pointer', fontSize: 15, padding: '2px 4px' }}>×</button>
          <span style={{ color: C.border2, fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {isExpanded && (
        <div style={{ padding: '4px 18px 16px', background: '#111' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
            <div><label style={labelStyle}>Calories</label><input style={fieldStyle} type="number" min="0" value={form.cal} onChange={e => set('cal', e.target.value)} /></div>
            <div><label style={labelStyle}>Protein (g)</label><input style={fieldStyle} type="number" min="0" value={form.protein} onChange={e => set('protein', e.target.value)} /></div>
            <div><label style={labelStyle}>Carbs (g)</label><input style={fieldStyle} type="number" min="0" value={form.carbs} onChange={e => set('carbs', e.target.value)} /></div>
            <div><label style={labelStyle}>Fat (g)</label><input style={fieldStyle} type="number" min="0" value={form.fat} onChange={e => set('fat', e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
            <div><label style={labelStyle}>Fibre (g)</label><input style={fieldStyle} type="number" min="0" value={form.fibre} onChange={e => set('fibre', e.target.value)} /></div>
            <div><label style={labelStyle}>Sodium (mg)</label><input style={fieldStyle} type="number" min="0" value={form.sodium} onChange={e => set('sodium', e.target.value)} /></div>
            <div><label style={labelStyle}>Sugar (g)</label><input style={fieldStyle} type="number" min="0" value={form.sugar} onChange={e => set('sugar', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ background: saving ? '#2a2a2a' : C.green, border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, color: saving ? '#666' : '#0f0f0f', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {error && <span style={{ color: '#c07070', fontSize: 12 }}>{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DailyLog() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const today = todayLocalDate();
  const { meals, loading, deleteFood, updateFood } = useFoodLogs(today);
  const [open, setOpen] = useState({ breakfast: true, lunch: true, dinner: true, snacks: true });
  const [expandedId, setExpandedId] = useState(null);

  const initials = (profile?.name || 'A').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';
  const totalCal = Object.values(meals).flat().reduce((s, i) => s + i.cal, 0);
  const dateStr = new Date().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.textP }}>
      <AppNav initials={initials} />

      <div className="app-content-pad" style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div className="page-pad-top" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, paddingBottom: 14, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: C.textM, cursor: 'pointer', fontSize: 18, display: 'flex' }}>
            <i className="ti ti-arrow-left" />
          </button>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>Daily log</span>
        </div>

        <div className="page-pad" style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: C.textM }}>{dateStr}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: C.green }}>{Math.round(totalCal).toLocaleString()} kcal logged</div>
            </div>
            <div title="Hourly timeline — a paid feature, coming later" style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bgCard, border: `1px solid ${C.border2}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, color: C.textM }}>
              <i className="ti ti-lock" style={{ fontSize: 12 }} /> Hourly timeline (Premium)
            </div>
          </div>

          {loading ? null : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(meals).map(([mealKey, items]) => {
                const mealTotal = items.reduce((s, i) => s + i.cal, 0);
                const isOpen = open[mealKey];
                return (
                  <div key={mealKey} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    <button onClick={() => setOpen(o => ({ ...o, [mealKey]: !o[mealKey] }))} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: C.textS }}>{MEAL_LABELS[mealKey]}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: C.textM, fontSize: 13 }}>{mealTotal} kcal</span>
                        <span style={{ color: C.border2, fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ borderTop: `1px solid ${C.border}` }}>
                        {items.length === 0 ? (
                          <p style={{ color: C.border2, fontSize: 13, padding: '14px 18px' }}>Nothing logged yet</p>
                        ) : (
                          items.map(item => (
                            <LogItemRow
                              key={item.id}
                              item={item}
                              isExpanded={expandedId === item.id}
                              onToggle={() => setExpandedId(prev => (prev === item.id ? null : item.id))}
                              onDelete={() => deleteFood(item.id)}
                              onSave={async (fields) => { await updateFood(item.id, fields); setExpandedId(null); }}
                            />
                          ))
                        )}
                        <button onClick={() => navigate('/food', { state: { openMeal: mealKey } })} style={{ width: '100%', background: 'none', border: 'none', color: '#3a5a3a', fontSize: 13, cursor: 'pointer', padding: '12px 18px', textAlign: 'left' }}>
                          + Add food
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
