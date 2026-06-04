import { useNavigate } from "react-router-dom";

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

// ── empty stat card ──────────────────────────────────────────────────────────
function EmptyStatCard({ label, icon }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ fontSize: 11, color: C.textM, textTransform: "uppercase", letterSpacing: "0.8px" }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: C.border2, lineHeight: 1 }}>
        —
      </div>
      <div style={{ fontSize: 12, color: C.border2 }}>No data yet</div>
    </div>
  );
}

// ── empty chart box ──────────────────────────────────────────────────────────
function EmptyChart({ title, subtitle, icon, message }) {
  return (
    <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 12, color: C.textM, marginBottom: 16 }}>{subtitle}</div>
      <div style={{
        height: 180, border: `1px dashed ${C.border2}`, borderRadius: 8,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
      }}>
        <i className={`ti ${icon}`} style={{ fontSize: 28, color: C.border2 }} />
        <div style={{ fontSize: 13, color: C.textM, textAlign: "center", maxWidth: 180 }}>{message}</div>
      </div>
    </div>
  );
}

// ── empty streak item ────────────────────────────────────────────────────────
function EmptyStreakItem({ icon, iconBg, iconColor, name, placeholder }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, opacity: 0.4 }}>
        <i className={`ti ${icon}`} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: C.textS }}>{name}</div>
        <div style={{ fontSize: 12, color: C.border2 }}>{placeholder}</div>
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 12, color: C.border2 }}>
        0
      </div>
    </div>
  );
}

// ── empty week bars ──────────────────────────────────────────────────────────
function EmptyWeekBars() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 100 }}>
        {days.map((day) => (
          <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: 100 }}>
            <div style={{ width: "100%", height: 4, borderRadius: "4px 4px 0 0", background: C.border }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        {days.map((day) => (
          <div key={day} style={{ flex: 1, textAlign: "center", fontSize: 10, color: C.textM }}>{day}</div>
        ))}
      </div>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────
export default function Progress() {
  const navigate = useNavigate();

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
        <div style={{ width: 28, height: 28, background: C.green, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill={C.bg}>
            <path d="M8 2C5.5 2 4 4 4 6c0 3 4 8 4 8s4-5 4-8c0-2-1.5-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
          </svg>
        </div>
        <div style={sbIconBase}   title="Dashboard"   onClick={() => navigate("/dashboard")}><i className="ti ti-layout-dashboard" /></div>
        <div style={sbIconBase}   title="Food search"  onClick={() => navigate("/food")}><i className="ti ti-search" /></div>
        <div style={sbIconActive} title="Progress"><i className="ti ti-chart-line" /></div>
        <div style={sbIconBase}   title="Meal plans"   onClick={() => navigate("/meals")}><i className="ti ti-calendar" /></div>
        <div style={sbIconBase}   title="AI insights"  onClick={() => navigate("/insights")}><i className="ti ti-sparkles" /></div>
        <div style={{ flex: 1 }} />
        <div style={sbIconBase}   title="Settings"     onClick={() => navigate("/settings")}><i className="ti ti-settings" /></div>
        <div style={{ width: 32, height: 32, background: C.bgCard, border: `1px solid ${C.border2}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.green, fontWeight: 600, cursor: "pointer" }}>SR</div>
      </div>

      {/* ── main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* top bar */}
        <div style={{ height: 52, background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 600 }}>Progress</span>
          <div style={{ flex: 1 }} />
          <div style={{ ...sbIconBase, fontSize: 18 }} title="Notifications"><i className="ti ti-bell" /></div>
        </div>

        {/* scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* hero empty state banner */}
          <div style={{
            background: C.bgAI, border: `1px solid ${C.borderA}`,
            borderRadius: 12, padding: "28px 32px", marginBottom: 24,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
          }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: C.textP, marginBottom: 6 }}>
                Nothing to show yet
              </div>
              <div style={{ fontSize: 14, color: C.textM, maxWidth: 420, lineHeight: 1.6 }}>
                Start logging meals and water in the dashboard — your charts, streaks, and trends will appear here as your data builds up.
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

          {/* range toggle — dimmed */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, opacity: 0.35, pointerEvents: "none" }}>
            {["7 days", "30 days", "90 days"].map((r, i) => (
              <div key={r} style={{
                background: i === 1 ? C.bgAI : C.bgCard,
                border: `1px solid ${i === 1 ? C.borderA2 : C.border2}`,
                borderRadius: 8, padding: "7px 18px", fontSize: 13,
                color: i === 1 ? C.green : "#888",
              }}>{r}</div>
            ))}
          </div>

          {/* stat cards — empty */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            <EmptyStatCard label="Avg. calories" />
            <EmptyStatCard label="Days on target" />
            <EmptyStatCard label="Avg. protein" />
            <EmptyStatCard label="Water avg." />
          </div>

          {/* charts — empty */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <EmptyChart
              title="Calories vs goal"
              subtitle="Daily intake will appear here"
              icon="ti-chart-line"
              message="Log at least 1 day to see your calorie chart"
            />
            <EmptyChart
              title="Macro breakdown"
              subtitle="Protein, carbs & fat will appear here"
              icon="ti-chart-bar"
              message="Log at least 1 day to see your macro chart"
            />
          </div>

          {/* bottom row — empty */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* streak badges — empty */}
            <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 16 }}>Streak badges</div>
              {[
                { icon: "ti-flame",      iconBg: C.bgAI,     iconColor: C.green,  name: "Logging streak",  placeholder: "Start logging to build your streak" },
                { icon: "ti-droplet",    iconBg: "#0a1520",  iconColor: C.blue,   name: "Hydration goal",  placeholder: "Track water daily to earn this" },
                { icon: "ti-target",     iconBg: C.bgAI,     iconColor: C.green,  name: "Calorie target",  placeholder: "Hit your goal to start a streak" },
                { icon: "ti-mood-smile", iconBg: "#140f1f",  iconColor: C.purple, name: "Mood check-ins",  placeholder: "Log your mood each day" },
              ].map((s, i, arr) => (
                <div key={s.name} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <EmptyStreakItem {...s} />
                </div>
              ))}
            </div>

            {/* weekly mini chart — empty */}
            <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 8 }}>This week at a glance</div>
              <div style={{ fontSize: 12, color: C.textM, marginBottom: 16 }}>Log meals to fill in your week</div>
              <EmptyWeekBars />
              <div style={{ marginTop: 20, padding: "12px 14px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textM, lineHeight: 1.6 }}>
                Bars will fill in as you log each day. Green = on target, muted = over or under.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
