import { useState, useEffect } from 'react';
import { round1 } from '../lib/format';
import { scaleFood, UNITS, amountToServings } from '../lib/foodMath';

const C = {
  border: '#1e1e1e', border2: '#2a2a2a',
  green: '#8fbc8f', blue: '#6aabcf', purple: '#9f97e8',
  textP: '#e8e8e8', textS: '#ccc', textM: '#555',
};

const fieldStyle = { width: '100%', background: '#0f0f0f', border: `1px solid ${C.border2}`, borderRadius: 7, padding: '7px 10px', color: C.textP, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const labelStyle = { fontSize: 11, color: C.textM, marginBottom: 4, display: 'block' };

// Plain text macro readout — matches the style used everywhere else in the
// app (e.g. FoodCard's add-food preview) instead of a bordered box.
function MacroReadout({ value, unit, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}{unit}</div>
      <div style={{ fontSize: 11, color: C.textM, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// A logged food row that expands in place to edit how much of it you had —
// shared between the Dashboard's compact meal log and the full /log page
// so both stay in sync instead of drifting into two separate editing UIs.
// You can only change the amount (a number + unit — serving/g/kg/lb/oz,
// the same picker used when adding food), never the macros directly; every
// macro/micronutrient is scaled proportionally from the currently-logged
// amount so the numbers always stay internally consistent.
export default function LogItemRow({ item, isExpanded, onToggle, onDelete, onSave }) {
  // Older items logged before serving_grams was tracked have no real
  // weight on record. Silently guessing 100g there would look precise
  // without being true — so weight-based units are only offered when we
  // actually know what this item weighs.
  const hasKnownWeight = !!item.servingGrams;

  const [amount, setAmount] = useState(hasKnownWeight ? String(item.servingGrams) : '1');
  const [unit, setUnit] = useState(hasKnownWeight ? 'g' : 'serving');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset whenever this row opens, so stale edits from a previous expand
  // don't linger if you collapse without saving. Deliberately NOT "1
  // serving" for known-weight items — "serving" would mean "whatever's
  // currently saved", which silently redefines itself on every edit (e.g.
  // scaling to 10x and saving makes 10x the new "1 serving" forever after,
  // compounding on the next edit). Grams are an absolute, stable anchor
  // instead: the box always shows and edits the item's real current
  // weight, so typing the same number back always gives the same result.
  useEffect(() => {
    if (!isExpanded) return;
    setAmount(hasKnownWeight ? String(item.servingGrams) : '1');
    setUnit(hasKnownWeight ? 'g' : 'serving');
  }, [isExpanded, item, hasKnownWeight]);

  // "serving" is only offered when there's no real weight to anchor to —
  // otherwise it's the same ambiguous, self-redefining reference point
  // that caused the bug above.
  const availableUnits = hasKnownWeight ? UNITS.filter(u => u.id !== 'serving') : UNITS.filter(u => u.id === 'serving');
  const servingGrams = item.servingGrams || 100;
  const servings = amountToServings(Number(amount) || 0, unit, servingGrams);
  const gramsEquivalent = Math.round(servings * servingGrams);
  const preview = scaleFood(item, servings || 0);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Only persist a servingGrams value when the item actually had one —
      // otherwise a "2 servings" edit on a legacy item with no real weight
      // would silently fabricate one from the 100g fallback and make it
      // look gram-accurate on the next edit.
      await onSave({ ...preview, servingGrams: hasKnownWeight ? gramsEquivalent : null });
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
            <label style={labelStyle}>{hasKnownWeight ? `Amount (currently ${item.servingGrams}g)` : 'Amount ("1 serving" = what\'s currently logged)'}</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input style={{ ...fieldStyle, width: 90 }} type="number" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} />
              <div style={{ display: 'flex', background: '#0f0f0f', border: `1px solid ${C.border2}`, borderRadius: 20, padding: 2 }}>
                {availableUnits.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUnit(u.id)}
                    style={{
                      background: unit === u.id ? '#2a3a2a' : 'transparent', border: 'none', borderRadius: 18,
                      padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      color: unit === u.id ? C.green : C.textM, transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
            {!hasKnownWeight && <div style={{ fontSize: 11, color: C.textM, marginTop: 4 }}>No serving size on record for this item — only relative scaling is available (1 = what's currently logged). Delete and re-add it via search for gram-accurate editing.</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
            <MacroReadout value={preview.cal} unit="" label="Calories" color={C.green} />
            <MacroReadout value={round1(preview.protein)} unit="g" label="Protein" color={C.green} />
            <MacroReadout value={round1(preview.carbs)} unit="g" label="Carbs" color={C.blue} />
            <MacroReadout value={round1(preview.fat)} unit="g" label="Fat" color={C.purple} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving || !servings}
              style={{ background: saving || !servings ? '#2a2a2a' : C.green, border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, color: saving || !servings ? '#666' : '#0f0f0f', cursor: saving || !servings ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
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
