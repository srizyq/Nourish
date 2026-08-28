import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { useFoodLogs } from '../hooks/useFoodLogs';
import { todayLocalDate } from '../lib/patterns';
import LogoMark from '../components/LogoMark';

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

// servingGrams: the approximate weight of "1 serving" (the macros above),
// used to convert to/from g, kg, lb, oz. Exact for items with a stated
// weight in `meta`; a reasonable estimate for dish-style items that don't
// (e.g. "1 bowl", "2 rolls") since there's no reliable way to derive one.
const FOODS = [
  { id: 1, emoji: "🥩", name: "Meat pie", meta: "1 pie · 175g", cuisine: "australian", cal: 450, protein: 12, carbs: 38, fat: 28, fibre: 2, sodium: 820, sugar: 4, servingGrams: 175 },
  { id: 2, emoji: "🍗", name: "Chicken breast, grilled", meta: "100g", cuisine: "australian", cal: 165, protein: 31, carbs: 0, fat: 3.6, fibre: 0, sodium: 74, sugar: 0, servingGrams: 100 },
  { id: 3, emoji: "🥞", name: "Vegemite on toast", meta: "2 slices", cuisine: "australian", cal: 210, protein: 7, carbs: 36, fat: 4, fibre: 3, sodium: 560, sugar: 2, servingGrams: 70 },
  { id: 4, emoji: "🐟", name: "Barramundi, pan-fried", meta: "1 fillet · 180g", cuisine: "australian", cal: 220, protein: 38, carbs: 0, fat: 7, fibre: 0, sodium: 130, sugar: 0, servingGrams: 180 },
  { id: 5, emoji: "🍜", name: "Pho bo (beef noodle soup)", meta: "1 bowl", cuisine: "vietnamese", cal: 370, protein: 24, carbs: 42, fat: 9, fibre: 2, sodium: 950, sugar: 3, servingGrams: 500 },
  { id: 6, emoji: "🌯", name: "Goi cuon (fresh spring rolls)", meta: "2 rolls", cuisine: "vietnamese", cal: 130, protein: 7, carbs: 18, fat: 3, fibre: 1.5, sodium: 310, sugar: 2, servingGrams: 120 },
  { id: 7, emoji: "🍚", name: "Com tam (broken rice + pork)", meta: "1 plate", cuisine: "vietnamese", cal: 580, protein: 28, carbs: 72, fat: 16, fibre: 2, sodium: 780, sugar: 6, servingGrams: 400 },
  { id: 8, emoji: "🥟", name: "Dim sum — har gow", meta: "3 pieces", cuisine: "chinese", cal: 140, protein: 8, carbs: 18, fat: 3, fibre: 1, sodium: 380, sugar: 1, servingGrams: 90 },
  { id: 9, emoji: "🍱", name: "Char siu pork", meta: "100g", cuisine: "chinese", cal: 280, protein: 22, carbs: 18, fat: 12, fibre: 0, sodium: 640, sugar: 14, servingGrams: 100 },
  { id: 10, emoji: "🍲", name: "Wonton soup", meta: "1 bowl", cuisine: "chinese", cal: 260, protein: 14, carbs: 32, fat: 8, fibre: 1, sodium: 1100, sugar: 2, servingGrams: 350 },
  { id: 11, emoji: "🍛", name: "Chicken tikka masala", meta: "1 serve · 350g", cuisine: "indian", cal: 420, protein: 28, carbs: 24, fat: 22, fibre: 3, sodium: 890, sugar: 8, servingGrams: 350 },
  { id: 12, emoji: "🫓", name: "Garlic naan", meta: "1 piece", cuisine: "indian", cal: 220, protein: 6, carbs: 38, fat: 5, fibre: 1.5, sodium: 420, sugar: 3, servingGrams: 90 },
  { id: 13, emoji: "🟡", name: "Dal tadka", meta: "1 serve · 300g", cuisine: "indian", cal: 290, protein: 16, carbs: 40, fat: 7, fibre: 8, sodium: 560, sugar: 4, servingGrams: 300 },
  { id: 14, emoji: "🍝", name: "Pad Thai (chicken)", meta: "1 plate", cuisine: "thai", cal: 490, protein: 22, carbs: 62, fat: 14, fibre: 3, sodium: 1050, sugar: 12, servingGrams: 350 },
  { id: 15, emoji: "🥛", name: "Tom kha gai (coconut soup)", meta: "1 bowl", cuisine: "thai", cal: 310, protein: 18, carbs: 14, fat: 20, fibre: 2, sodium: 720, sugar: 5, servingGrams: 350 },
  { id: 16, emoji: "🍱", name: "Bibimbap", meta: "1 bowl", cuisine: "korean", cal: 490, protein: 22, carbs: 68, fat: 12, fibre: 4, sodium: 860, sugar: 6, servingGrams: 450 },
  { id: 17, emoji: "🌶️", name: "Kimchi jjigae (stew)", meta: "1 bowl", cuisine: "korean", cal: 260, protein: 15, carbs: 22, fat: 10, fibre: 4, sodium: 1200, sugar: 5, servingGrams: 400 },
  { id: 18, emoji: "🍣", name: "Salmon nigiri sushi", meta: "2 pieces", cuisine: "japanese", cal: 130, protein: 9, carbs: 16, fat: 3, fibre: 0, sodium: 290, sugar: 1, servingGrams: 60 },
  { id: 19, emoji: "🍜", name: "Tonkotsu ramen", meta: "1 bowl", cuisine: "japanese", cal: 550, protein: 26, carbs: 68, fat: 18, fibre: 2, sodium: 1350, sugar: 4, servingGrams: 500 },
  { id: 20, emoji: "🥘", name: "Laksa lemak", meta: "1 bowl", cuisine: "malaysian", cal: 520, protein: 18, carbs: 55, fat: 26, fibre: 3, sodium: 980, sugar: 5, servingGrams: 450 },
  { id: 21, emoji: "🍚", name: "Nasi lemak", meta: "1 serve", cuisine: "malaysian", cal: 440, protein: 14, carbs: 58, fat: 18, fibre: 3, sodium: 620, sugar: 4, servingGrams: 350 },
];

const RECENT = [1, 2, 5, 20, 16, 11].map(id => FOODS.find(f => f.id === id));

// ─── Unit conversion ───────────────────────────────────────────────────────
const UNITS = [
  { id: "serving", label: "serving", toGrams: null },
  { id: "g", label: "g", toGrams: 1 },
  { id: "kg", label: "kg", toGrams: 1000 },
  { id: "lb", label: "lb", toGrams: 453.592 },
  { id: "oz", label: "oz", toGrams: 28.3495 },
];

// How many base servings `amount` of `unit` represents for a food whose
// "1 serving" (its base cal/protein/etc values) weighs `servingGrams`.
function amountToServings(amount, unitId, servingGrams) {
  if (!amount || amount <= 0) return 0;
  if (unitId === "serving") return amount;
  const unit = UNITS.find(u => u.id === unitId);
  const grams = amount * unit.toGrams;
  return grams / (servingGrams || 100);
}

function scaleFood(food, servings) {
  const round1 = n => Math.round(n * 10) / 10;
  return {
    ...food,
    cal: Math.round(food.cal * servings),
    protein: round1(food.protein * servings),
    carbs: round1(food.carbs * servings),
    fat: round1(food.fat * servings),
    fibre: round1((food.fibre || 0) * servings),
    sodium: Math.round((food.sodium || 0) * servings),
    sugar: round1((food.sugar || 0) * servings),
  };
}

// ─── Barcode Scanner ──────────────────────────────────────────────────────────

function BarcodeScanner({ onAddFood, onClose, defaultMeal }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [looking, setLooking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [meal, setMeal] = useState(defaultMeal);

  useEffect(() => { return () => stopScanner(); }, []);

  async function startScanner() {
    setError(null); setResult(null); setLooking(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (devices.length === 0) { setError("No camera found on this device."); setLooking(false); return; }
      const device = devices.find(d => d.label.toLowerCase().includes("back")) || devices[devices.length - 1];
      await reader.decodeFromVideoDevice(device.deviceId, videoRef.current, async (res) => {
        if (res) { stopScanner(); setScanning(true); await lookupBarcode(res.getText()); }
      });
    } catch (err) {
      console.error(err);
      setError("Couldn't access camera. Make sure you've allowed camera permission.");
      setLooking(false);
    }
  }

  function stopScanner() {
    if (readerRef.current) { try { readerRef.current.reset(); } catch { /* already stopped */ } readerRef.current = null; }
    setLooking(false);
  }

  async function lookupBarcode(barcode) {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status !== 1 || !data.product) { setError(`Product not found for barcode ${barcode}. Try searching manually.`); setScanning(false); return; }
      const p = data.product; const per100 = p.nutriments || {};
      const servingG = parseFloat(p.serving_size) || 100; const factor = servingG / 100;
      setResult({
        name: p.product_name || p.generic_name || "Unknown product",
        brand: p.brands || "", serving: p.serving_size || "100g",
        cal: Math.round((per100["energy-kcal_100g"] || per100["energy_100g"] / 4.184 || 0) * factor),
        protein: Math.round((per100.proteins_100g || 0) * factor * 10) / 10,
        carbs: Math.round((per100.carbohydrates_100g || 0) * factor * 10) / 10,
        fat: Math.round((per100.fat_100g || 0) * factor * 10) / 10,
        fibre: Math.round((per100.fiber_100g || 0) * factor * 10) / 10,
        sodium: Math.round((per100.sodium_100g || 0) * factor * 1000),
        sugar: Math.round((per100.sugars_100g || 0) * factor * 10) / 10,
      });
    } catch (err) { console.error(err); setError("Couldn't look up this product. Check your connection and try again."); }
    finally { setScanning(false); }
  }

  function reset() { setResult(null); setError(null); setScanning(false); setLooking(false); }

  return (
    <div>
      {!result && (
        <div style={{ position: "relative", marginBottom: 14 }}>
          <video ref={videoRef} style={{ width: "100%", borderRadius: 10, background: "#0a0a0a", display: looking ? "block" : "none", maxHeight: 220, objectFit: "cover" }} />
          {looking && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}><div style={{ width: "70%", height: 2, background: "#8fbc8f", opacity: 0.7, boxShadow: "0 0 8px #8fbc8f", borderRadius: 2 }} /></div>}
          {!looking && <div style={{ height: 180, border: "1px dashed #2a2a2a", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}><i className="ti ti-barcode" style={{ fontSize: 36, color: "#333" }} /><div style={{ fontSize: 13, color: "#555" }}>Point your camera at a barcode</div><div style={{ fontSize: 11, color: "#333" }}>Works with most packaged foods</div></div>}
        </div>
      )}
      {scanning && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "20px 0", color: "#555", fontSize: 13 }}><div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #333", borderTopColor: "#8fbc8f", animation: "spin 0.8s linear infinite" }} />Looking up product…</div>}
      {error && <div style={{ background: "#1a0f0f", border: "1px solid #c0707040", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c07070", marginBottom: 12 }}>{error}</div>}
      {result && (
        <div>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Product found</div>
          <div style={{ background: "#181818", border: "1px solid #3a5a3a", borderRadius: 10, padding: "14px", marginBottom: 12 }}>
            <div style={{ fontSize: 14, color: "#e8e8e8", fontWeight: 600, marginBottom: 2 }}>{result.name}</div>
            {result.brand && <div style={{ fontSize: 12, color: "#555", marginBottom: 10 }}>{result.brand} · {result.serving}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 600, color: "#8fbc8f" }}>{result.protein}g</div><div style={{ fontSize: 10, color: "#555" }}>Protein</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 600, color: "#6aabcf" }}>{result.carbs}g</div><div style={{ fontSize: 10, color: "#555" }}>Carbs</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 600, color: "#b48250" }}>{result.fat}g</div><div style={{ fontSize: 10, color: "#555" }}>Fat</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 600, color: "#9f97e8" }}>{result.fibre}g</div><div style={{ fontSize: 10, color: "#555" }}>Fibre</div></div>
            </div>
            <div style={{ display: "flex", gap: 16, paddingTop: 10, borderTop: "1px solid #1e1e1e" }}>
              <div style={{ fontSize: 12, color: "#555" }}>Sodium <span style={{ color: "#888" }}>{result.sodium}mg</span></div>
              <div style={{ fontSize: 12, color: "#555" }}>Sugar <span style={{ color: "#888" }}>{result.sugar}g</span></div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#8fbc8f" }}>{result.cal}</span>
            <span style={{ fontSize: 12, color: "#555" }}> kcal per {result.serving}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={meal} onChange={e => setMeal(e.target.value)} style={{ flex: 1, background: "#181818", border: "1px solid #2a2a2a", borderRadius: 7, padding: "7px 10px", color: "#ccc", fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
              {MEALS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={reset} style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: "#666", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Scan again</button>
            <button onClick={() => { onAddFood({ ...result, source: 'off' }, meal); onClose(); }} style={{ background: "#8fbc8f", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, color: "#0f0f0f", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>+ Add to {meal}</button>
          </div>
        </div>
      )}
      {!result && !scanning && (
        <button onClick={looking ? stopScanner : startScanner} style={{ width: "100%", background: looking ? "#1e1e1e" : "#8fbc8f", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 600, color: looking ? "#c07070" : "#0f0f0f", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>
          <i className={`ti ${looking ? "ti-x" : "ti-camera"}`} style={{ fontSize: 15 }} />
          {looking ? "Stop camera" : "Start scanning"}
        </button>
      )}
    </div>
  );
}

// ─── Scan Modal (barcode only — menu/plate photo AI scanning has been removed:
//    it required posting a secret API key from the browser, which can't be
//    done safely client-side) ────────────────────────────────────────────────

function ScanModal({ onClose, onAddFood, defaultMeal }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div onClick={e => e.stopPropagation()} style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 16, width: "100%", maxWidth: 460, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1e1e1e", position: "sticky", top: 0, background: "#141414", zIndex: 10 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#e8e8e8" }}>Scan barcode</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <BarcodeScanner onAddFood={onAddFood} onClose={onClose} defaultMeal={defaultMeal} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroPill({ value, unit = "g", label, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 15, fontWeight: 600, color }}>{value}{unit}</div>
      <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function FoodCard({ food, isExpanded, onToggle, defaultMeal, onAdd }) {
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState("serving");
  const [meal, setMeal] = useState(defaultMeal);

  useEffect(() => { setMeal(defaultMeal); }, [defaultMeal]);

  const servingGrams = food.servingGrams || 100;
  const servings = amountToServings(Number(amount) || 0, unit, servingGrams);
  const scaled = scaleFood(food, servings || 0);
  const gramsEquivalent = Math.round(servings * servingGrams);

  return (
    <div style={{ background: "#181818", border: `1px solid ${isExpanded ? "#4a7a4a" : "#1e1e1e"}`, borderRadius: 10, marginBottom: 8, overflow: "hidden", transition: "border-color 0.15s", cursor: "pointer" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", padding: "11px 14px", gap: 12 }}>
        <div style={{ width: 40, height: 40, background: "#141414", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{food.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: "#e8e8e8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{food.name}</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{food.meta}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#8fbc8f" }}>{food.cal}</span>
          <span style={{ fontSize: 11, color: "#555" }}> kcal</span>
        </div>
        <span style={{ fontSize: 13, color: "#444", marginLeft: 4 }}>{isExpanded ? "▲" : "▼"}</span>
      </div>
      {isExpanded && (
        <div style={{ borderTop: "1px solid #1e1e1e", padding: "14px", background: "#141414" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
            <MacroPill value={scaled.protein} label="Protein" color="#8fbc8f" />
            <MacroPill value={scaled.carbs} label="Carbs" color="#6aabcf" />
            <MacroPill value={scaled.fat} label="Fat" color="#b48250" />
            <MacroPill value={scaled.fibre} label="Fibre" color="#9f97e8" />
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #1e1e1e" }}>
            <div style={{ fontSize: 12, color: "#555" }}>Sodium <span style={{ color: "#888" }}>{scaled.sodium}mg</span></div>
            <div style={{ fontSize: 12, color: "#555" }}>Sugar <span style={{ color: "#888" }}>{scaled.sugar}g</span></div>
            <div style={{ fontSize: 12, color: "#555", marginLeft: "auto" }}>
              <span style={{ color: "#8fbc8f", fontWeight: 600 }}>{scaled.cal}</span> kcal{unit !== "g" && ` · ≈${gramsEquivalent}g`}
            </div>
          </div>
          <AddControls
            amount={amount} setAmount={setAmount}
            unit={unit} setUnit={setUnit}
            meal={meal} setMeal={setMeal}
            onAdd={() => onAdd(scaled, meal)}
            disabled={!servings}
          />
        </div>
      )}
    </div>
  );
}

function AddControls({ amount, setAmount, unit, setUnit, meal, setMeal, onAdd, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="number" min="0" step="any" value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width: 70, background: "#181818", border: "1px solid #2a2a2a", borderRadius: 7, padding: "7px 10px", color: "#e8e8e8", fontSize: 13, outline: "none", fontFamily: "inherit" }}
        />
        <select value={unit} onChange={e => setUnit(e.target.value)} style={{ flex: 1, background: "#181818", border: "1px solid #2a2a2a", borderRadius: 7, padding: "7px 10px", color: "#ccc", fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
          {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
        <select value={meal} onChange={e => setMeal(e.target.value)} style={{ flex: 1, background: "#181818", border: "1px solid #2a2a2a", borderRadius: 7, padding: "7px 10px", color: "#ccc", fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
          {MEALS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <button
        onClick={onAdd}
        disabled={disabled}
        style={{ background: disabled ? "#2a2a2a" : "#8fbc8f", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, color: disabled ? "#666" : "#0f0f0f", cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}
      >
        + Add to {meal}
      </button>
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#0f1a0f", border: "1px solid #4a7a4a", borderRadius: 10, padding: "10px 20px", color: "#8fbc8f", fontSize: 14, zIndex: 100, whiteSpace: "nowrap", pointerEvents: "none" }}>
      ✓ {message}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FoodSearch() {
  const navigate = useNavigate();
  const { addFood: addFoodLog } = useFoodLogs(todayLocalDate());
  const [query, setQuery] = useState("");
  const [activeCuisine, setActiveCuisine] = useState("all");
  const [activeMeal, setActiveMeal] = useState("Lunch");
  const [expandedId, setExpandedId] = useState(null);
  const [mealDropdownOpen, setMealDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);

  // USDA FoodData Central live search state
  const [offResults, setOffResults] = useState([]);
  const [offLoading, setOffLoading] = useState(false);
  const searchTimer = useRef(null);

  const inputRef = useRef(null);

  // Local filtered results
  const localFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return FOODS;
    return FOODS.filter(f => {
      const matchesCuisine = activeCuisine === "all" || f.cuisine === activeCuisine;
      const matchesQuery = f.name.toLowerCase().includes(q) || f.meta.toLowerCase().includes(q);
      return matchesCuisine && matchesQuery;
    });
  }, [query, activeCuisine]);

  // Search USDA FoodData Central after 500ms debounce
  const searchOFF = useCallback(async (q) => {
    if (!q || q.length < 2) { setOffResults([]); return; }
    const apiKey = import.meta.env.VITE_USDA_API_KEY;
    if (!apiKey) { setOffResults([]); setOffLoading(false); return; }
    setOffLoading(true);
    try {
      const res = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=20&api_key=${apiKey}`
      );
      const data = await res.json();
      const parsed = (data.foods || []).map(f => {
        const nutrients = f.foodNutrients || [];
        const get = (name) => {
          const n = nutrients.find(n => n.nutrientName?.toLowerCase().includes(name));
          return n ? Math.round(n.value * 10) / 10 : 0;
        };
        const cal = get("energy") || 0;
        if (!cal) return null;
        return {
          id: "usda_" + f.fdcId,
          emoji: "🥗",
          name: f.description,
          meta: (f.brandOwner ? f.brandOwner + " · " : "") + "100g",
          cuisine: "all",
          cal: Math.round(cal),
          protein: get("protein"),
          carbs: get("carbohydrate"),
          fat: get("total lipid"),
          fibre: get("fiber"),
          sodium: Math.round(get("sodium")),
          sugar: get("sugars"),
          source: "usda",
          servingGrams: 100,
        };
      }).filter(Boolean).slice(0, 15);
      setOffResults(parsed);
    } catch (err) {
      console.error("USDA search error:", err);
      setOffResults([]);
    } finally {
      setOffLoading(false);
    }
  }, []);
  // Trigger search with debounce when query changes
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setOffResults([]); setOffLoading(false); return; }
    setOffLoading(true);
    searchTimer.current = setTimeout(() => searchOFF(query.trim()), 500);
    return () => clearTimeout(searchTimer.current);
  }, [query, searchOFF]);

  // Combine local + USDA results, deduplicating by name
  const allResults = useMemo(() => {
    if (!query.trim()) return localFiltered;
    const localNames = new Set(localFiltered.map(f => f.name.toLowerCase()));
    const deduped = offResults.filter(f => !localNames.has(f.name.toLowerCase()));
    return [...localFiltered, ...deduped];
  }, [localFiltered, offResults, query]);

  const showRecent = query === "" && activeCuisine === "all";

  function handleAdd(food, meal) {
    addFoodLog(food, meal);
    setToast(`${food.name} added to ${meal}`);
    setExpandedId(null);
  }

  function handleToggle(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#e8e8e8", fontFamily: "'DM Sans', sans-serif", display: "flex" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 52, background: "#0f0f0f", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: 28, flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <LogoMark size={28} />
        <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: "pointer", color: "#666", fontSize: 18 }} title="Dashboard" onClick={() => navigate("/dashboard")}><i className="ti ti-layout-dashboard" /></div>
        <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: "pointer", color: "#8fbc8f", background: "#0f1a0f", fontSize: 18 }} title="Food search"><i className="ti ti-search" /></div>
        <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: "pointer", color: "#666", fontSize: 18 }} title="Progress" onClick={() => navigate("/progress")}><i className="ti ti-chart-line" /></div>
        <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: "pointer", color: "#666", fontSize: 18 }} title="Meal plans" onClick={() => navigate("/meals")}><i className="ti ti-calendar" /></div>
        <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: "pointer", color: "#666", fontSize: 18 }} title="AI insights" onClick={() => navigate("/insights")}><i className="ti ti-sparkles" /></div>
        <div style={{ flex: 1 }} />
        <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: "pointer", color: "#666", fontSize: 18 }} title="Settings" onClick={() => navigate("/settings")}><i className="ti ti-settings" /></div>
        <div style={{ width: 32, height: 32, background: "#181818", border: "1px solid #2a2a2a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#8fbc8f", fontWeight: 600, cursor: "pointer" }} onClick={() => navigate("/profile")} />
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflow: "auto" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #1e1e1e", background: "#0f0f0f", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#e8e8e8" }}>Food search</span>
            <div style={{ position: "relative" }}>
              <button onClick={() => setMealDropdownOpen(o => !o)} style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 7, padding: "4px 10px", fontSize: 12, color: "#8fbc8f", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                Adding to: {activeMeal} ▾
              </button>
              {mealDropdownOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#181818", border: "1px solid #2a2a2a", borderRadius: 8, overflow: "hidden", zIndex: 50, minWidth: 140 }}>
                  {MEALS.map(m => <div key={m} onClick={() => { setActiveMeal(m); setMealDropdownOpen(false); }} style={{ padding: "9px 14px", fontSize: 13, color: m === activeMeal ? "#8fbc8f" : "#ccc", background: m === activeMeal ? "#0f1a0f" : "transparent", cursor: "pointer" }}>{m}</div>)}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["⟳", "🔖"].map(icon => <div key={icon} style={{ width: 32, height: 32, background: "#181818", border: "1px solid #1e1e1e", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15, color: "#666" }}>{icon}</div>)}
          </div>
        </div>

        {/* Page body */}
        <div style={{ padding: "20px 24px" }}>

          {/* Search bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#181818", border: "1px solid #2a2a2a", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
            <i className="ti ti-search" style={{ color: "#555", fontSize: 18 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setExpandedId(null); }}
              placeholder="Search any food, dish, or product…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e8e8e8", fontSize: 15, fontFamily: "inherit" }}
            />
            {offLoading && <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #333", borderTopColor: "#8fbc8f", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />}
            {query && !offLoading && <button onClick={() => { setQuery(""); setOffResults([]); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>✕</button>}
            <div onClick={() => setScanOpen(true)} style={{ background: "#0f1a0f", border: "1px solid #3a5a3a", borderRadius: 8, padding: "7px 12px", color: "#8fbc8f", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }} onMouseEnter={e => e.currentTarget.style.borderColor = "#4a7a4a"} onMouseLeave={e => e.currentTarget.style.borderColor = "#3a5a3a"}>
              <i className="ti ti-barcode" style={{ fontSize: 14 }} /> Scan barcode
            </div>
          </div>

          {/* Cuisine chips — hide when actively searching */}
          {!query && (
            <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
              {CUISINES.map(c => (
                <button key={c.id} onClick={() => { setActiveCuisine(c.id); setExpandedId(null); }} style={{ background: activeCuisine === c.id ? "#0f1a0f" : "#181818", border: `1px solid ${activeCuisine === c.id ? "#4a7a4a" : "#2a2a2a"}`, borderRadius: 20, padding: "5px 13px", fontSize: 12, color: activeCuisine === c.id ? "#8fbc8f" : "#888", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit", transition: "all 0.15s" }}>
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Recently logged */}
          {showRecent && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Recently logged</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {RECENT.map(food => (
                  <div key={food.id} onClick={() => setExpandedId(food.id)} style={{ background: "#181818", border: "1px solid #1e1e1e", borderRadius: 8, padding: "10px 12px", cursor: "pointer", transition: "border-color 0.15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#3a5a3a"} onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e1e"}>
                    <div style={{ fontSize: 13, color: "#ccc", marginBottom: 3 }}>{food.emoji} {food.name}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{food.cal} kcal</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#555" }}>
              {showRecent ? "Popular foods" : offLoading ? "Searching…" : `${allResults.length} result${allResults.length !== 1 ? "s" : ""}`}
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {query && offResults.length > 0 && (
                <div style={{ background: "#0a1520", border: "1px solid #2a4a6a", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#6aabcf", display: "flex", alignItems: "center", gap: 5 }}>
                🇺🇸 USDA Database
              </div>
              )}
              <div style={{ background: "#0f1a0f", border: "1px solid #3a5a3a", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#8fbc8f", display: "flex", alignItems: "center", gap: 5 }}>📍 Aus/Asian DB</div>
            </div>
          </div>

          {/* Food list */}
          {allResults.length === 0 && !offLoading ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#444", fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              No foods found for "{query}"
              <br />
              <span style={{ fontSize: 12, color: "#333", marginTop: 8, display: "block" }}>Try a different search term or use the scan button</span>
            </div>
          ) : (
            allResults.map(food => (
              <FoodCard
                key={food.id}
                food={food}
                isExpanded={expandedId === food.id}
                onToggle={() => handleToggle(food.id)}
                defaultMeal={activeMeal}
                onAdd={handleAdd}
              />
            ))
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Scan modal */}
      {scanOpen && (
        <ScanModal
          onClose={() => setScanOpen(false)}
          defaultMeal={activeMeal}
          onAddFood={(food, meal) => { addFoodLog(food, meal); setToast(`${food.name} added to ${meal}`); }}
        />
      )}
    </div>
  );
}
