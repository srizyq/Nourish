import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useFoodLogs } from '../hooks/useFoodLogs';
import { todayLocalDate } from '../lib/patterns';
import AppNav from '../components/AppNav';
import LogItemRow from '../components/LogItemRow';
import { round1 } from '../lib/format';

const C = {
  bg: '#0f0f0f', bgCard: '#141414', bgRow: '#181818', border: '#1e1e1e', border2: '#2a2a2a',
  green: '#8fbc8f', blue: '#6aabcf', purple: '#9f97e8', textP: '#e8e8e8', textS: '#ccc', textM: '#555',
};

const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' };

export default function DailyLog() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const isPremium = !!profile?.is_premium;
  const today = todayLocalDate();
  const { meals, hourlyGroups, loading, deleteFood, updateFood } = useFoodLogs(today);
  const [open, setOpen] = useState({ breakfast: true, lunch: true, dinner: true, snacks: true });
  const [openHours, setOpenHours] = useState({});
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
            {!isPremium && (
              <div title="Hourly timeline — a Pro feature" style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bgCard, border: `1px solid ${C.border2}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, color: C.textM }}>
                <i className="ti ti-lock" style={{ fontSize: 12 }} /> Hourly timeline (Pro)
              </div>
            )}
          </div>

          {loading ? null : isPremium ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hourlyGroups.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: C.textM, fontSize: 13, background: C.bgCard, border: `1px dashed ${C.border2}`, borderRadius: 10 }}>
                  Nothing logged today yet.
                </div>
              )}
              {hourlyGroups.map(({ hour, label, items }) => {
                const hourTotal = Math.round(items.reduce((s, i) => s + i.cal, 0));
                const hourProtein = round1(items.reduce((s, i) => s + i.protein, 0));
                const hourCarbs = round1(items.reduce((s, i) => s + i.carbs, 0));
                const hourFat = round1(items.reduce((s, i) => s + i.fat, 0));
                const isOpen = openHours[hour] ?? true;
                return (
                  <div key={hour} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    <button onClick={() => setOpenHours(o => ({ ...o, [hour]: !isOpen }))} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: C.textS }}>{label}</div>
                        <div style={{ color: C.textM, fontSize: 12, marginTop: 2 }}>P {hourProtein}g · C {hourCarbs}g · F {hourFat}g</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: C.textM, fontSize: 13 }}>{hourTotal} kcal</span>
                        <span style={{ color: C.border2, fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ borderTop: `1px solid ${C.border}` }}>
                        {items.map(item => (
                          <LogItemRow
                            key={item.id}
                            item={item}
                            isExpanded={expandedId === item.id}
                            onToggle={() => setExpandedId(prev => (prev === item.id ? null : item.id))}
                            onDelete={() => deleteFood(item.id)}
                            onSave={async (fields) => { await updateFood(item.id, fields); setExpandedId(null); }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={() => navigate('/food')} style={{ background: 'none', border: `1px dashed ${C.border2}`, borderRadius: 12, color: '#3a5a3a', fontSize: 13, cursor: 'pointer', padding: '12px 18px', textAlign: 'left' }}>
                + Add food
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(meals).map(([mealKey, items]) => {
                const mealTotal = Math.round(items.reduce((s, i) => s + i.cal, 0));
                const mealProtein = round1(items.reduce((s, i) => s + i.protein, 0));
                const mealCarbs = round1(items.reduce((s, i) => s + i.carbs, 0));
                const mealFat = round1(items.reduce((s, i) => s + i.fat, 0));
                const isOpen = open[mealKey];
                return (
                  <div key={mealKey} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    <button onClick={() => setOpen(o => ({ ...o, [mealKey]: !o[mealKey] }))} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: C.textS }}>{MEAL_LABELS[mealKey]}</div>
                        {items.length > 0 && <div style={{ color: C.textM, fontSize: 12, marginTop: 2 }}>P {mealProtein}g · C {mealCarbs}g · F {mealFat}g</div>}
                      </div>
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
