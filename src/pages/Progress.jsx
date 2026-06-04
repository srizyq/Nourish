import { useState, useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

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
  amber:     "#b48250",
  red:       "#c07070",
  textP:     "#e8e8e8",
  textS:     "#cccccc",
  textM:     "#666666",
  textH:     "#444444",
};

// ── data sets ────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.round(min + Math.random() * (max - min));

const data7d = {
  labels:   ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  calories: [1780, 2100, 1950, 2200, 1880, 2050, 1760],
  protein:  [108, 125, 118, 130, 105, 120, 98],
  carbs:    [180, 210, 195, 220, 175, 200, 165],
  fat:      [55, 68, 61, 72, 58, 65, 52],
  avgCal: "1,960", daysTarget: "5/7",  pct: "71% adherence",
  avgProtein: "115", avgWater: "2.1",
  calSub: "Daily intake over last 7 days",
  macroSub: "Average daily macros over 7 days",
  calTrend: "↑ 2% vs last period", calTrendUp: true,
  proteinTrend: "↓ 5g vs goal",     proteinUp: false,
  waterTrend: "↑ 0.2L vs last period", waterUp: true,
};

const data30d = {
  labels:   Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
  calories: [1820,2050,1780,2300,1950,2100,1680,2200,1900,2050,1750,2150,2000,1880,2400,1760,2050,1920,2100,1800,1950,2250,1700,2000,1850,2100,1980,2200,1820,1900],
  protein:  Array.from({ length: 30 }, () => rand(95, 140)),
  carbs:    Array.from({ length: 30 }, () => rand(160, 240)),
  fat:      Array.from({ length: 30 }, () => rand(48, 80)),
  avgCal: "1,847", daysTarget: "19/30", pct: "63% adherence",
  avgProtein: "112", avgWater: "1.9",
  calSub: "Daily intake over last 30 days",
  macroSub: "Average daily macros over 30 days",
  calTrend: "↑ 3% vs last period", calTrendUp: true,
  proteinTrend: "↓ 8g vs goal",     proteinUp: false,
  waterTrend: "↑ 0.3L vs last period", waterUp: true,
};

const data90d = {
  labels:   Array.from({ length: 90 }, (_, i) => `Day ${i + 1}`),
  calories: Array.from({ length: 90 }, () => rand(1600, 2400)),
  protein:  Array.from({ length: 90 }, () => rand(90, 145)),
  carbs:    Array.from({ length: 90 }, () => rand(150, 250)),
  fat:      Array.from({ length: 90 }, () => rand(45, 85)),
  avgCal: "1,812", daysTarget: "54/90", pct: "60% adherence",
  avgProtein: "108", avgWater: "1.7",
  calSub: "Daily intake over last 90 days",
  macroSub: "Average daily macros over 90 days",
  calTrend: "↑ 5% vs last period", calTrendUp: true,
  proteinTrend: "↓ 12g vs goal",    proteinUp: false,
  waterTrend: "↓ 0.1L vs last period", waterUp: false,
};

const DATASETS = { "7d": data7d, "30d": data30d, "90d": data90d };
const GOAL = 2000;

// ── week bar data ────────────────────────────────────────────────────────────
const WEEK = [
  { day: "Mon", val: 1780 },
  { day: "Tue", val: 2100 },
  { day: "Wed", val: 1950 },
  { day: "Thu", val: 2200 },
  { day: "Fri", val: 1880 },
  { day: "Sat", val: 2050 },
  { day: "Sun", val: 1920 },
];
const TODAY_IDX = 6;

// ── goal-line plugin ─────────────────────────────────────────────────────────
const goalLinePlugin = {
  id: "goalLine",
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!scales.y) return;
    const y = scales.y.getPixelForValue(GOAL);
    ctx.save();
    ctx.strokeStyle = C.borderA;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(chartArea.left, y);
    ctx.lineTo(chartArea.right, y);
    ctx.stroke();
    ctx.restore();
  },
};

// ── sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, unit, trend, trendUp }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ fontSize: 11, color: C.textM, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: C.textP, lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 14, color: C.textM }}>{unit}</span>}
      </div>
      {trend && (
        <div style={{ fontSize: 12, marginTop: 4, color: trendUp ? C.green : C.red }}>
          {trend}
        </div>
      )}
    </div>
  );
}

function WeekBars() {
  const maxH = 100;
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: maxH }}>
        {WEEK.map((w, i) => {
          const pct  = Math.min(w.val / (GOAL * 1.3), 1);
          const h    = Math.max(Math.round(pct * maxH), 4);
          const isToday   = i === TODAY_IDX;
          const onTarget  = w.val >= GOAL * 0.9 && w.val <= GOAL * 1.1;
          const bg = isToday ? C.greenDark : onTarget ? C.green : C.border2;
          return (
            <div key={w.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: maxH }}>
              <div style={{ width: "100%", height: h, borderRadius: "4px 4px 0 0", background: bg }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        {WEEK.map((w) => (
          <div key={w.day} style={{ flex: 1, textAlign: "center", fontSize: 10, color: C.textM }}>{w.day}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
        {[
          { label: "On target",   bg: C.green },
          { label: "Over/under",  bg: C.border2 },
          { label: "Today",       bg: C.greenDark },
        ].map(({ label, bg }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.textM }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: bg, display: "inline-block" }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────
export default function Progress() {
  const [range, setRange]       = useState("30d");
  const calRef   = useRef(null);
  const macroRef = useRef(null);
  const calChart   = useRef(null);
  const macroChart = useRef(null);

  // initialise charts on mount
  useEffect(() => {
    const d = DATASETS["30d"];

    calChart.current = new Chart(calRef.current, {
      type: "line",
      data: {
        labels: d.labels,
        datasets: [{
          label: "Calories",
          data: d.calories,
          borderColor: C.green,
          backgroundColor: "rgba(143,188,143,0.08)",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: C.green,
          tension: 0.3,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: C.bgCard, borderColor: C.border2, borderWidth: 1,
            titleColor: C.textP, bodyColor: C.textS, padding: 10,
            callbacks: { label: (ctx) => `${ctx.parsed.y.toLocaleString()} kcal` },
          },
        },
        scales: {
          x: { display: false },
          y: {
            min: 1200, max: 2700,
            grid: { color: C.border },
            ticks: { color: C.textM, font: { size: 11 }, callback: (v) => v.toLocaleString() },
          },
        },
      },
      plugins: [goalLinePlugin],
    });

    macroChart.current = new Chart(macroRef.current, {
      type: "bar",
      data: {
        labels: d.labels,
        datasets: [
          { label: "Protein", data: d.protein, backgroundColor: C.green,     stack: "macro", barPercentage: 1, categoryPercentage: 0.9 },
          { label: "Carbs",   data: d.carbs,   backgroundColor: C.borderA,   stack: "macro", barPercentage: 1, categoryPercentage: 0.9 },
          { label: "Fat",     data: d.fat,     backgroundColor: C.greenDark, stack: "macro", barPercentage: 1, categoryPercentage: 0.9 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: C.bgCard, borderColor: C.border2, borderWidth: 1,
            titleColor: C.textP, bodyColor: C.textS, padding: 10,
            callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}g` },
          },
        },
        scales: {
          x: { display: false, stacked: true },
          y: {
            stacked: true,
            grid: { color: C.border },
            ticks: { color: C.textM, font: { size: 11 }, callback: (v) => `${v}g` },
          },
        },
      },
    });

    return () => {
      calChart.current?.destroy();
      macroChart.current?.destroy();
    };
  }, []);

  // update charts when range changes
  useEffect(() => {
    const d = DATASETS[range];
    if (!calChart.current || !macroChart.current) return;

    calChart.current.data.labels                 = d.labels;
    calChart.current.data.datasets[0].data       = d.calories;
    calChart.current.data.datasets[0].pointRadius = d.labels.length > 14 ? 0 : 3;
    calChart.current.update();

    macroChart.current.data.labels               = d.labels;
    macroChart.current.data.datasets[0].data     = d.protein;
    macroChart.current.data.datasets[1].data     = d.carbs;
    macroChart.current.data.datasets[2].data     = d.fat;
    macroChart.current.update();
  }, [range]);

  const d = DATASETS[range];

  // ── styles ─────────────────────────────────────────────────────────────────
  const sidebarStyle = {
    width: 52, background: C.bg, borderRight: `1px solid ${C.border}`,
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "20px 0", gap: 28, flexShrink: 0,
  };
  const sbIconBase = {
    width: 36, height: 36, display: "flex", alignItems: "center",
    justifyContent: "center", borderRadius: 8, cursor: "pointer",
    color: C.textM, fontSize: 18,
  };
  const sbIconActive = { ...sbIconBase, color: C.green, background: C.bgAI };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.textP, overflow: "hidden" }}>

      {/* ── sidebar ── */}
      <div style={sidebarStyle}>
        {/* logo */}
        <div style={{ width: 28, height: 28, background: C.green, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill={C.bg}>
            <path d="M8 2C5.5 2 4 4 4 6c0 3 4 8 4 8s4-5 4-8c0-2-1.5-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
          </svg>
        </div>
        <div style={sbIconActive}    title="Progress"><i className="ti ti-chart-line" /></div>
        <div style={sbIconBase}      title="Dashboard"><i className="ti ti-layout-dashboard" /></div>
        <div style={sbIconBase}      title="Food search"><i className="ti ti-search" /></div>
        <div style={sbIconBase}      title="Meal plans"><i className="ti ti-calendar" /></div>
        <div style={sbIconBase}      title="AI insights"><i className="ti ti-sparkles" /></div>
        <div style={{ flex: 1 }} />
        <div style={sbIconBase}      title="Settings"><i className="ti ti-settings" /></div>
        <div style={{ width: 32, height: 32, background: C.bgCard, border: `1px solid ${C.border2}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.green, fontWeight: 600, cursor: "pointer" }}>SR</div>
      </div>

      {/* ── main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* top bar */}
        <div style={{ height: 52, background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 600 }}>Progress</span>
          <div style={{ flex: 1 }} />
          <div style={{ background: C.bgCard, border: `1px solid ${C.border2}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: C.green, display: "flex", alignItems: "center", gap: 6 }}>
            🔥 12-day streak
          </div>
          <div style={{ ...sbIconBase, fontSize: 18 }} title="Notifications"><i className="ti ti-bell" /></div>
        </div>

        {/* scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* range toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["7d", "30d", "90d"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  background:   range === r ? C.bgAI    : C.bgCard,
                  border:       `1px solid ${range === r ? C.borderA2 : C.border2}`,
                  borderRadius: 8,
                  padding:      "7px 18px",
                  fontSize:     13,
                  color:        range === r ? C.green   : "#888",
                  cursor:       "pointer",
                  fontFamily:   "'DM Sans', sans-serif",
                  transition:   "all 0.2s",
                }}
              >
                {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
              </button>
            ))}
          </div>

          {/* stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            <StatCard label="Avg. calories"  value={d.avgCal}     trend={d.calTrend}     trendUp={d.calTrendUp} />
            <StatCard label="Days on target" value={d.daysTarget} trend={d.pct}          trendUp />
            <StatCard label="Avg. protein"   value={d.avgProtein} unit="g" trend={d.proteinTrend} trendUp={d.proteinUp} />
            <StatCard label="Water avg."     value={d.avgWater}   unit="L" trend={d.waterTrend}   trendUp={d.waterUp} />
          </div>

          {/* charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* calorie chart */}
            <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 2 }}>Calories vs goal</div>
              <div style={{ fontSize: 12, color: C.textM, marginBottom: 16 }}>{d.calSub}</div>
              {/* legend */}
              <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.textM }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: C.green, display: "inline-block" }} /> Intake
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.textM }}>
                  <span style={{ width: 10, height: 4, borderRadius: 1, background: C.borderA, display: "inline-block", borderTop: `1px dashed ${C.borderA}` }} /> Goal (2,000)
                </span>
              </div>
              <div style={{ position: "relative", width: "100%", height: 180 }}>
                <canvas ref={calRef} />
              </div>
            </div>

            {/* macro chart */}
            <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 2 }}>Macro breakdown</div>
              <div style={{ fontSize: 12, color: C.textM, marginBottom: 16 }}>{d.macroSub}</div>
              {/* legend */}
              <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                {[
                  { label: "Protein", bg: C.green },
                  { label: "Carbs",   bg: C.borderA },
                  { label: "Fat",     bg: C.greenDark },
                ].map(({ label, bg }) => (
                  <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.textM }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: bg, display: "inline-block" }} /> {label}
                  </span>
                ))}
              </div>
              <div style={{ position: "relative", width: "100%", height: 180 }}>
                <canvas ref={macroRef} />
              </div>
            </div>
          </div>

          {/* bottom row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* streak badges */}
            <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 16 }}>Streak badges</div>
              {[
                { icon: "ti-flame",      iconBg: C.bgAI,                iconColor: C.green,  name: "Logging streak",  days: "12 days in a row",         badge: "🔥 12", badgeBg: C.bgAI,       badgeBorder: C.borderA,  badgeColor: C.green },
                { icon: "ti-droplet",    iconBg: "#0a1520",              iconColor: C.blue,   name: "Hydration goal",  days: "Hit target 5 days in a row", badge: "💧 5",  badgeBg: "#0a1520",    badgeBorder: "#1e3a50",  badgeColor: C.blue },
                { icon: "ti-target",     iconBg: C.bgAI,                iconColor: C.green,  name: "Calorie target",  days: "Best streak: 8 days",        badge: "✓ 8",  badgeBg: C.bgAI,       badgeBorder: C.borderA,  badgeColor: C.green },
                { icon: "ti-mood-smile", iconBg: "#140f1f",              iconColor: C.purple, name: "Mood check-ins",  days: "19 of 30 days logged",       badge: "😊 19", badgeBg: "#140f1f",    badgeBorder: "#2a1a4a",  badgeColor: C.purple },
              ].map((s, i, arr) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: s.iconBg, color: s.iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    <i className={`ti ${s.icon}`} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: C.textS }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: C.textM }}>{s.days}</div>
                  </div>
                  <div style={{ background: s.badgeBg, border: `1px solid ${s.badgeBorder}`, borderRadius: 20, padding: "3px 10px", fontSize: 12, color: s.badgeColor }}>
                    {s.badge}
                  </div>
                </div>
              ))}
            </div>

            {/* weekly mini chart */}
            <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 16 }}>This week at a glance</div>
              <WeekBars />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
