import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { useProfile } from "../hooks/useProfile";
import { useHistory } from "../hooks/useHistory";
import { useWeightLogs } from "../hooks/useWeightLogs";
import { todayLocalDate, dateNDaysAgo, dateRange, streakFor, computeStreak } from "../lib/patterns";
import { computeTrendWeight, computeExpenditureHistory, toKg, fromKg } from "../lib/adaptiveTDEE";
import AppNav from "../components/AppNav";
import LogCalendar from "../components/LogCalendar";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const WEIGHT_RANGES = [
  { id: "7d", label: "1 week", days: 7 },
  { id: "30d", label: "1 month", days: 30 },
  { id: "90d", label: "3 months", days: 90 },
  { id: "365d", label: "1 year", days: 365 },
  { id: "5y", label: "5 years", days: 1825 },
  { id: "all", label: "All time", days: null },
];

// ── colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        "#0f0f0f",
  bgCard:    "#181818",
  bgSubtle:  "#141414",
  bgAI:      "#0f1a0f",
  border:    "#1e1e1e",
  border2:   "#2a2a2a",
  borderA:   "#3a5a3a",
  borderA2:  "#4a7a4a",
  green:     "#8fbc8f",
  greenDark: "#4a7a4a",
  blue:      "#6aabcf",
  purple:    "#9f97e8",
  textP:     "#e8e8e8",
  textS:     "#cccccc",
  textM:     "#666666",
};

const RANGES = [
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
  { id: 90, label: "90 days" },
];

function avg(nums) {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}


// ── stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, hint }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ fontSize: 11, color: C.textM, textTransform: "uppercase", letterSpacing: "0.8px" }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: value === "—" ? C.border2 : C.textP, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.border2 }}>{hint}</div>
    </div>
  );
}

// ── streak badge row ──────────────────────────────────────────────────────
function StreakItem({ icon, iconBg, iconColor, name, count }) {
  const active = count > 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, opacity: active ? 1 : 0.4 }}>
        <i className={`ti ${icon}`} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: active ? C.textS : C.textM }}>{name}</div>
        <div style={{ fontSize: 12, color: C.border2 }}>{active ? `${count} day${count === 1 ? "" : "s"} in a row` : "Not started yet"}</div>
      </div>
      <div style={{ background: active ? C.bgAI : C.bgCard, border: `1px solid ${active ? C.borderA : C.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 12, color: active ? C.green : C.border2 }}>
        {count}
      </div>
    </div>
  );
}

// ── week-at-a-glance bars ────────────────────────────────────────────────
export function WeekBars({ days, calorieTarget }) {
  const max = Math.max(calorieTarget || 0, ...days.map(d => d.calories), 1);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 100 }}>
        {days.map((d) => {
          const pct = Math.max(4, (d.calories / max) * 100);
          const onTarget = calorieTarget && d.calories > 0 && Math.abs(d.calories - calorieTarget) <= calorieTarget * 0.15;
          return (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: 100 }}>
              <div style={{
                width: "100%", height: `${pct}%`, borderRadius: "4px 4px 0 0",
                background: d.calories === 0 ? C.border : onTarget ? C.green : C.blue,
                transition: "height 0.5s ease",
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        {days.map((d) => (
          <div key={d.date} style={{ flex: 1, textAlign: "center", fontSize: 10, color: C.textM }}>
            {new Date(d.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short" })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────
export default function Progress() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [range, setRange] = useState(30);
  const [weightRange, setWeightRange] = useState("30d");
  const initials = (profile?.name || 'A').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';

  const today = todayLocalDate();
  const { dailyData, loading } = useHistory(dateNDaysAgo(range - 1), today);
  const { dailyData: badgeData } = useHistory(dateNDaysAgo(59), today);

  // Calendar browses independently of the 7/30/90-day stat range, so it
  // needs its own fetch scoped to whatever month is currently shown.
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const calMonthStart = todayLocalDate(calMonth);
  const calMonthEnd = todayLocalDate(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0));
  const { dailyData: calData, loading: calLoading } = useHistory(calMonthStart, calMonthEnd);
  const calByDate = useMemo(() => new Map(calData.map(d => [d.date, d])), [calData]);
  const canGoNextMonth = calMonthStart < todayLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const weightRangeDays = WEIGHT_RANGES.find(r => r.id === weightRange)?.days;
  const { logs: weightLogs, loading: weightLoading } = useWeightLogs(
    weightRangeDays ? dateNDaysAgo(weightRangeDays - 1) : null,
    today
  );
  const weightUnit = profile?.unit === "imperial" ? "lb" : "kg";

  // Expenditure history needs calorie data spanning the same window as
  // the weight chart, which can run much longer than the 7/30/90-day
  // stat range above — a separate fetch scoped to weightRange rather
  // than reusing `dailyData`. "All time" has no real startDate in
  // WEIGHT_RANGES; getFoodLogsForRange needs a concrete date, so it
  // falls back to a 5-year lookback as a practical stand-in for "all".
  const { dailyData: expenditureDailyData } = useHistory(
    dateNDaysAgo((weightRangeDays || 1825) - 1),
    today
  );

  const calorieTarget = profile?.calorie_target || null;
  const proteinTarget = profile?.protein_g || null;

  const byDate = useMemo(() => new Map(dailyData.map(d => [d.date, d])), [dailyData]);
  const allDates = useMemo(() => dateRange(dateNDaysAgo(range - 1), today), [range, today]);
  const filledDays = allDates.map(date => byDate.get(date) || { date, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, loggedMeals: 0, energy: null, mood: null });

  const loggedDays = filledDays.filter(d => d.loggedMeals > 0);
  const hasData = loggedDays.length > 0;

  const avgCalories = Math.round(avg(loggedDays.map(d => d.calories)));
  const avgProtein = Math.round(avg(loggedDays.map(d => d.protein_g)));
  const daysOnTarget = calorieTarget
    ? loggedDays.filter(d => Math.abs(d.calories - calorieTarget) <= calorieTarget * 0.1).length
    : 0;
  const energyDays = filledDays.filter(d => d.energy != null);
  const avgEnergy = energyDays.length ? (avg(energyDays.map(d => d.energy))).toFixed(1) : null;

  const loggingStreak = computeStreak(badgeData);
  const calorieStreak = calorieTarget
    ? streakFor(badgeData, d => d.calories > 0 && Math.abs(d.calories - calorieTarget) <= calorieTarget * 0.15)
    : 0;
  const moodStreak = streakFor(badgeData, d => d.mood != null);
  const proteinStreak = proteinTarget
    ? streakFor(badgeData, d => d.protein_g >= proteinTarget * 0.9)
    : 0;

  const labels = filledDays.map(d => new Date(d.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" }));

  const calorieChartData = {
    labels,
    datasets: [
      {
        label: "Calories",
        data: filledDays.map(d => d.calories || null),
        borderColor: C.green,
        backgroundColor: C.green + "22",
        fill: true,
        tension: 0.3,
        spanGaps: true,
        pointRadius: range > 30 ? 0 : 3,
      },
      ...(calorieTarget ? [{
        label: "Goal",
        data: filledDays.map(() => calorieTarget),
        borderColor: C.textM,
        borderDash: [4, 4],
        pointRadius: 0,
        fill: false,
      }] : []),
    ],
  };

  const macroChartData = {
    labels,
    datasets: [
      { label: "Protein", data: filledDays.map(d => d.protein_g || 0), backgroundColor: C.green },
      { label: "Carbs", data: filledDays.map(d => d.carbs_g || 0), backgroundColor: C.blue },
      { label: "Fat", data: filledDays.map(d => d.fat_g || 0), backgroundColor: C.purple },
    ],
  };

  // Trend weight (smoothed) plotted alongside the raw daily entries —
  // both converted through the same kg-based conversion into whatever
  // unit the profile currently displays in, rather than the old
  // behaviour of plotting each row's raw stored value regardless of
  // which unit it was logged in (a real gap: anyone who ever switched
  // metric/imperial would get a chart mixing the two on one axis).
  const trendPoints = useMemo(() => computeTrendWeight(weightLogs), [weightLogs]);
  const trendByDate = useMemo(() => new Map(trendPoints.map(p => [p.date, p.trend])), [trendPoints]);

  const weightLabels = weightLogs.map(w => new Date(w.logged_date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", ...(weightRangeDays > 365 ? { year: "2-digit" } : {}) }));
  const weightChartData = {
    labels: weightLabels,
    datasets: [
      {
        label: "Weight",
        data: weightLogs.map(w => Math.round(fromKg(toKg(w.weight, w.unit), weightUnit) * 10) / 10),
        borderColor: C.green,
        backgroundColor: C.green + "22",
        fill: true,
        tension: 0.3,
        spanGaps: true,
        pointRadius: weightLogs.length > 60 ? 0 : 3,
      },
      {
        label: "Trend",
        data: weightLogs.map(w => {
          const t = trendByDate.get(w.logged_date);
          return t != null ? Math.round(fromKg(t, weightUnit) * 10) / 10 : null;
        }),
        borderColor: C.blue,
        backgroundColor: "transparent",
        fill: false,
        tension: 0.3,
        spanGaps: true,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  // Expenditure history: a rolling re-estimate of maintenance calories
  // over time (see lib/adaptiveTDEE.js), not just the single current
  // snapshot Settings shows — needs calorie data spanning the same
  // window as the weight chart above, which expenditureDailyData covers.
  const expenditureHistory = useMemo(
    () => computeExpenditureHistory(weightLogs, expenditureDailyData.map(d => ({ date: d.date, calories: d.calories }))),
    [weightLogs, expenditureDailyData]
  );
  const expenditureChartData = {
    labels: expenditureHistory.map(p => new Date(p.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })),
    datasets: [{
      label: "Estimated maintenance",
      data: expenditureHistory.map(p => p.tdee),
      borderColor: C.purple,
      backgroundColor: C.purple + "22",
      fill: true,
      tension: 0.3,
      pointRadius: expenditureHistory.length > 20 ? 0 : 3,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: C.textM, boxWidth: 10, font: { size: 11 } } },
    },
    scales: {
      x: { ticks: { color: C.textM, font: { size: 10 }, maxTicksLimit: 8 }, grid: { color: C.border } },
      y: { ticks: { color: C.textM, font: { size: 10 } }, grid: { color: C.border } },
    },
  };

  const stackedOptions = {
    ...chartOptions,
    scales: {
      x: { ...chartOptions.scales.x, stacked: true },
      y: { ...chartOptions.scales.y, stacked: true },
    },
  };

  const sbIconBase = {
    width: 36, height: 36, display: "flex", alignItems: "center",
    justifyContent: "center", borderRadius: 8, cursor: "pointer",
    color: C.textM, fontSize: 18,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.textP, overflow: "hidden" }}>

      <AppNav active="progress" initials={initials} />

      {/* ── main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* top bar */}
        <div className="page-pad-top" style={{ minHeight: 52, background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", flexWrap: "wrap", alignItems: "center", paddingTop: 8, paddingBottom: 8, gap: 16, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 600 }}>Progress</span>
          <div style={{ flex: 1 }} />
          <div style={{ ...sbIconBase, fontSize: 18 }} title="Notifications"><i className="ti ti-bell" /></div>
        </div>

        {/* scrollable content */}
        <div className="page-pad app-content-pad" style={{ flex: 1, overflowY: "auto" }}>

          {!hasData && !loading && (
            <div style={{
              background: C.bgAI, border: `1px solid ${C.borderA}`,
              borderRadius: 12, padding: "28px 32px", marginBottom: 24,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
            }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: C.textP, marginBottom: 6 }}>
                  Nothing to show yet in this range
                </div>
                <div style={{ fontSize: 14, color: C.textM, maxWidth: 420, lineHeight: 1.6 }}>
                  Start logging meals and check in on mood in the dashboard — your charts, streaks, and trends will appear here as your data builds up.
                </div>
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  background: C.green, border: "none", borderRadius: 8,
                  padding: "10px 22px", fontSize: 14, fontWeight: 600,
                  color: C.bg, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                Go to dashboard
              </button>
            </div>
          )}

          {/* range toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {RANGES.map(r => (
              <button key={r.id} onClick={() => setRange(r.id)} style={{
                background: range === r.id ? C.bgAI : C.bgCard,
                border: `1px solid ${range === r.id ? C.borderA2 : C.border2}`,
                borderRadius: 8, padding: "7px 18px", fontSize: 13,
                color: range === r.id ? C.green : "#888", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}>{r.label}</button>
            ))}
          </div>

          {/* stat cards */}
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <StatCard label="Avg. calories" value={hasData ? avgCalories.toLocaleString() : "—"} hint={hasData ? `over ${loggedDays.length} logged days` : "No data yet"} />
            <StatCard label="Days on target" value={hasData && calorieTarget ? daysOnTarget : "—"} hint={calorieTarget ? "within 10% of goal" : "Set a calorie target in Settings"} />
            <StatCard label="Avg. protein" value={hasData ? `${avgProtein}g` : "—"} hint={hasData ? `over ${loggedDays.length} logged days` : "No data yet"} />
            <StatCard label="Avg. energy" value={avgEnergy || "—"} hint={avgEnergy ? `over ${energyDays.length} check-ins` : "Check in on mood to unlock this"} />
          </div>

          {/* calendar */}
          <div style={{ marginBottom: 24 }}>
            <LogCalendar
              month={calMonth}
              byDate={calByDate}
              calorieTarget={calorieTarget}
              loading={calLoading}
              onPrevMonth={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              onNextMonth={() => canGoNextMonth && setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              canGoNext={canGoNextMonth}
              onSelectDay={(date) => navigate("/log", { state: { date } })}
            />
          </div>

          {/* charts */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 2 }}>Calories vs goal</div>
              <div style={{ fontSize: 12, color: C.textM, marginBottom: 16 }}>Daily intake over the last {range} days</div>
              {hasData ? (
                <div style={{ height: 200 }}><Line data={calorieChartData} options={chartOptions} /></div>
              ) : (
                <EmptyChartBox icon="ti-chart-line" message="Log at least 1 day to see your calorie chart" />
              )}
            </div>
            <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 2 }}>Macro breakdown</div>
              <div style={{ fontSize: 12, color: C.textM, marginBottom: 16 }}>Protein, carbs &amp; fat per day</div>
              {hasData ? (
                <div style={{ height: 200 }}><Bar data={macroChartData} options={stackedOptions} /></div>
              ) : (
                <EmptyChartBox icon="ti-chart-bar" message="Log at least 1 day to see your macro chart" />
              )}
            </div>
          </div>

          {/* weight chart */}
          <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 2 }}>Weight</div>
                <div style={{ fontSize: 12, color: C.textM }}>Logged from the dashboard</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {WEIGHT_RANGES.map(r => (
                  <button key={r.id} onClick={() => setWeightRange(r.id)} style={{
                    background: weightRange === r.id ? C.bgAI : C.bgCard,
                    border: `1px solid ${weightRange === r.id ? C.borderA2 : C.border2}`,
                    borderRadius: 7, padding: "5px 11px", fontSize: 12,
                    color: weightRange === r.id ? C.green : "#888", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{r.label}</button>
                ))}
              </div>
            </div>
            {weightLoading ? null : weightLogs.length > 1 ? (
              <div style={{ height: 220 }}><Line data={weightChartData} options={chartOptions} /></div>
            ) : (
              <EmptyChartBox icon="ti-scale" message="Log your weight from the dashboard to see a trend here" />
            )}
          </div>

          {/* expenditure chart */}
          <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 2 }}>Estimated maintenance</div>
              <div style={{ fontSize: 12, color: C.textM }}>How your true maintenance calories have moved, based on your logged weight and food</div>
            </div>
            {weightLoading ? null : expenditureHistory.length > 1 ? (
              <div style={{ height: 220 }}><Line data={expenditureChartData} options={chartOptions} /></div>
            ) : (
              <EmptyChartBox icon="ti-chart-line" message="Log weight and food consistently for a couple of weeks to see this trend" />
            )}
          </div>

          {/* bottom row */}
          <div className="grid-2">

            {/* streak badges */}
            <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 16 }}>Streak badges</div>
              {[
                { icon: "ti-flame",      iconBg: C.bgAI,     iconColor: C.green,  name: "Logging streak",   count: loggingStreak },
                { icon: "ti-target",     iconBg: C.bgAI,     iconColor: C.green,  name: "Calorie target",   count: calorieStreak },
                { icon: "ti-meat",       iconBg: "#0a1520",  iconColor: C.blue,   name: "Protein target",   count: proteinStreak },
                { icon: "ti-mood-smile", iconBg: "#140f1f",  iconColor: C.purple, name: "Mood check-ins",   count: moodStreak },
              ].map((s, i, arr) => (
                <div key={s.name} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <StreakItem {...s} />
                </div>
              ))}
            </div>

            {/* weekly mini chart */}
            <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 8 }}>This week at a glance</div>
              <div style={{ fontSize: 12, color: C.textM, marginBottom: 16 }}>Calories logged each day</div>
              <WeekBars days={dateRange(dateNDaysAgo(6), today).map(date => byDate.get(date) || { date, calories: 0 })} calorieTarget={calorieTarget} />
              <div style={{ marginTop: 20, padding: "12px 14px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textM, lineHeight: 1.6 }}>
                Green = within 15% of your target. Blue = logged but off target. Grey = nothing logged.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyChartBox({ icon, message }) {
  return (
    <div style={{
      height: 180, border: `1px dashed ${C.border2}`, borderRadius: 8,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
    }}>
      <i className={`ti ${icon}`} style={{ fontSize: 28, color: C.border2 }} />
      <div style={{ fontSize: 13, color: C.textM, textAlign: "center", maxWidth: 180 }}>{message}</div>
    </div>
  );
}
