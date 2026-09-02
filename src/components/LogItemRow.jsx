import { useState, useEffect } from 'react';
import { round1 } from '../lib/format';

const C = {
  border: '#1e1e1e', border2: '#2a2a2a',
  green: '#8fbc8f', textP: '#e8e8e8', textS: '#ccc', textM: '#555',
};

const fieldStyle = { width: '100%', background: '#0f0f0f', border: `1px solid ${C.border2}`, borderRadius: 7, padding: '7px 10px', color: C.textP, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const labelStyle = { fontSize: 11, color: C.textM, marginBottom: 4, display: 'block' };

// A logged food row that expands in place to edit its macros — shared
// between the Dashboard's compact meal log and the full /log page so both
// stay in sync instead of drifting into two separate editing UIs.
export default function LogItemRow({ item, isExpanded, onToggle, onDelete, onSave }) {
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
          <div style={{ color: C.textM, fontSize: 12, marginTop: 2 }}>P {round1(item.protein)}g · C {round1(item.carbs)}g · F {round1(item.fat)}g</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ color: C.green, fontSize: 14, fontWeight: 500 }}>{Math.round(item.cal)}</span>
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
