import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useFoodLogs } from '../hooks/useFoodLogs';
import { todayLocalDate } from '../lib/patterns';
import AppNav from '../components/AppNav';
import LogItemRow from '../components/LogItemRow';
import { round1 } from '../lib/format';

const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' };

export default function DailyLog() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const isPremium = !!profile?.is_premium;
  const today = todayLocalDate();
  // The Progress page calendar links here with a specific date to jump
  // straight to that day instead of always landing on today.
  const [selectedDate, setSelectedDate] = useState(() => {
    const requested = location.state?.date;
    return requested && requested <= today ? requested : today;
  });
  const isToday = selectedDate === today;
  const { meals, hourlyGroups, loading, deleteFood, updateFood } = useFoodLogs(selectedDate);
  const [open, setOpen] = useState({ breakfast: true, lunch: true, dinner: true, snacks: true });
  const [openHours, setOpenHours] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  function shiftDate(days) {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const next = todayLocalDate(d);
    if (next > today) return; // no browsing into the future
    setSelectedDate(next);
    setExpandedId(null);
  }

  const initials = (profile?.name || 'A').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';
  const totalCal = Object.values(meals).flat().reduce((s, i) => s + i.cal, 0);
  const dateStr = isToday
    ? 'Today'
    : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif", color: 'var(--text-primary)' }}>
      <AppNav initials={initials} />

      <div className="app-content-pad" style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div className="page-pad-top" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, paddingBottom: 14, borderBottom: '1px solid var(--border-default)', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, display: 'flex' }}>
            <i className="ti ti-arrow-left" />
          </button>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>Daily log</span>
        </div>

        <div className="page-pad" style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => shiftDate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, display: 'flex', padding: 2 }} aria-label="Previous day">
                  <i className="ti ti-chevron-left" />
                </button>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 90, textAlign: 'center' }}>{dateStr}</div>
                <button onClick={() => shiftDate(1)} disabled={isToday} style={{ background: 'none', border: 'none', color: isToday ? 'var(--border-strong)' : 'var(--text-muted)', cursor: isToday ? 'default' : 'pointer', fontSize: 16, display: 'flex', padding: 2 }} aria-label="Next day">
                  <i className="ti ti-chevron-right" />
                </button>
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--accent)', textAlign: 'center' }}>{Math.round(totalCal).toLocaleString()} kcal logged</div>
            </div>
            {!isPremium && (
              <div title="Hourly timeline — a Pro feature" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 20, padding: '5px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
                <i className="ti ti-lock" style={{ fontSize: 12 }} /> Hourly timeline (Pro)
              </div>
            )}
          </div>

          {loading ? null : isPremium ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hourlyGroups.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-subtle)', border: '1px dashed var(--border-strong)', borderRadius: 10 }}>
                  {isToday ? 'Nothing logged today yet.' : 'Nothing logged this day.'}
                </div>
              )}
              {hourlyGroups.map(({ hour, label, items }) => {
                const hourTotal = Math.round(items.reduce((s, i) => s + i.cal, 0));
                const hourProtein = round1(items.reduce((s, i) => s + i.protein, 0));
                const hourCarbs = round1(items.reduce((s, i) => s + i.carbs, 0));
                const hourFat = round1(items.reduce((s, i) => s + i.fat, 0));
                const isOpen = openHours[hour] ?? true;
                return (
                  <div key={hour} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden' }}>
                    <button onClick={() => setOpenHours(o => ({ ...o, [hour]: !isOpen }))} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)' }}>{label}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>P {hourProtein}g · C {hourCarbs}g · F {hourFat}g</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{hourTotal} kcal</span>
                        <span style={{ color: 'var(--border-strong)', fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border-default)' }}>
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
              <button onClick={() => navigate('/food', { state: { date: selectedDate } })} style={{ background: 'none', border: '1px dashed var(--border-strong)', borderRadius: 12, color: 'var(--accent-dark)', fontSize: 13, cursor: 'pointer', padding: '12px 18px', textAlign: 'left' }}>
                + Add food{!isToday ? ` to ${dateStr}` : ''}
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
                  <div key={mealKey} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden' }}>
                    <button onClick={() => setOpen(o => ({ ...o, [mealKey]: !o[mealKey] }))} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)' }}>{MEAL_LABELS[mealKey]}</div>
                        {items.length > 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>P {mealProtein}g · C {mealCarbs}g · F {mealFat}g</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{mealTotal} kcal</span>
                        <span style={{ color: 'var(--border-strong)', fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border-default)' }}>
                        {items.length === 0 ? (
                          <p style={{ color: 'var(--text-hint)', fontSize: 13, padding: '14px 18px' }}>Nothing logged yet</p>
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
                        <button onClick={() => navigate('/food', { state: { openMeal: mealKey, date: selectedDate } })} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--accent-dark)', fontSize: 13, cursor: 'pointer', padding: '12px 18px', textAlign: 'left' }}>
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
