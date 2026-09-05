// Shared between Progress.jsx (the user's own streaks) and Coach.jsx
// (a trainer viewing a client's streaks) — same badge-row treatment either way.
export default function StreakItem({ icon, iconBg, iconColor, name, count }) {
  const active = count > 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, opacity: active ? 1 : 0.4 }}>
        <i className={`ti ${icon}`} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: active ? "var(--text-secondary)" : "var(--text-muted)" }}>{name}</div>
        <div style={{ fontSize: 12, color: "var(--border-strong)" }}>{active ? `${count} day${count === 1 ? "" : "s"} in a row` : "Not started yet"}</div>
      </div>
      <div style={{ background: active ? "var(--accent-bg)" : "var(--bg-card)", border: `1px solid ${active ? "var(--border-active)" : "var(--border-default)"}`, borderRadius: 20, padding: "3px 10px", fontSize: 12, color: active ? "var(--accent)" : "var(--border-strong)" }}>
        {count}
      </div>
    </div>
  );
}
