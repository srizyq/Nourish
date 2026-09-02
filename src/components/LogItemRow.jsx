import { useState, useEffect } from 'react';
import { round1 } from '../lib/format';
import { scaleFood } from '../lib/foodMath';

const C = {
  border: '#1e1e1e', border2: '#2a2a2a',
  green: '#8fbc8f', textP: '#e8e8e8', textS: '#ccc', textM: '#555',
};

const fieldStyle = { width: '100%', background: '#0f0f0f', border: `1px solid ${C.border2}`, borderRadius: 7, padding: '7px 10px', color: C.textP, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const labelStyle = { fontSize: 11, color: C.textM, marginBottom: 4, display: 'block' };

// A logged food row that expands in place to edit how much of it you had —
// shared between the Dashboard's compact meal log and the full /log page
// so both stay in sync instead of drifting into two separate editing UIs.
// Editing scales every macro/micronutrient from the currently-logged
// amount (via a servings multiplier) rather than hand-typing new numbers,
// so the values stay internally consistent.
export default function LogItemRow({ item, isExpanded, onToggle, onDelete, onSave }) {
  const [servings, setServings] = useState('1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset to "1" (i.e. no change) whenever this row opens, so stale edits
  // from a previous expand don't linger if you collapse without saving.
  useEffect(() => { if (isExpanded) setServings('1'); }, [isExpanded, item]);

  const servingsNum = Number(servings) || 0;
  const preview = scaleFood(item, servingsNum);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...preview,
        servingGrams: item.servingGrams ? Math.round(item.servingGrams * servingsNum) : null,
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
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Servings (1 = what's currently logged)</label>
            <input style={{ ...fieldStyle, width: 100 }} type="number" min="0" step="0.25" value={servings} onChange={e => setServings(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
            <div><label style={labelStyle}>Calories</label><div style={fieldStyle}>{preview.cal}</div></div>
            <div><label style={labelStyle}>Protein (g)</label><div style={fieldStyle}>{round1(preview.protein)}</div></div>
            <div><label style={labelStyle}>Carbs (g)</label><div style={fieldStyle}>{round1(preview.carbs)}</div></div>
            <div><label style={labelStyle}>Fat (g)</label><div style={fieldStyle}>{round1(preview.fat)}</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
            <div><label style={labelStyle}>Fibre (g)</label><div style={fieldStyle}>{round1(preview.fibre)}</div></div>
            <div><label style={labelStyle}>Sodium (mg)</label><div style={fieldStyle}>{Math.round(preview.sodium)}</div></div>
            <div><label style={labelStyle}>Sugar (g)</label><div style={fieldStyle}>{round1(preview.sugar)}</div></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving || !servingsNum}
              style={{ background: saving || !servingsNum ? '#2a2a2a' : C.green, border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, color: saving || !servingsNum ? '#666' : '#0f0f0f', cursor: saving || !servingsNum ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
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
