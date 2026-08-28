// src/pages/MealPlans.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoMark from "../components/LogoMark";

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
};

// ── sidebar (matches AIInsights exactly) ─────────────────────────────────────
function Sidebar({ navigate }) {
  const sbIconBase = {
    width: 36, height: 36, display: "flex", alignItems: "center",
    justifyContent: "center", borderRadius: 8, cursor: "pointer",
    color: C.textM, fontSize: 18,
  };
  const sbIconActive = { ...sbIconBase, color: C.green, background: C.bgAI };

  return (
    <div style={{
      width: 52, background: C.bg, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 0", gap: 28, flexShrink: 0,
    }}>
      <LogoMark size={28} />
      <div style={sbIconBase}   title="Dashboard"  onClick={() => navigate("/dashboard")}><i className="ti ti-layout-dashboard" /></div>
      <div style={sbIconBase}   title="Food search" onClick={() => navigate("/food")}><i className="ti ti-search" /></div>
      <div style={sbIconBase}   title="Progress"    onClick={() => navigate("/progress")}><i className="ti ti-chart-line" /></div>
      <div style={sbIconActive} title="Meal plans"><i className="ti ti-calendar" /></div>
      <div style={sbIconBase}   title="AI insights" onClick={() => navigate("/insights")}><i className="ti ti-sparkles" /></div>
      <div style={{ flex: 1 }} />
      <div style={sbIconBase}   title="Settings"    onClick={() => navigate("/settings")}><i className="ti ti-settings" /></div>
      <div style={{
        width: 32, height: 32, background: C.bgCard, border: `1px solid ${C.border2}`,
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: C.green, fontWeight: 600, cursor: "pointer",
      }}>SR</div>
    </div>
  );
}

// ── data ──────────────────────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"];

const ACTIVE_PLAN = {
  name: "High Protein Cut",
  goal: "Lose weight",
  calories: 1850,
  protein: 160,
  carbs: 180,
  fat: 55,
  daysLeft: 18,
  totalDays: 28,
  adherence: 79,
};

const SCHEDULE = {
  Mon: {
    Breakfast: { name: "Greek yoghurt + berries",  cal: 280, emoji: "🫐" },
    Lunch:     { name: "Grilled chicken + rice",    cal: 490, emoji: "🍗" },
    Dinner:    { name: "Salmon + steamed broccoli", cal: 420, emoji: "🐟" },
    Snack:     { name: "Protein bar",               cal: 200, emoji: "🍫" },
  },
  Tue: {
    Breakfast: { name: "Oats + banana",             cal: 310, emoji: "🌾" },
    Lunch:     { name: "Tuna rice bowl",             cal: 470, emoji: "🥣" },
    Dinner:    { name: "Beef stir-fry + noodles",   cal: 510, emoji: "🥢" },
    Snack:     { name: "Apple + almond butter",     cal: 190, emoji: "🍎" },
  },
  Wed: {
    Breakfast: { name: "Egg white omelette",        cal: 260, emoji: "🍳" },
    Lunch:     { name: "Poke bowl",                 cal: 450, emoji: "🍱" },
    Dinner:    { name: "Chicken tikka + rice",      cal: 530, emoji: "🍛" },
    Snack:     { name: "Cottage cheese",            cal: 150, emoji: "🥛" },
  },
  Thu: {
    Breakfast: { name: "Smoothie bowl",             cal: 320, emoji: "🥤" },
    Lunch:     { name: "Grilled chicken wrap",      cal: 460, emoji: "🌯" },
    Dinner:    { name: "Baked barramundi + salad",  cal: 390, emoji: "🥗" },
    Snack:     { name: "Mixed nuts",                cal: 180, emoji: "🥜" },
  },
  Fri: null,
  Sat: null,
  Sun: null,
};

const TEMPLATES = [
  {
    id: 1, name: "High Protein Cut", emoji: "💪",
    tag: "Weight loss", tagColor: C.green,
    cal: 1850, protein: 160, duration: "4 weeks",
    desc: "High satiety, lean protein focus. Perfect for a calorie deficit without losing muscle.",
  },
  {
    id: 2, name: "Aus Bulk", emoji: "🦘",
    tag: "Muscle gain", tagColor: C.blue,
    cal: 3100, protein: 200, duration: "6 weeks",
    desc: "Aus-style meals with calorie-dense foods — meat pies, rice, chicken, whole milk.",
  },
  {
    id: 3, name: "Asian Lean Gains", emoji: "🍜",
    tag: "Recomp", tagColor: C.purple,
    cal: 2400, protein: 185, duration: "8 weeks",
    desc: "Vietnamese, Korean, and Japanese meals with high protein and moderate carbs.",
  },
  {
    id: 4, name: "Maintenance Mode", emoji: "⚖️",
    tag: "Maintain", tagColor: C.amber,
    cal: 2200, protein: 140, duration: "Ongoing",
    desc: "Balanced macros, flexible approach. Good for sustaining results long-term.",
  },
  {
    id: 5, name: "Plant Forward", emoji: "🌿",
    tag: "Flexible", tagColor: C.green,
    cal: 2000, protein: 120, duration: "4 weeks",
    desc: "Mostly plant-based with eggs and fish. High fibre, anti-inflammatory foods.",
  },
  {
    id: 6, name: "Weekend Warrior", emoji: "🏃",
    tag: "Performance", tagColor: C.blue,
    cal: 2600, protein: 170, duration: "4 weeks",
    desc: "Higher carb on training days, lower on rest days. For active lifestyles.",
  },
];

// ── sub-components ────────────────────────────────────────────────────────────

function MacroChip({ label, value, unit = "g", color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{value}{unit}</span>
      <span style={{ fontSize: 10, color: C.textM }}>{label}</span>
    </div>
  );
}

function ActivePlanCard({ plan }) {
  const progress = ((plan.totalDays - plan.daysLeft) / plan.totalDays) * 100;

  return (
    <div style={{
      background: C.bgAI, border: `1px solid ${C.borderA}`,
      borderRadius: 12, padding: 20, marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.green, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Active plan
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: C.textP }}>
            {plan.name}
          </div>
          <div style={{ fontSize: 13, color: C.textM, marginTop: 2 }}>{plan.goal} · {plan.daysLeft} days left</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: C.green }}>{plan.adherence}%</div>
          <div style={{ fontSize: 11, color: C.textM }}>adherence</div>
        </div>
      </div>

      {/* progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: C.textM }}>Week {Math.ceil((plan.totalDays - plan.daysLeft) / 7)} of {Math.ceil(plan.totalDays / 7)}</span>
          <span style={{ fontSize: 11, color: C.textM }}>{Math.round(progress)}% complete</span>
        </div>
        <div style={{ height: 4, background: C.border2, borderRadius: 99 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: C.green, borderRadius: 99, transition: "width 0.8s ease" }} />
        </div>
      </div>

      {/* macro targets */}
      <div style={{
        display: "flex", gap: 20, paddingTop: 14,
        borderTop: `1px solid ${C.borderA}`,
      }}>
        <MacroChip label="Calories" value={plan.calories} unit=" kcal" color={C.textP} />
        <div style={{ width: 1, background: C.borderA }} />
        <MacroChip label="Protein"  value={plan.protein}  color={C.green} />
        <MacroChip label="Carbs"    value={plan.carbs}    color={C.blue} />
        <MacroChip label="Fat"      value={plan.fat}      color={C.amber} />
        <div style={{ flex: 1 }} />
        <button style={{
          background: "transparent", border: `1px solid ${C.borderA}`,
          borderRadius: 8, padding: "6px 14px", fontSize: 12,
          color: C.green, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          alignSelf: "center",
        }}
          onMouseEnter={e => e.currentTarget.style.background = C.bgCard}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          Edit plan
        </button>
      </div>
    </div>
  );
}

function ScheduleGrid({ selectedDay, setSelectedDay }) {
  const dayData = SCHEDULE[selectedDay];

  return (
    <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS, marginBottom: 16 }}>
        Weekly schedule
      </div>

      {/* day pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {DAYS.map(day => {
          const hasMeals = !!SCHEDULE[day];
          const isSelected = day === selectedDay;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                flex: 1, padding: "8px 4px", borderRadius: 8,
                border: `1px solid ${isSelected ? C.borderA2 : hasMeals ? C.borderA : C.border}`,
                background: isSelected ? C.bgAI : "transparent",
                cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4, transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 10, color: isSelected ? C.green : C.textM }}>{day}</span>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: hasMeals ? C.green : C.border2,
              }} />
            </button>
          );
        })}
      </div>

      {/* meal slots for selected day */}
      {dayData ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MEAL_SLOTS.map(slot => {
            const meal = dayData[slot];
            return (
              <div key={slot} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: C.bgCard, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: "12px 14px",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: C.bgSubtle,
                  border: `1px solid ${C.border2}`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 18, flexShrink: 0,
                }}>
                  {meal.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: C.textM, marginBottom: 2 }}>{slot}</div>
                  <div style={{ fontSize: 13, color: C.textS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meal.name}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.green, flexShrink: 0 }}>{meal.cal} kcal</span>
              </div>
            );
          })}
          {/* daily total */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px", borderTop: `1px solid ${C.border}`, marginTop: 4,
          }}>
            <span style={{ fontSize: 12, color: C.textM }}>Day total</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.textP }}>
              {Object.values(dayData).reduce((s, m) => s + m.cal, 0)} kcal
            </span>
          </div>
        </div>
      ) : (
        <div style={{
          background: C.bgCard, border: `1px dashed ${C.border2}`,
          borderRadius: 10, padding: "28px 20px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        }}>
          <i className="ti ti-plus" style={{ fontSize: 24, color: C.border2 }} />
          <div style={{ fontSize: 13, color: C.textM }}>No meals planned for {selectedDay}</div>
          <button style={{
            background: "transparent", border: `1px solid ${C.borderA}`,
            borderRadius: 8, padding: "7px 16px", fontSize: 12,
            color: C.green, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            marginTop: 4,
          }}>Add meals for {selectedDay}</button>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ tmpl, isActive, onSelect }) {
  return (
    <div style={{
      background: isActive ? C.bgAI : C.bgCard,
      border: `1px solid ${isActive ? C.borderA : C.border}`,
      borderRadius: 12, padding: 16, cursor: "pointer",
      transition: "all 0.15s",
    }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = C.borderA; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = C.border; }}
      onClick={onSelect}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{tmpl.emoji}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textP }}>{tmpl.name}</div>
            <div style={{
              display: "inline-block", marginTop: 3,
              background: tmpl.tagColor + "18", border: `1px solid ${tmpl.tagColor}40`,
              borderRadius: 20, padding: "1px 8px", fontSize: 10, color: tmpl.tagColor,
            }}>{tmpl.tag}</div>
          </div>
        </div>
        {isActive && (
          <div style={{
            background: C.green + "18", border: `1px solid ${C.borderA}`,
            borderRadius: 20, padding: "2px 8px", fontSize: 10, color: C.green, flexShrink: 0,
          }}>Active</div>
        )}
      </div>
      <p style={{ fontSize: 12, color: C.textM, lineHeight: 1.6, margin: "0 0 12px" }}>{tmpl.desc}</p>
      <div style={{ display: "flex", gap: 14, paddingTop: 10, borderTop: `1px solid ${isActive ? C.borderA : C.border}` }}>
        <span style={{ fontSize: 11, color: C.textM }}>{tmpl.cal} kcal</span>
        <span style={{ fontSize: 11, color: C.green }}>{tmpl.protein}g protein</span>
        <span style={{ fontSize: 11, color: C.textM }}>{tmpl.duration}</span>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function MealPlans() {
  const navigate    = useNavigate();
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [activeTemplate, setActiveTemplate] = useState(1);
  const [filterTag, setFilterTag] = useState("All");

  const sbIconBase = {
    width: 36, height: 36, display: "flex", alignItems: "center",
    justifyContent: "center", borderRadius: 8, color: C.textM, fontSize: 18,
  };

  const tags = ["All", "Weight loss", "Muscle gain", "Recomp", "Maintain", "Flexible", "Performance"];
  const visibleTemplates = filterTag === "All"
    ? TEMPLATES
    : TEMPLATES.filter(t => t.tag === filterTag);

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.textP, overflow: "hidden" }}>
      <style>{`* { box-sizing: border-box; } button { font-family: 'DM Sans', sans-serif; }`}</style>

      <Sidebar navigate={navigate} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* top bar — matches AIInsights exactly */}
        <div style={{
          height: 52, background: C.bg, borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 600 }}>Meal Plans</span>
          <div style={{ flex: 1 }} />
          <div style={{ ...sbIconBase, cursor: "pointer" }} title="Notifications"><i className="ti ti-bell" /></div>
        </div>

        {/* scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* active plan */}
          <ActivePlanCard plan={ACTIVE_PLAN} />

          {/* weekly schedule */}
          <ScheduleGrid selectedDay={selectedDay} setSelectedDay={setSelectedDay} />

          {/* template browser */}
          <div style={{ background: C.bgSubtle, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: C.textS }}>
                Plan templates
              </div>
              <button style={{
                background: C.green, border: "none", borderRadius: 8,
                padding: "6px 14px", fontSize: 12, fontWeight: 600,
                color: C.bg, cursor: "pointer",
              }}>+ New plan</button>
            </div>

            {/* filter chips */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  style={{
                    background: filterTag === tag ? C.bgAI : "transparent",
                    border: `1px solid ${filterTag === tag ? C.borderA2 : C.border2}`,
                    borderRadius: 20, padding: "4px 12px", fontSize: 11,
                    color: filterTag === tag ? C.green : C.textM,
                    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >{tag}</button>
              ))}
            </div>

            {/* template grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {visibleTemplates.map(tmpl => (
                <TemplateCard
                  key={tmpl.id}
                  tmpl={tmpl}
                  isActive={activeTemplate === tmpl.id}
                  onSelect={() => setActiveTemplate(tmpl.id)}
                />
              ))}
            </div>

            {visibleTemplates.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 20px", color: C.textM, fontSize: 13 }}>
                No templates for this goal type yet.
              </div>
            )}
          </div>

          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
}
