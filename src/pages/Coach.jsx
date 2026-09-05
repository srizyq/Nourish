// src/pages/Coach.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { useMyClients, useTrainerComments, useClientFoodLogs } from '../hooks/useCoach';
import { useHistory } from '../hooks/useHistory';
import { useWeightLogs } from '../hooks/useWeightLogs';
import { getCheckinForDate } from '../lib/db';
import { todayLocalDate, dateNDaysAgo, dateRange, streakFor, computeStreak } from '../lib/patterns';
import { computeTrendWeight, toKg, fromKg } from '../lib/adaptiveTDEE';
import { round1 } from '../lib/format';
import DaySelector from '../components/DaySelector';
import LogItemRow from '../components/LogItemRow';
import LogoMark from '../components/LogoMark';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
const ACCENT = '#8fbc8f';
const WATER_BLUE = '#6aabcf';
const AI_PURPLE = '#9f97e8';
const RANGES = [{ id: 7, label: '7 days' }, { id: 30, label: '30 days' }, { id: 90, label: '90 days' }];
const GOAL_LABELS = { lose: 'Lose weight', maintain: 'Stay balanced', build: 'Build muscle' };
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' };

function generateInviteCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  return code;
}

function avg(nums) {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--bg-subtle)',
      border: '1px solid var(--border-default)',
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
    <p style={{ color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 18px' }}>
      {children}
    </p>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: value === '—' ? 'var(--border-strong)' : 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--border-strong)' }}>{hint}</div>
    </div>
  );
}

function EmptyChartBox({ icon, message }) {
  return (
    <div style={{ height: 180, border: '1px dashed var(--border-strong)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 28, color: 'var(--border-strong)' }} />
      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 200 }}>{message}</div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Coach() {
  const navigate = useNavigate();
  const { profile, save: saveProfile } = useProfile();
  const { clients, loading: clientsLoading, revoke } = useMyClients();
  const [selectedClient, setSelectedClient] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeError, setCodeError] = useState(null);

  // Coach Mode requires the pass — a direct /coach visit without it (or
  // after the pass lapses) bounces back to Settings rather than showing an
  // empty dashboard.
  useEffect(() => {
    if (profile && !profile.coach_pass) navigate('/settings');
  }, [profile, navigate]);

  if (!profile || !profile.coach_pass) return null;

  const exitCoachMode = async () => {
    await saveProfile({ coach_mode: false });
    navigate('/dashboard');
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    setCodeError(null);
    try {
      let lastErr = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await saveProfile({ coach_invite_code: generateInviteCode() });
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err; // likely a code collision — retry with a fresh one
        }
      }
      if (lastErr) throw lastErr;
    } catch (err) {
      setCodeError(err.message || "Couldn't generate a code — try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!profile.coach_invite_code) return;
    try {
      await navigator.clipboard.writeText(profile.coach_invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied — the code is still visible to copy by hand.
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="app-content-pad" style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div className="page-pad-top" style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px 16px',
          paddingTop: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-default)',
          position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={24} />
            <div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Coach Mode
              </h2>
              <p style={{ color: 'var(--text-hint)', fontSize: 13, margin: '2px 0 0' }}>
                {selectedClient ? (selectedClient.name || 'Client') : 'Your connected clients'}
              </p>
            </div>
          </div>
          <button
            onClick={selectedClient ? () => setSelectedClient(null) : exitCoachMode}
            style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            {selectedClient ? '← All clients' : 'Exit Coach Mode'}
          </button>
        </div>

        <div className="page-pad">
          {!selectedClient ? (
            <ClientListView
              profile={profile}
              clients={clients}
              loading={clientsLoading}
              generating={generating}
              codeError={codeError}
              copied={copied}
              onGenerate={handleGenerateCode}
              onCopy={handleCopyCode}
              onSelect={setSelectedClient}
              onRevoke={revoke}
            />
          ) : (
            <ClientDetailView client={selectedClient} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Client list + invite code ────────────────────────────────────────────────
function ClientListView({ profile, clients, loading, generating, codeError, copied, onGenerate, onCopy, onSelect, onRevoke }) {
  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <Card style={{ marginBottom: 0 }}>
        <SectionLabel>Invite a client</SectionLabel>
        {profile.coach_invite_code ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                flex: 1, padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
                borderRadius: 8, fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '0.1em',
                color: 'var(--accent)', textAlign: 'center',
              }}>
                {profile.coach_invite_code}
              </div>
              <button
                onClick={onCopy}
                style={{ padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>
              Share this code — a client enters it to connect their data to your dashboard.
            </p>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 12px' }}>Generate a code to start inviting clients.</p>
        )}
        {codeError && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '0 0 12px' }}>{codeError}</p>}
        <button
          onClick={onGenerate}
          disabled={generating}
          style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
        >
          {generating ? 'Generating…' : profile.coach_invite_code ? 'Regenerate code' : 'Generate code'}
        </button>
      </Card>

      <Card style={{ marginBottom: 0 }}>
        <SectionLabel>Your clients</SectionLabel>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
        ) : clients.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No clients connected yet — share your invite code to get started.</p>
        ) : (
          clients.map(row => (
            <ClientPreviewRow key={row.id} row={row} onSelect={onSelect} onRevoke={onRevoke} />
          ))
        )}
      </Card>
    </div>
  );
}

// A client row previews today's totals plus a 7-day average, fetched
// independently per row so one slow client never blocks the rest of the list.
function ClientPreviewRow({ row, onSelect, onRevoke }) {
  const today = todayLocalDate();
  const { dailyData, loading } = useHistory(dateNDaysAgo(6), today, row.client?.id);
  const todayData = dailyData.find(d => d.date === today);
  const loggedDays = dailyData.filter(d => d.loggedMeals > 0);
  const avgCal = loggedDays.length ? Math.round(avg(loggedDays.map(d => d.calories))) : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border-default)' }}>
      <button
        onClick={() => onSelect(row.client)}
        style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>{row.client?.name || 'Unnamed client'}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            {loading ? '…' : todayData ? `${Math.round(todayData.calories)} kcal today` : 'Nothing today'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Connected {new Date(row.created_at).toLocaleDateString()}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>
            {loading ? '' : avgCal != null ? `${avgCal.toLocaleString()} kcal/day · 7d avg` : 'No data yet'}
          </span>
        </div>
      </button>
      <button
        onClick={() => onRevoke(row.id)}
        title="Disconnect"
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}
      >
        <i className="ti ti-x" />
      </button>
    </div>
  );
}

// ─── Single client's dashboard ────────────────────────────────────────────────
function ClientDetailView({ client }) {
  const { theme } = useTheme();
  const today = todayLocalDate();
  const [date, setDate] = useState(today);
  const [range, setRange] = useState(7);
  const [checkin, setCheckin] = useState(null);
  const [commentBody, setCommentBody] = useState('');
  const [open, setOpen] = useState({ breakfast: true, lunch: true, dinner: true, snacks: true });
  const [expandedId, setExpandedId] = useState(null);

  const isLight = theme === 'light';
  const chartTextMuted = isLight ? '#6b6b6b' : '#666666';
  const chartGrid = isLight ? '#e7e7e5' : '#2a2a2a';

  const { dailyData, loading: historyLoading } = useHistory(dateNDaysAgo(range - 1), today, client.id);
  const { dailyData: badgeData } = useHistory(dateNDaysAgo(59), today, client.id);
  const { logs: weightLogs, latest: latestWeight, loading: weightLoading } = useWeightLogs(dateNDaysAgo(range - 1), today, client.id);
  const { meals, loading: foodLoading } = useClientFoodLogs(client.id, date);
  const { comments, addComment, removeComment } = useTrainerComments(client.id);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ci = await getCheckinForDate(client.id, date);
        if (!cancelled) setCheckin(ci);
      } catch (err) {
        console.error('Failed to load check-in:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [client.id, date]);

  const weightUnit = client.unit === 'imperial' ? 'lb' : 'kg';
  const calorieTarget = client.calorie_target || null;
  const proteinTarget = client.protein_g || null;

  const byDate = useMemo(() => new Map(dailyData.map(d => [d.date, d])), [dailyData]);
  const allDates = useMemo(() => dateRange(dateNDaysAgo(range - 1), today), [range, today]);
  const filledDays = allDates.map(d => byDate.get(d) || { date: d, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, loggedMeals: 0, energy: null, mood: null });
  const loggedDays = filledDays.filter(d => d.loggedMeals > 0);
  const hasData = loggedDays.length > 0;

  const avgCalories = Math.round(avg(loggedDays.map(d => d.calories)));
  const avgProtein = Math.round(avg(loggedDays.map(d => d.protein_g)));
  const daysOnTarget = calorieTarget ? loggedDays.filter(d => Math.abs(d.calories - calorieTarget) <= calorieTarget * 0.1).length : 0;
  const energyDays = filledDays.filter(d => d.energy != null);
  const avgEnergy = energyDays.length ? avg(energyDays.map(d => d.energy)).toFixed(1) : null;

  const loggingStreak = computeStreak(badgeData);
  const calorieStreak = calorieTarget ? streakFor(badgeData, d => d.calories > 0 && Math.abs(d.calories - calorieTarget) <= calorieTarget * 0.15) : 0;
  const moodStreak = streakFor(badgeData, d => d.mood != null);
  const proteinStreak = proteinTarget ? streakFor(badgeData, d => d.protein_g >= proteinTarget * 0.9) : 0;

  const labels = filledDays.map(d => new Date(d.date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }));

  const calorieChartData = {
    labels,
    datasets: [
      {
        label: 'Calories', data: filledDays.map(d => d.calories || null),
        borderColor: ACCENT, backgroundColor: ACCENT + '22', fill: true, tension: 0.3, spanGaps: true,
        pointRadius: range > 30 ? 0 : 3,
      },
      ...(calorieTarget ? [{
        label: 'Goal', data: filledDays.map(() => calorieTarget),
        borderColor: chartTextMuted, borderDash: [4, 4], pointRadius: 0, fill: false,
      }] : []),
    ],
  };

  const macroChartData = {
    labels,
    datasets: [
      { label: 'Protein', data: filledDays.map(d => d.protein_g || 0), backgroundColor: ACCENT },
      { label: 'Carbs', data: filledDays.map(d => d.carbs_g || 0), backgroundColor: WATER_BLUE },
      { label: 'Fat', data: filledDays.map(d => d.fat_g || 0), backgroundColor: AI_PURPLE },
    ],
  };

  const trendPoints = useMemo(() => computeTrendWeight(weightLogs), [weightLogs]);
  const trendByDate = useMemo(() => new Map(trendPoints.map(p => [p.date, p.trend])), [trendPoints]);
  const weightLabels = weightLogs.map(w => new Date(w.logged_date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }));
  const weightChartData = {
    labels: weightLabels,
    datasets: [
      {
        label: 'Weight', data: weightLogs.map(w => Math.round(fromKg(toKg(w.weight, w.unit), weightUnit) * 10) / 10),
        borderColor: ACCENT, backgroundColor: ACCENT + '22', fill: true, tension: 0.3, spanGaps: true,
        pointRadius: weightLogs.length > 60 ? 0 : 3,
      },
      {
        label: 'Trend',
        data: weightLogs.map(w => {
          const t = trendByDate.get(w.logged_date);
          return t != null ? Math.round(fromKg(t, weightUnit) * 10) / 10 : null;
        }),
        borderColor: WATER_BLUE, backgroundColor: 'transparent', fill: false, tension: 0.3, spanGaps: true,
        pointRadius: 0, borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: chartTextMuted, boxWidth: 10, font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: chartTextMuted, font: { size: 10 }, maxTicksLimit: 8 }, grid: { color: chartGrid } },
      y: { ticks: { color: chartTextMuted, font: { size: 10 } }, grid: { color: chartGrid } },
    },
  };
  const stackedOptions = {
    ...chartOptions,
    scales: {
      x: { ...chartOptions.scales.x, stacked: true },
      y: { ...chartOptions.scales.y, stacked: true },
    },
  };

  const handleAddComment = async () => {
    const body = commentBody.trim();
    if (!body) return;
    setCommentBody('');
    await addComment(body, date);
  };

  return (
    <div>
      {/* Goal & targets + stat cards */}
      <div className="grid-2" style={{ marginBottom: 16, alignItems: 'start' }}>
        <Card style={{ marginBottom: 0 }}>
          <SectionLabel>Goal &amp; targets</SectionLabel>
          <StatRow label="Goal" value={GOAL_LABELS[client.goal] || '—'} />
          <StatRow label="Calorie target" value={calorieTarget ? `${calorieTarget.toLocaleString()} kcal` : '—'} />
          <StatRow label="Protein" value={client.protein_g ? `${client.protein_g}g` : '—'} />
          <StatRow label="Carbs" value={client.carbs_g ? `${client.carbs_g}g` : '—'} />
          <StatRow label="Fat" value={client.fat_g ? `${client.fat_g}g` : '—'} />
        </Card>
        <div className="grid-2" style={{ gap: 12 }}>
          <StatCard label="Avg. calories" value={hasData ? avgCalories.toLocaleString() : '—'} hint={hasData ? `over ${loggedDays.length} logged days` : 'No data yet'} />
          <StatCard label="Days on target" value={hasData && calorieTarget ? daysOnTarget : '—'} hint={calorieTarget ? 'within 10% of goal' : 'No calorie target set'} />
          <StatCard label="Avg. protein" value={hasData ? `${avgProtein}g` : '—'} hint={hasData ? `over ${loggedDays.length} logged days` : 'No data yet'} />
          <StatCard label="Avg. energy" value={avgEnergy || '—'} hint={avgEnergy ? `over ${energyDays.length} check-ins` : 'No check-ins yet'} />
        </div>
      </div>

      {/* range toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {RANGES.map(r => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            style={{
              background: range === r.id ? 'var(--accent-bg)' : 'var(--bg-card)',
              border: `1px solid ${range === r.id ? 'var(--accent-dark)' : 'var(--border-strong)'}`,
              borderRadius: 8, padding: '7px 18px', fontSize: 13,
              color: range === r.id ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* charts */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <Card style={{ marginBottom: 0 }}>
          <SectionLabel>Calories vs goal</SectionLabel>
          {historyLoading ? null : hasData ? (
            <div style={{ height: 200 }}><Line data={calorieChartData} options={chartOptions} /></div>
          ) : (
            <EmptyChartBox icon="ti-chart-line" message="No logged days in this range" />
          )}
        </Card>
        <Card style={{ marginBottom: 0 }}>
          <SectionLabel>Macro breakdown</SectionLabel>
          {historyLoading ? null : hasData ? (
            <div style={{ height: 200 }}><Bar data={macroChartData} options={stackedOptions} /></div>
          ) : (
            <EmptyChartBox icon="ti-chart-bar" message="No logged days in this range" />
          )}
        </Card>
      </div>

      {/* weight chart */}
      <Card>
        <SectionLabel>Weight</SectionLabel>
        <div style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: 12 }}>
          {latestWeight ? `${latestWeight.weight}${latestWeight.unit}` : '—'}
        </div>
        {weightLoading ? null : weightLogs.length > 1 ? (
          <div style={{ height: 200 }}><Line data={weightChartData} options={chartOptions} /></div>
        ) : (
          <EmptyChartBox icon="ti-scale" message="Not enough weight entries in this range" />
        )}
      </Card>

      {/* streaks */}
      <Card>
        <SectionLabel>Streaks</SectionLabel>
        {[
          { icon: 'ti-flame', name: 'Logging streak', count: loggingStreak },
          { icon: 'ti-target', name: 'Calorie target', count: calorieStreak },
          { icon: 'ti-meat', name: 'Protein target', count: proteinStreak },
          { icon: 'ti-mood-smile', name: 'Mood check-ins', count: moodStreak },
        ].map((s, i, arr) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 16, color: s.count > 0 ? 'var(--accent)' : 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.name}</span>
            </div>
            <span style={{ color: s.count > 0 ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>{s.count} day{s.count === 1 ? '' : 's'}</span>
          </div>
        ))}
      </Card>

      {/* day-specific: food log + check-in + comments */}
      <div style={{ margin: '20px 0 16px' }}>
        <DaySelector selectedDate={date} onSelect={(d) => { setDate(d); setExpandedId(null); }} />
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Card style={{ marginBottom: 0 }}>
          <SectionLabel>Food log — {date}</SectionLabel>
          {foodLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(meals).map(([mealKey, items]) => {
                const mealTotal = Math.round(items.reduce((s, i) => s + i.cal, 0));
                const mealProtein = round1(items.reduce((s, i) => s + i.protein, 0));
                const mealCarbs = round1(items.reduce((s, i) => s + i.carbs, 0));
                const mealFat = round1(items.reduce((s, i) => s + i.fat, 0));
                const isOpen = open[mealKey];
                return (
                  <div key={mealKey} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden' }}>
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
                          <p style={{ color: 'var(--text-hint)', fontSize: 13, padding: '14px 18px' }}>Nothing logged</p>
                        ) : (
                          items.map(item => (
                            <LogItemRow
                              key={item.id}
                              item={item}
                              isExpanded={expandedId === item.id}
                              onToggle={() => setExpandedId(prev => (prev === item.id ? null : item.id))}
                              readOnly
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div>
          <Card>
            <SectionLabel>Check-in — {date}</SectionLabel>
            {checkin ? (
              <>
                <StatRow label="Mood" value={checkin.mood || '—'} />
                <StatRow label="Energy" value={checkin.energy ? `${checkin.energy}/10` : '—'} />
                <StatRow label="Water" value={`${checkin.water_glasses || 0} glasses`} />
                {checkin.note && <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '10px 0 0' }}>{checkin.note}</p>}
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No check-in logged this day.</p>
            )}
          </Card>

          <Card style={{ marginBottom: 0 }}>
            <SectionLabel>Comments</SectionLabel>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                placeholder={`Leave a note for ${client.name || 'this client'}…`}
                onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
                style={{ flex: 1, minWidth: 0, padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
              <button
                onClick={handleAddComment}
                disabled={!commentBody.trim()}
                style={{ padding: '9px 16px', background: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 8, color: '#0f0f0f', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
              >
                Post
              </button>
            </div>
            {comments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No comments yet.</p>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-default)' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{c.body}</p>
                    <p style={{ color: 'var(--text-hint)', fontSize: 11, margin: '4px 0 0' }}>
                      {c.comment_date ? `On ${c.comment_date} · ` : ''}{new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeComment(c.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}
                  >
                    <i className="ti ti-trash" />
                  </button>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
