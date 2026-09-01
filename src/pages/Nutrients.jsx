import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useFoodLogs } from '../hooks/useFoodLogs';
import { todayLocalDate } from '../lib/patterns';
import AppNav from '../components/AppNav';

const C = {
  bg: '#0f0f0f', bgCard: '#141414', border: '#1e1e1e', border2: '#2a2a2a',
  green: '#8fbc8f', blue: '#6aabcf', purple: '#9f97e8', gold: '#e8c468',
  textP: '#e8e8e8', textS: '#ccc', textM: '#555',
};

function MacroRow({ label, value, unit, target, color }) {
  const pct = target ? Math.min((value / target) * 100, 100) : null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.textS }}>{label}</span>
        <span style={{ fontSize: 13, color: C.textP, fontWeight: 600 }}>
          {value}{unit}{target ? <span style={{ color: C.textM, fontWeight: 400 }}> / {target}{unit}</span> : null}
        </span>
      </div>
      {pct !== null && (
        <div style={{ height: 6, background: C.border, borderRadius: 99 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
        </div>
      )}
    </div>
  );
}

function MicroCard({ icon, label, value, unit, guideline, color }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, background: color + '22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <i className={`ti ${icon}`} style={{ fontSize: 16 }} />
        </div>
        <span style={{ fontSize: 13, color: C.textS }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: C.textP }}>
        {value}<span style={{ fontSize: 14, color: C.textM, fontWeight: 400 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, color: C.textM, marginTop: 4 }}>{guideline}</div>
    </div>
  );
}

export default function Nutrients() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const today = todayLocalDate();
  const { logs, loading } = useFoodLogs(today);

  const initials = (profile?.name || 'A').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';

  const totals = logs.reduce((t, row) => ({
    cal: t.cal + (Number(row.calories) || 0),
    protein: t.protein + (Number(row.protein_g) || 0),
    carbs: t.carbs + (Number(row.carbs_g) || 0),
    fat: t.fat + (Number(row.fat_g) || 0),
    fibre: t.fibre + (Number(row.fibre_g) || 0),
    sodium: t.sodium + (Number(row.sodium_mg) || 0),
    sugar: t.sugar + (Number(row.sugar_g) || 0),
  }), { cal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, sugar: 0 });

  const round1 = n => Math.round(n * 10) / 10;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.textP }}>
      <AppNav initials={initials} />

      <div className="app-content-pad" style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div className="page-pad-top" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, paddingBottom: 14, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: C.textM, cursor: 'pointer', fontSize: 18, display: 'flex' }}>
            <i className="ti ti-arrow-left" />
          </button>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>Nutrients</span>
        </div>

        <div className="page-pad" style={{ maxWidth: 700 }}>
          {loading ? null : (
            <>
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: C.textM, marginBottom: 4 }}>Today's calories</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 700, color: C.green, marginBottom: 20 }}>
                  {Math.round(totals.cal).toLocaleString()}
                  {profile?.calorie_target ? <span style={{ fontSize: 16, color: C.textM, fontWeight: 400 }}> / {profile.calorie_target.toLocaleString()} kcal</span> : ' kcal'}
                </div>
                <MacroRow label="Protein" value={round1(totals.protein)} unit="g" target={profile?.protein_g} color={C.green} />
                <MacroRow label="Carbs" value={round1(totals.carbs)} unit="g" target={profile?.carbs_g} color={C.blue} />
                <MacroRow label="Fat" value={round1(totals.fat)} unit="g" target={profile?.fat_g} color={C.purple} />
              </div>

              <div style={{ fontSize: 11, color: C.textM, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Other nutrients</div>
              <div className="grid-3" style={{ marginBottom: 20 }}>
                <MicroCard icon="ti-leaf" label="Fibre" value={round1(totals.fibre)} unit="g" guideline="Guideline: 25–30g/day" color={C.green} />
                <MicroCard icon="ti-droplet" label="Sodium" value={Math.round(totals.sodium)} unit="mg" guideline="Guideline: under 2,300mg/day" color={C.blue} />
                <MicroCard icon="ti-candy" label="Sugar" value={round1(totals.sugar)} unit="g" guideline="Guideline: under 50g/day" color={C.gold} />
              </div>

              {logs.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: C.textM, fontSize: 13, background: C.bgCard, border: `1px dashed ${C.border2}`, borderRadius: 10 }}>
                  Nothing logged today yet — log some food to see your full nutrient breakdown here.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
