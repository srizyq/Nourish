import { useState, useMemo, useRef, useEffect } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const CUISINES = [
  { id: "all", label: "All" },
  { id: "australian", label: "🇦🇺 Australian" },
  { id: "vietnamese", label: "🍜 Vietnamese" },
  { id: "chinese", label: "🥢 Chinese" },
  { id: "indian", label: "🍛 Indian" },
  { id: "thai", label: "🌶️ Thai" },
  { id: "korean", label: "🇰🇷 Korean" },
  { id: "japanese", label: "🍣 Japanese" },
  { id: "malaysian", label: "🥘 Malaysian" },
];

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];

const FOODS = [
  // Australian
  { id: 1, emoji: "🥩", name: "Meat pie", meta: "1 pie · 175g", cuisine: "australian", cal: 450, protein: 12, carbs: 38, fat: 28, fibre: 2, sodium: 820, sugar: 4 },
  { id: 2, emoji: "🍗", name: "Chicken breast, grilled", meta: "100g", cuisine: "australian", cal: 165, protein: 31, carbs: 0, fat: 3.6, fibre: 0, sodium: 74, sugar: 0 },
  { id: 3, emoji: "🥞", name: "Vegemite on toast", meta: "2 slices", cuisine: "australian", cal: 210, protein: 7, carbs: 36, fat: 4, fibre: 3, sodium: 560, sugar: 2 },
  { id: 4, emoji: "🐟", name: "Barramundi, pan-fried", meta: "1 fillet · 180g", cuisine: "australian", cal: 220, protein: 38, carbs: 0, fat: 7, fibre: 0, sodium: 130, sugar: 0 },
  // Vietnamese
  { id: 5, emoji: "🍜", name: "Pho bo (beef noodle soup)", meta: "1 bowl", cuisine: "vietnamese", cal: 370, protein: 24, carbs: 42, fat: 9, fibre: 2, sodium: 950, sugar: 3 },
  { id: 6, emoji: "🌯", name: "Goi cuon (fresh spring rolls)", meta: "2 rolls", cuisine: "vietnamese", cal: 130, protein: 7, carbs: 18, fat: 3, fibre: 1.5, sodium: 310, sugar: 2 },
  { id: 7, emoji: "🍚", name: "Com tam (broken rice + pork)", meta: "1 plate", cuisine: "vietnamese", cal: 580, protein: 28, carbs: 72, fat: 16, fibre: 2, sodium: 780, sugar: 6 },
  // Chinese
  { id: 8, emoji: "🥟", name: "Dim sum — har gow", meta: "3 pieces", cuisine: "chinese", cal: 140, protein: 8, carbs: 18, fat: 3, fibre: 1, sodium: 380, sugar: 1 },
  { id: 9, emoji: "🍱", name: "Char siu pork", meta: "100g", cuisine: "chinese", cal: 280, protein: 22, carbs: 18, fat: 12, fibre: 0, sodium: 640, sugar: 14 },
  { id: 10, emoji: "🍲", name: "Wonton soup", meta: "1 bowl", cuisine: "chinese", cal: 260, protein: 14, carbs: 32, fat: 8, fibre: 1, sodium: 1100, sugar: 2 },
  // Indian
  { id: 11, emoji: "🍛", name: "Chicken tikka masala", meta: "1 serve · 350g", cuisine: "indian", cal: 420, protein: 28, carbs: 24, fat: 22, fibre: 3, sodium: 890, sugar: 8 },
  { id: 12, emoji: "🫓", name: "Garlic naan", meta: "1 piece", cuisine: "indian", cal: 220, protein: 6, carbs: 38, fat: 5, fibre: 1.5, sodium: 420, sugar: 3 },
  { id: 13, emoji: "🟡", name: "Dal tadka", meta: "1 serve · 300g", cuisine: "indian", cal: 290, protein: 16, carbs: 40, fat: 7, fibre: 8, sodium: 560, sugar: 4 },
  // Thai
  { id: 14, emoji: "🍝", name: "Pad Thai (chicken)", meta: "1 plate", cuisine: "thai", cal: 490, protein: 22, carbs: 62, fat: 14, fibre: 3, sodium: 1050, sugar: 12 },
  { id: 15, emoji: "🥛", name: "Tom kha gai (coconut soup)", meta: "1 bowl", cuisine: "thai", cal: 310, protein: 18, carbs: 14, fat: 20, fibre: 2, sodium: 720, sugar: 5 },
  // Korean
  { id: 16, emoji: "🍱", name: "Bibimbap", meta: "1 bowl", cuisine: "korean", cal: 490, protein: 22, carbs: 68, fat: 12, fibre: 4, sodium: 860, sugar: 6 },
  { id: 17, emoji: "🌶️", name: "Kimchi jjigae (stew)", meta: "1 bowl", cuisine: "korean", cal: 260, protein: 15, carbs: 22, fat: 10, fibre: 4, sodium: 1200, sugar: 5 },
  // Japanese
  { id: 18, emoji: "🍣", name: "Salmon nigiri sushi", meta: "2 pieces", cuisine: "japanese", cal: 130, protein: 9, carbs: 16, fat: 3, fibre: 0, sodium: 290, sugar: 1 },
  { id: 19, emoji: "🍜", name: "Tonkotsu ramen", meta: "1 bowl", cuisine: "japanese", cal: 550, protein: 26, carbs: 68, fat: 18, fibre: 2, sodium: 1350, sugar: 4 },
  // Malaysian
  { id: 20, emoji: "🥘", name: "Laksa lemak", meta: "1 bowl", cuisine: "malaysian", cal: 520, protein: 18, carbs: 55, fat: 26, fibre: 3, sodium: 980, sugar: 5 },
  { id: 21, emoji: "🍚", name: "Nasi lemak", meta: "1 serve", cuisine: "malaysian", cal: 440, protein: 14, carbs: 58, fat: 18, fibre: 3, sodium: 620, sugar: 4 },
];

const RECENT = [1, 2, 5, 20, 16, 11].map(id => FOODS.find(f => f.id === id));

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroPill({ value, unit = "g", label, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 15, fontWeight: 600, color }}>{value}{unit}</div>
      <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function FoodCard({ food, isExpanded, onToggle, activeMeal, onAdd }) {
  return (
    <div
      style={{
        background: "#181818",
        border: `1px solid ${isExpanded ? "#4a7a4a" : "#1e1e1e"}`,
        borderRadius: 10,
        marginBottom: 8,
        overflow: "hidden",
        transition: "border-color 0.15s",
        cursor: "pointer",
      }}
    >
      {/* Main row */}
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "11px 14px",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: "#141414",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {food.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              color: "#e8e8e8",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {food.name}
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{food.meta}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#8fbc8f" }}>{food.cal}</span>
          <span style={{ fontSize: 11, color: "#555" }}> kcal</span>
        </div>
        <span style={{ fontSize: 13, color: "#444", marginLeft: 4 }}>
          {isExpanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded nutrition panel */}
      {isExpanded && (
        <div
          style={{
            borderTop: "1px solid #1e1e1e",
            padding: "14px",
            background: "#141414",
          }}
        >
          {/* Macro grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <MacroPill value={food.protein} label="Protein" color="#8fbc8f" />
            <MacroPill value={food.carbs} label="Carbs" color="#6aabcf" />
            <MacroPill value={food.fat} label="Fat" color="#b48250" />
            <MacroPill value={food.fibre} label="Fibre" color="#9f97e8" />
          </div>

          {/* Secondary stats */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 14,
              paddingBottom: 14,
              borderBottom: "1px solid #1e1e1e",
            }}
          >
            <div style={{ fontSize: 12, color: "#555" }}>
              Sodium <span style={{ color: "#888" }}>{food.sodium}mg</span>
            </div>
            <div style={{ fontSize: 12, color: "#555" }}>
              Sugar <span style={{ color: "#888" }}>{food.sugar}g</span>
            </div>
          </div>

          {/* Add row */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <PortionSelect food={food} activeMeal={activeMeal} onAdd={onAdd} />
          </div>
        </div>
      )}
    </div>
  );
}

function PortionSelect({ food, activeMeal, onAdd }) {
  const [portion, setPortion] = useState("1 serving");
  const portions = ["1 serving", "0.5 serving", "100g", "200g", "Custom"];

  return (
    <>
      <select
        value={portion}
        onChange={e => setPortion(e.target.value)}
        style={{
          flex: 1,
          background: "#181818",
          border: "1px solid #2a2a2a",
          borderRadius: 7,
          padding: "7px 10px",
          color: "#ccc",
          fontSize: 13,
          outline: "none",
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        {portions.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <button
        onClick={() => onAdd(food, portion)}
        style={{
          background: "#8fbc8f",
          border: "none",
          borderRadius: 8,
          padding: "8px 18px",
          fontSize: 13,
          fontWeight: 600,
          color: "#0f0f0f",
          cursor: "pointer",
          whiteSpace: "nowrap",
          fontFamily: "inherit",
        }}
      >
        + Add to {activeMeal}
      </button>
    </>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#0f1a0f",
        border: "1px solid #4a7a4a",
        borderRadius: 10,
        padding: "10px 20px",
        color: "#8fbc8f",
        fontSize: 14,
        zIndex: 100,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      ✓ {message}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FoodSearch() {
  const [query, setQuery] = useState("");
  const [activeCuisine, setActiveCuisine] = useState("all");
  const [activeMeal, setActiveMeal] = useState("Lunch");
  const [expandedId, setExpandedId] = useState(null);
  const [mealDropdownOpen, setMealDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return FOODS.filter(f => {
      const matchesCuisine = activeCuisine === "all" || f.cuisine === activeCuisine;
      const matchesQuery =
        !q || f.name.toLowerCase().includes(q) || f.meta.toLowerCase().includes(q);
      return matchesCuisine && matchesQuery;
    });
  }, [query, activeCuisine]);

  const showRecent = query === "" && activeCuisine === "all";

  function handleAdd(food, portion) {
    setToast(`${food.name} added to ${activeMeal}`);
    setExpandedId(null);
  }

  function handleToggle(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        color: "#e8e8e8",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────── */}
      <div
        style={{
          width: 52,
          background: "#141414",
          borderRight: "1px solid #1e1e1e",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px 0",
          gap: 6,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 28,
            height: 28,
            background: "#8fbc8f",
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: "#0f0f0f",
            }}
          >
            N
          </span>
        </div>

        {/* Nav icons */}
        {[
          { icon: "⊞", label: "Dashboard", active: false },
          { icon: "⌕", label: "Food Search", active: true },
          { icon: "↗", label: "Progress", active: false },
          { icon: "▦", label: "Meal Plans", active: false },
          { icon: "✦", label: "AI Insights", active: false },
          { icon: "◉", label: "Scan", active: false },
        ].map(({ icon, label, active }) => (
          <div
            key={label}
            title={label}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: active ? "#0f1a0f" : "transparent",
              color: active ? "#8fbc8f" : "#555",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            {icon}
          </div>
        ))}
      </div>

      {/* ── Main content ─────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            borderBottom: "1px solid #1e1e1e",
            background: "#0f0f0f",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "#e8e8e8",
              }}
            >
              Food search
            </span>

            {/* Meal selector */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMealDropdownOpen(o => !o)}
                style={{
                  background: "#181818",
                  border: "1px solid #2a2a2a",
                  borderRadius: 7,
                  padding: "4px 10px",
                  fontSize: 12,
                  color: "#8fbc8f",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                Adding to: {activeMeal} ▾
              </button>

              {mealDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    background: "#181818",
                    border: "1px solid #2a2a2a",
                    borderRadius: 8,
                    overflow: "hidden",
                    zIndex: 50,
                    minWidth: 140,
                  }}
                >
                  {MEALS.map(m => (
                    <div
                      key={m}
                      onClick={() => {
                        setActiveMeal(m);
                        setMealDropdownOpen(false);
                      }}
                      style={{
                        padding: "9px 14px",
                        fontSize: 13,
                        color: m === activeMeal ? "#8fbc8f" : "#ccc",
                        background: m === activeMeal ? "#0f1a0f" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {["⟳", "🔖"].map(icon => (
              <div
                key={icon}
                style={{
                  width: 32,
                  height: 32,
                  background: "#181818",
                  border: "1px solid #1e1e1e",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 15,
                  color: "#666",
                }}
              >
                {icon}
              </div>
            ))}
          </div>
        </div>

        {/* Page body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Search bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#181818",
              border: "1px solid #2a2a2a",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 14,
            }}
          >
            <span style={{ color: "#555", fontSize: 18 }}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setExpandedId(null);
              }}
              placeholder="Search foods, dishes, restaurants…"
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: "#e8e8e8",
                fontSize: 15,
                fontFamily: "inherit",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#555",
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ✕
              </button>
            )}
            {/* Scan shortcut */}
            <div
              style={{
                background: "#0f1a0f",
                border: "1px solid #3a5a3a",
                borderRadius: 8,
                padding: "7px 12px",
                color: "#8fbc8f",
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              📷 Scan menu
            </div>
          </div>

          {/* Cuisine filter chips */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {CUISINES.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCuisine(c.id);
                  setExpandedId(null);
                }}
                style={{
                  background: activeCuisine === c.id ? "#0f1a0f" : "#181818",
                  border: `1px solid ${activeCuisine === c.id ? "#4a7a4a" : "#2a2a2a"}`,
                  borderRadius: 20,
                  padding: "5px 13px",
                  fontSize: 12,
                  color: activeCuisine === c.id ? "#8fbc8f" : "#888",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Recently logged */}
          {showRecent && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#555",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Recently logged
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {RECENT.map(food => (
                  <div
                    key={food.id}
                    onClick={() => {
                      setExpandedId(food.id);
                      // Scroll to it
                    }}
                    style={{
                      background: "#181818",
                      border: "1px solid #1e1e1e",
                      borderRadius: 8,
                      padding: "10px 12px",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#3a5a3a")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1e1e")}
                  >
                    <div style={{ fontSize: 13, color: "#ccc", marginBottom: 3 }}>
                      {food.emoji} {food.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#555" }}>{food.cal} kcal</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 12, color: "#555" }}>
              {showRecent
                ? "Popular foods"
                : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
            </span>
            <div
              style={{
                background: "#0f1a0f",
                border: "1px solid #3a5a3a",
                borderRadius: 6,
                padding: "3px 10px",
                fontSize: 11,
                color: "#8fbc8f",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              📍 Aus/Asian DB
            </div>
          </div>

          {/* Food list */}
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 20px",
                color: "#444",
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              No foods found for "{query}"
              <br />
              <span style={{ fontSize: 12, color: "#333", marginTop: 8, display: "block" }}>
                Try a different search term or cuisine filter
              </span>
            </div>
          ) : (
            filtered.map(food => (
              <FoodCard
                key={food.id}
                food={food}
                isExpanded={expandedId === food.id}
                onToggle={() => handleToggle(food.id)}
                activeMeal={activeMeal}
                onAdd={handleAdd}
              />
            ))
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
