import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useFoodLogs } from '../hooks/useFoodLogs';
import { useRecentFoods } from '../hooks/useRecentFoods';
import { useCustomFoods } from '../hooks/useCustomFoods';
import { useSavedMeals } from '../hooks/useSavedMeals';
import { useFavouriteFoods } from '../hooks/useFavouriteFoods';
import { useFrequentFoods } from '../hooks/useFrequentFoods';
import { todayLocalDate } from '../lib/patterns';
import AppNav from '../components/AppNav';

// ─── Data ────────────────────────────────────────────────────────────────────

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];

// ─── Food category icons ────────────────────────────────────────────────────
// Replaces emoji (which render as blank "tofu" boxes for a lot of glyphs,
// especially the ones dynamically assigned to arbitrary search results) with
// Tabler icon-font icons — the same icon system already used everywhere
// else in the app, so it always renders and looks intentional rather than
// broken.
const CATEGORY_STYLES = {
  meat:      { icon: "ti-meat",    color: "#8fbc8f" },
  seafood:   { icon: "ti-fish",    color: "#6aabcf" },
  egg:       { icon: "ti-egg",     color: "#e8c468" },
  dairy:     { icon: "ti-milk",    color: "#9f97e8" },
  fruit:     { icon: "ti-apple",   color: "#c07070" },
  vegetable: { icon: "ti-carrot",  color: "#7fae5f" },
  grain:     { icon: "ti-bread",   color: "#b48250" },
  sweet:     { icon: "ti-cookie",  color: "#d98fb0" },
  beverage:  { icon: "ti-cup",     color: "#6aabcf" },
  other:     { icon: "ti-package", color: "#888888" },
  custom:    { icon: "ti-stars",   color: "#b48fd9" },
};

// Checked in order — more specific animal-protein categories first, so e.g.
// "Meat pie" matches "meat" before a generic bakery term could.
const CATEGORY_KEYWORDS = [
  ["seafood", ["fish", "salmon", "tuna", "prawn", "shrimp", "crab", "oyster", "squid", "calamari", "cod", "barramundi", "trout", "sushi", "sashimi", "seafood"]],
  ["meat", ["chicken", "beef", "pork", "lamb", "turkey", "bacon", "sausage", "mince", "steak", "ham", "meat", "veal", "duck", "mutton", "burger", "sirloin"]],
  ["egg", ["egg"]],
  ["dairy", ["milk", "cheese", "yoghurt", "yogurt", "cream", "butter", "custard"]],
  ["fruit", ["apple", "banana", "orange", "berry", "grape", "mango", "pineapple", "melon", "pear", "peach", "plum", "kiwi", "cherry", "fruit", "avocado"]],
  ["vegetable", ["broccoli", "spinach", "carrot", "potato", "tomato", "lettuce", "cabbage", "onion", "capsicum", "cucumber", "zucchini", "pumpkin", "corn", "bean", "vegetable", "salad", "kale", "mushroom"]],
  ["grain", ["bread", "rice", "oats", "pasta", "noodle", "cereal", "toast", "bagel", "muffin", "cake", "pastry", "pie", "naan", "roti", "wrap", "bun", "pizza", "biscuit", "cracker", "flour", "wheat", "quinoa"]],
  ["sweet", ["chocolate", "candy", "lolly", "sweet", "dessert", "ice cream", "honey", "sugar", "jam", "syrup", "cookie", "donut", "doughnut"]],
  ["beverage", ["juice", "soda", "drink", "water", "coffee", "tea", "smoothie", "milkshake", "cola", "beer", "wine"]],
];

function guessCategory(name) {
  const n = name.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some(k => n.includes(k))) return category;
  }
  return "other";
}

function getCategoryStyle(food) {
  return CATEGORY_STYLES[food.category || guessCategory(food.name)] || CATEGORY_STYLES.other;
}


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

// ─── Live search ─────────────────────────────────────────────────────────
// Open Food Facts — no API key required, strong branded/packaged coverage
// (this is what finds things like Weet-Bix, Vegemite, etc.). Uses the
// Australia subdomain so results are products actually sold here
// (Capilano, Sanitarium, Woolworths own brand, etc.) instead of being
// dominated by UK/US supermarket SKUs.
async function searchOpenFoodFacts(q) {
  const url = `https://au.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&sort_by=unique_scans_n&fields=product_name,generic_name,brands,nutriments,code`;
  // Open Food Facts' shared search backend has occasional one-off blips
  // (a request fails, the very next one succeeds) — one retry absorbs
  // that without surfacing a false "unavailable" error to the user.
  let res;
  try {
    res = await fetch(url);
  } catch {
    await new Promise(r => setTimeout(r, 500));
    res = await fetch(url);
  }
  if (!res.ok) throw new Error(`Open Food Facts search failed: ${res.status}`);
  const data = await res.json();
  return (data.products || []).map(p => {
    const n = p.nutriments || {};
    const cal = Math.round(n["energy-kcal_100g"] || (n["energy_100g"] ? n["energy_100g"] / 4.184 : 0) || 0);
    const name = p.product_name || p.generic_name;
    if (!cal || !name) return null;
    return {
      id: "off_" + p.code,
      name: p.brands ? `${name} (${p.brands})` : name,
      meta: "100g",
      cuisine: "all",
      cal,
      protein: Math.round((n.proteins_100g || 0) * 10) / 10,
      carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
      fat: Math.round((n.fat_100g || 0) * 10) / 10,
      fibre: Math.round((n.fiber_100g || 0) * 10) / 10,
      sodium: Math.round((n.sodium_100g || 0) * 1000),
      sugar: Math.round((n.sugars_100g || 0) * 10) / 10,
      source: "off",
      servingGrams: 100,
    };
  }).filter(Boolean);
}

// FatSecret Platform API — a purpose-built consumer food search database
// (the same one MacroFactor licenses), routed through our own serverless
// proxy at /api/fatsecret-search since FatSecret's OAuth Client Secret
// can't safely be exposed in browser code. Unlike USDA's research-database
// search — built for scientists, not food-logging apps, and needing a pile
// of client-side re-ranking heuristics to be usable — FatSecret's own
// relevance ranking is tuned on real consumer search behaviour, so no
// re-ranking is needed here.
function fatSecretServings(food) {
  const raw = food.servings?.serving;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

// Most servings describe themselves in grams ("100 g", "150g slice") — pull
// that out for unit conversion. Servings described in non-gram units
// ("1 cup", "1 medium") fall back to 100; the default "serving" unit in the
// add-to-log UI is unaffected either way since it uses the API's own
// serving values directly rather than converting through grams.
function parseGramsFromServing(serving) {
  const match = (serving.serving_description || "").match(/([\d.]+)\s*g\b/i);
  return match ? parseFloat(match[1]) : 100;
}

async function searchFatSecret(q) {
  const url = `/api/fatsecret-search?q=${encodeURIComponent(q)}`;
  let res = await fetch(url);
  if (!res.ok) res = await fetch(url);
  if (!res.ok) throw new Error(`FatSecret search failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "FatSecret search failed");

  const rawFoods = data.foods_search?.results?.food;
  const foods = Array.isArray(rawFoods) ? rawFoods : rawFoods ? [rawFoods] : [];

  return foods.map(food => {
    const serving = fatSecretServings(food)[0];
    if (!serving) return null;
    const cal = Math.round(parseFloat(serving.calories) || 0);
    if (!cal) return null;
    return {
      id: "fs_" + food.food_id,
      name: food.food_type === "Brand" && food.brand_name ? `${food.food_name} (${food.brand_name})` : food.food_name,
      meta: serving.serving_description || "1 serving",
      cuisine: "all",
      cal,
      protein: Math.round((parseFloat(serving.protein) || 0) * 10) / 10,
      carbs: Math.round((parseFloat(serving.carbohydrate) || 0) * 10) / 10,
      fat: Math.round((parseFloat(serving.fat) || 0) * 10) / 10,
      fibre: Math.round((parseFloat(serving.fiber) || 0) * 10) / 10,
      sodium: Math.round(parseFloat(serving.sodium) || 0),
      sugar: Math.round((parseFloat(serving.sugar) || 0) * 10) / 10,
      source: "fatsecret",
      servingGrams: parseGramsFromServing(serving),
    };
  }).filter(Boolean);
}

// ─── Barcode Scanner ──────────────────────────────────────────────────────────

// GTIN-13 is what FatSecret's barcode endpoint expects — UPC-A (12 digits)
// and EAN-8 zero-pad up to it cleanly, which covers the formats ZXing is
// configured to detect below.
function toGtin13(code) {
  const digits = code.replace(/\D/g, "");
  return digits.padStart(13, "0").slice(-13);
}

// FatSecret's barcode data is far more complete than Open Food Facts' (many
// OFF entries have missing/zeroed nutriment fields — confirmed by direct
// testing), so it's tried first. OFF stays as a fallback for products
// FatSecret doesn't have (its "No food item detected" response), since
// OFF's crowdsourced coverage skews better for AU-specific/regional items.
async function lookupFatSecretBarcode(barcode) {
  const res = await fetch(`/api/fatsecret-barcode?barcode=${encodeURIComponent(toGtin13(barcode))}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error || !data.food) return null;
  const food = data.food;
  const rawServings = food.servings?.serving;
  const servings = Array.isArray(rawServings) ? rawServings : rawServings ? [rawServings] : [];
  const serving = servings[0];
  if (!serving) return null;
  const cal = Math.round(parseFloat(serving.calories) || 0);
  if (!cal) return null;
  return {
    name: food.food_name,
    brand: food.brand_name || "",
    serving: serving.serving_description || "1 serving",
    cal,
    protein: Math.round((parseFloat(serving.protein) || 0) * 10) / 10,
    carbs: Math.round((parseFloat(serving.carbohydrate) || 0) * 10) / 10,
    fat: Math.round((parseFloat(serving.fat) || 0) * 10) / 10,
    fibre: Math.round((parseFloat(serving.fiber) || 0) * 10) / 10,
    sodium: Math.round(parseFloat(serving.sodium) || 0),
    sugar: Math.round((parseFloat(serving.sugar) || 0) * 10) / 10,
    source: "fatsecret",
  };
}

async function lookupOpenFoodFactsBarcode(barcode) {
  const res = await fetch(`https://au.openfoodfacts.org/api/v0/product/${barcode}.json`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  const p = data.product; const per100 = p.nutriments || {};
  const servingG = parseFloat(p.serving_size) || 100; const factor = servingG / 100;
  const cal = Math.round((per100["energy-kcal_100g"] || per100["energy_100g"] / 4.184 || 0) * factor);
  if (!cal) return null;
  return {
    name: p.product_name || p.generic_name || "Unknown product",
    brand: p.brands || "", serving: p.serving_size || "100g",
    cal,
    protein: Math.round((per100.proteins_100g || 0) * factor * 10) / 10,
    carbs: Math.round((per100.carbohydrates_100g || 0) * factor * 10) / 10,
    fat: Math.round((per100.fat_100g || 0) * factor * 10) / 10,
    fibre: Math.round((per100.fiber_100g || 0) * factor * 10) / 10,
    sodium: Math.round((per100.sodium_100g || 0) * factor * 1000),
    sugar: Math.round((per100.sugars_100g || 0) * factor * 10) / 10,
    source: "off",
  };
}

function BarcodeScanner({ onAddFood, onClose, defaultMeal }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  // Guards against the decode callback firing more than once for the same
  // detection (ZXing can report the same barcode on consecutive frames
  // before the stream actually stops) — without this, two concurrent
  // lookups can land in either order and leave a stale error sitting next
  // to a valid result, since they write to separate state.
  const processingRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [looking, setLooking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [meal, setMeal] = useState(defaultMeal);

  // Jump straight into the camera on open — no reason to make someone tap
  // "Start scanning" first when they already tapped "Scan barcode" to get
  // here. Deliberately mount-only: startScanner/stopScanner recreate every
  // render, but re-running this on every render would restart the camera.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startScanner(); return () => stopScanner(); }, []);

  async function startScanner() {
    setError(null); setResult(null); setLooking(true);
    processingRef.current = false;
    try {
      const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);
      // Retail barcodes only — narrowing formats (instead of ZXing's full
      // default set, which also tries QR/PDF417/Aztec/etc every frame)
      // means less wasted work per frame and fewer false reads.
      // TRY_HARDER spends more time per frame to tolerate the tilted/
      // slightly-off-angle holds real handheld scanning actually looks like.
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints);
      // decodeFromConstraints + facingMode (rather than enumerating devices
      // and guessing which one is "back" from its label) both skips an
      // extra device-listing round trip before the camera opens, and lets
      // us request continuous autofocus, which is most of why a barcode
      // previously needed to be held dead-still to focus.
      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            advanced: [{ focusMode: "continuous" }],
          },
        },
        videoRef.current,
        async (res) => {
          if (res && !processingRef.current) {
            processingRef.current = true;
            stopScanner();
            setScanning(true);
            await lookupBarcode(res.getText());
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      console.error(err);
      setError("Couldn't access camera. Make sure you've allowed camera permission.");
      setLooking(false);
    }
  }

  function stopScanner() {
    if (controlsRef.current) { try { controlsRef.current.stop(); } catch { /* already stopped */ } controlsRef.current = null; }
    setLooking(false);
  }

  async function lookupBarcode(barcode) {
    try {
      const found = (await lookupFatSecretBarcode(barcode).catch(() => null))
        || (await lookupOpenFoodFactsBarcode(barcode).catch(() => null));
      if (!found) {
        setResult(null);
        setError(`Product not found for barcode ${barcode}. Try searching manually.`);
        return;
      }
      setError(null);
      setResult(found);
    } catch (err) { console.error(err); setResult(null); setError("Couldn't look up this product. Check your connection and try again."); }
    finally { setScanning(false); }
  }

  function reset() { setResult(null); setError(null); setScanning(false); startScanner(); }

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
            <button onClick={() => { onAddFood(result, meal); onClose(); }} style={{ background: "#8fbc8f", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, color: "#0f0f0f", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>+ Add to {meal}</button>
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

// ─── Modal shell (shared by the create-food / saved-meals / builder modals) ──

function ModalShell({ title, onClose, children, maxWidth = 460 }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 16, width: "100%", maxWidth, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1e1e1e", position: "sticky", top: 0, background: "#141414", zIndex: 10 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#e8e8e8" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

const fieldStyle = { width: "100%", background: "#181818", border: "1px solid #2a2a2a", borderRadius: 7, padding: "9px 12px", color: "#e8e8e8", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const labelStyle = { fontSize: 11, color: "#777", marginBottom: 5, display: "block" };

// ─── Create a custom food ───────────────────────────────────────────────────

function CreateFoodModal({ onClose, onCreate, initialName }) {
  const [name, setName] = useState(initialName || "");
  const [brand, setBrand] = useState("");
  const [servingLabel, setServingLabel] = useState("1 serving");
  const [servingGrams, setServingGrams] = useState("");
  const [cal, setCal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fibre, setFibre] = useState("");
  const [sodium, setSodium] = useState("");
  const [sugar, setSugar] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const valid = name.trim() && Number(cal) >= 0 && cal !== "";

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        brand: brand.trim() || null,
        servingLabel: servingLabel.trim() || "1 serving",
        servingGrams: servingGrams ? Number(servingGrams) : null,
        cal: Number(cal) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        fibre: Number(fibre) || 0,
        sodium: Number(sodium) || 0,
        sugar: Number(sugar) || 0,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Couldn't save this food. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Create a custom food" onClose={onClose}>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={labelStyle}>Food name *</label>
          <input style={fieldStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mum's lasagna" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Brand (optional)</label>
            <input style={fieldStyle} value={brand} onChange={e => setBrand(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Serving size</label>
            <input style={fieldStyle} value={servingLabel} onChange={e => setServingLabel(e.target.value)} placeholder="1 serving" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Serving weight in grams (optional, for unit conversion)</label>
          <input style={fieldStyle} type="number" min="0" value={servingGrams} onChange={e => setServingGrams(e.target.value)} placeholder="e.g. 250" />
        </div>
        <div>
          <label style={labelStyle}>Calories *</label>
          <input style={fieldStyle} type="number" min="0" value={cal} onChange={e => setCal(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <div><label style={labelStyle}>Protein (g)</label><input style={fieldStyle} type="number" min="0" value={protein} onChange={e => setProtein(e.target.value)} /></div>
          <div><label style={labelStyle}>Carbs (g)</label><input style={fieldStyle} type="number" min="0" value={carbs} onChange={e => setCarbs(e.target.value)} /></div>
          <div><label style={labelStyle}>Fat (g)</label><input style={fieldStyle} type="number" min="0" value={fat} onChange={e => setFat(e.target.value)} /></div>
          <div><label style={labelStyle}>Fibre (g)</label><input style={fieldStyle} type="number" min="0" value={fibre} onChange={e => setFibre(e.target.value)} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={labelStyle}>Sodium (mg)</label><input style={fieldStyle} type="number" min="0" value={sodium} onChange={e => setSodium(e.target.value)} /></div>
          <div><label style={labelStyle}>Sugar (g)</label><input style={fieldStyle} type="number" min="0" value={sugar} onChange={e => setSugar(e.target.value)} /></div>
        </div>
        {error && <div style={{ background: "#1a0f0f", border: "1px solid #c0707040", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c07070" }}>{error}</div>}
        <button onClick={submit} disabled={!valid || saving} style={{ background: !valid || saving ? "#2a2a2a" : "#8fbc8f", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 600, color: !valid || saving ? "#666" : "#0f0f0f", cursor: !valid || saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {saving ? "Saving…" : "Save custom food"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Saved meals (MyFitnessPal-style "Meals"/recipes) ──────────────────────

function SavedMealsModal({ meals, loading, onClose, onLog, onDelete, onStartBuilder }) {
  return (
    <ModalShell title="Saved meals" onClose={onClose}>
      <button onClick={onStartBuilder} style={{ width: "100%", background: "#0f1a0f", border: "1px solid #3a5a3a", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, color: "#8fbc8f", cursor: "pointer", fontFamily: "inherit", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <i className="ti ti-plus" /> Build a new meal
      </button>
      {loading ? null : meals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px", color: "#444", fontSize: 13, background: "#181818", border: "1px dashed #2a2a2a", borderRadius: 10 }}>
          No saved meals yet. Build one from foods you log often.
        </div>
      ) : (
        meals.map(meal => {
          const items = meal.items || [];
          const totalCal = items.reduce((s, it) => s + (Number(it.cal) || 0), 0);
          return (
            <div key={meal.id} style={{ background: "#181818", border: "1px solid #1e1e1e", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "#e8e8e8" }}>{meal.name}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{items.length} item{items.length !== 1 ? "s" : ""} · {Math.round(totalCal)} kcal</div>
              </div>
              <button onClick={() => onLog(meal)} style={{ background: "#8fbc8f", border: "none", borderRadius: 7, padding: "7px 12px", fontSize: 12, fontWeight: 600, color: "#0f0f0f", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Log all</button>
              <button onClick={() => onDelete(meal.id)} style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: 7, padding: "7px 9px", color: "#c07070", cursor: "pointer" }}><i className="ti ti-trash" /></button>
            </div>
          );
        })
      )}
    </ModalShell>
  );
}

// ─── Meal builder review — save what's been added to the builder cart as a
//    named saved meal, and optionally log it right away ──────────────────

function BuilderReviewModal({ items, onClose, onRemove, onSave, defaultMeal }) {
  const [name, setName] = useState("");
  const [logNow, setLogNow] = useState(true);
  const [meal, setMeal] = useState(defaultMeal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const totals = items.reduce((t, it) => ({
    cal: t.cal + (Number(it.cal) || 0),
    protein: t.protein + (Number(it.protein) || 0),
    carbs: t.carbs + (Number(it.carbs) || 0),
    fat: t.fat + (Number(it.fat) || 0),
  }), { cal: 0, protein: 0, carbs: 0, fat: 0 });

  async function submit() {
    if (!name.trim() || items.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), items, logNow ? meal : null);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Couldn't save this meal. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={`Meal builder (${items.length})`} onClose={onClose}>
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#444", fontSize: 13 }}>
          No items yet — close this, then tap "+ Add to meal" on any food.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < items.length - 1 ? "1px solid #1e1e1e" : "none" }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div>
                <div style={{ fontSize: 12, color: "#8fbc8f", flexShrink: 0 }}>{Math.round(it.cal)} kcal</div>
                <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 15, padding: 0 }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #1e1e1e", fontSize: 12, color: "#555" }}>
            <span><span style={{ color: "#8fbc8f", fontWeight: 600 }}>{Math.round(totals.cal)}</span> kcal</span>
            <span>P <span style={{ color: "#888" }}>{Math.round(totals.protein)}g</span></span>
            <span>C <span style={{ color: "#888" }}>{Math.round(totals.carbs)}g</span></span>
            <span>F <span style={{ color: "#888" }}>{Math.round(totals.fat)}g</span></span>
          </div>
          <label style={labelStyle}>Meal name *</label>
          <input style={{ ...fieldStyle, marginBottom: 12 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My usual breakfast" />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ccc", marginBottom: logNow ? 12 : 16, cursor: "pointer" }}>
            <input type="checkbox" checked={logNow} onChange={e => setLogNow(e.target.checked)} />
            Also log to today
          </label>
          {logNow && (
            <select value={meal} onChange={e => setMeal(e.target.value)} style={{ ...fieldStyle, marginBottom: 16, cursor: "pointer" }}>
              {MEALS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          {error && <div style={{ background: "#1a0f0f", border: "1px solid #c0707040", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c07070", marginBottom: 12 }}>{error}</div>}
          <button onClick={submit} disabled={!name.trim() || saving} style={{ width: "100%", background: !name.trim() || saving ? "#2a2a2a" : "#8fbc8f", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 600, color: !name.trim() || saving ? "#666" : "#0f0f0f", cursor: !name.trim() || saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            {saving ? "Saving…" : logNow ? `Save meal & log to ${meal}` : "Save meal"}
          </button>
        </>
      )}
    </ModalShell>
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

function FoodCard({ food, isExpanded, onToggle, defaultMeal, onAdd, addLabel, onDelete, isFavourite, onToggleFavourite }) {
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState("serving");
  const [meal, setMeal] = useState(defaultMeal);

  useEffect(() => { setMeal(defaultMeal); }, [defaultMeal]);

  const servingGrams = food.servingGrams || 100;
  const servings = amountToServings(Number(amount) || 0, unit, servingGrams);
  const scaled = scaleFood(food, servings || 0);
  const gramsEquivalent = Math.round(servings * servingGrams);
  const catStyle = getCategoryStyle(food);

  return (
    <div style={{ background: "#181818", border: `1px solid ${isExpanded ? "#4a7a4a" : "#1e1e1e"}`, borderRadius: 10, marginBottom: 8, overflow: "hidden", transition: "border-color 0.15s", cursor: "pointer" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", padding: "11px 14px", gap: 12 }}>
        <div style={{ width: 40, height: 40, background: catStyle.color + "22", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, color: catStyle.color }}><i className={`ti ${catStyle.icon}`} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: "#e8e8e8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {food.name}
            {food.source === "custom" && <span style={{ marginLeft: 8, fontSize: 10, color: "#b48fd9", border: "1px solid #b48fd950", borderRadius: 5, padding: "1px 6px", verticalAlign: "middle" }}>Custom</span>}
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{food.meta}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#8fbc8f" }}>{food.cal}</span>
          <span style={{ fontSize: 11, color: "#555" }}> kcal</span>
        </div>
        {onToggleFavourite && (
          <button onClick={(e) => { e.stopPropagation(); onToggleFavourite(); }} title={isFavourite ? "Remove favourite" : "Add favourite"} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0, color: isFavourite ? "#e8c468" : "#333", fontSize: 16, display: "flex" }}>
            <i className={isFavourite ? "ti ti-star-filled" : "ti ti-star"} />
          </button>
        )}
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
            addLabel={addLabel}
          />
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ marginTop: 10, width: "100%", background: "none", border: "1px solid #2a2a2a", borderRadius: 8, padding: "7px", fontSize: 12, color: "#c07070", cursor: "pointer", fontFamily: "inherit" }}>
                <i className="ti ti-trash" style={{ marginRight: 5 }} />Delete custom food
              </button>
          )}
        </div>
      )}
    </div>
  );
}

function AddControls({ amount, setAmount, unit, setUnit, meal, setMeal, onAdd, disabled, addLabel }) {
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
        {addLabel ? addLabel : `+ Add to ${meal}`}
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
  const location = useLocation();
  const { addFood: addFoodLog } = useFoodLogs(todayLocalDate());
  const { rows: recentRows, loading: recentLoading, refetch: refetchRecent } = useRecentFoods(6);
  const customFoods = useCustomFoods();
  const savedMeals = useSavedMeals();
  const favourites = useFavouriteFoods();
  const frequent = useFrequentFoods(6);
  const [query, setQuery] = useState("");
  // Dashboard's per-meal "+ Add food" links here with the meal it was
  // clicked from (e.g. { openMeal: "breakfast" }) so this page lands on
  // the right meal instead of always defaulting to Lunch.
  const [activeMeal, setActiveMeal] = useState(() => {
    const requested = location.state?.openMeal;
    if (!requested) return "Lunch";
    const capitalized = requested.charAt(0).toUpperCase() + requested.slice(1);
    return MEALS.includes(capitalized) ? capitalized : "Lunch";
  });
  const [expandedId, setExpandedId] = useState(null);
  const [mealDropdownOpen, setMealDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null);
  // Dashboard's "Scan barcode" shortcut links here with { openScan: true }
  // to jump straight into the scanner instead of landing on plain search.
  const [scanOpen, setScanOpen] = useState(!!location.state?.openScan);
  const [createFoodOpen, setCreateFoodOpen] = useState(false);
  const [savedMealsOpen, setSavedMealsOpen] = useState(false);
  const [builderMode, setBuilderMode] = useState(false);
  const [builderItems, setBuilderItems] = useState([]);
  const [builderReviewOpen, setBuilderReviewOpen] = useState(false);

  // Live external search state — FatSecret (generic foods, comprehensive
  // across every category) and Open Food Facts (packaged/branded products,
  // AU-scoped) are kept separate so they can render in different sections.
  const [genericResults, setGenericResults] = useState([]);
  const [packagedLive, setPackagedLive] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const searchTimer = useRef(null);

  const inputRef = useRef(null);

  // Foods the user has created themselves — shown alongside everything
  // else, matched by name when searching.
  const customAsFoods = useMemo(() => customFoods.rows.map(row => ({
    id: "custom_" + row.id,
    customId: row.id,
    category: "custom",
    name: row.name,
    meta: (row.brand ? row.brand + " · " : "") + (row.serving_label || "1 serving"),
    cuisine: "all",
    cal: Number(row.calories) || 0,
    protein: Number(row.protein_g) || 0,
    carbs: Number(row.carbs_g) || 0,
    fat: Number(row.fat_g) || 0,
    fibre: Number(row.fibre_g) || 0,
    sodium: Number(row.sodium_mg) || 0,
    sugar: Number(row.sugar_g) || 0,
    servingGrams: row.serving_grams || 100,
    source: "custom",
  })), [customFoods.rows]);

  const customFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return customAsFoods;
    return customAsFoods.filter(f => f.name.toLowerCase().includes(q));
  }, [customAsFoods, query]);

  const runLiveSearch = useCallback(async (q) => {
    setLiveLoading(true);
    setLiveError(null);
    let off = [];
    let fatSecretResults = [];
    try {
      off = await searchOpenFoodFacts(q);
    } catch (err) {
      console.error("Open Food Facts search error:", err);
      setLiveError("Packaged product search is temporarily unavailable — try again in a moment.");
    }
    try {
      fatSecretResults = await searchFatSecret(q);
    } catch (err) {
      console.error("FatSecret search error:", err);
    }
    setGenericResults(fatSecretResults);
    setPackagedLive(off);
    setLiveLoading(false);
  }, []);

  // Trigger search with debounce when query changes
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setGenericResults([]); setPackagedLive([]); setLiveLoading(false); setLiveError(null); return; }
    setLiveLoading(true);
    searchTimer.current = setTimeout(() => runLiveSearch(query.trim()), 500);
    return () => clearTimeout(searchTimer.current);
  }, [query, runLiveSearch]);

  const foodsResults = useMemo(() => {
    if (!query.trim()) return [];
    // Custom foods first — they're the user's own data, so the most
    // relevant match for their own search.
    const combined = [...customFiltered, ...genericResults];
    const seen = new Set();
    return combined.filter(f => {
      const key = f.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [customFiltered, genericResults, query]);

  // Packaged/branded results (Open Food Facts, AU-scoped) shown in their
  // own demoted section below — this is what stops a search like "chicken
  // thigh" from being drowned out by random supermarket SKUs before you
  // ever see the actual food.
  const packagedResults = useMemo(() => {
    if (!query.trim()) return [];
    const foodNames = new Set(foodsResults.map(f => f.name.toLowerCase()));
    return packagedLive.filter(f => !foodNames.has(f.name.toLowerCase())).slice(0, 8);
  }, [foodsResults, packagedLive, query]);

  const allResults = useMemo(() => [...foodsResults, ...packagedResults], [foodsResults, packagedResults]);

  const browsing = query === "";

  const recentFoods = useMemo(() => recentRows.map(row => ({
    id: "recent_" + row.id,
    name: row.food_name,
    meta: "Logged before",
    cuisine: "all",
    cal: Number(row.calories) || 0,
    protein: Number(row.protein_g) || 0,
    carbs: Number(row.carbs_g) || 0,
    fat: Number(row.fat_g) || 0,
    fibre: 0,
    sodium: 0,
    sugar: 0,
    servingGrams: 100,
    source: row.source || "log",
  })), [recentRows]);

  // Frequently logged (real log-count data) mapped to the same food-card
  // shape as everything else.
  const frequentFoods = useMemo(() => frequent.rows.map(row => ({
    id: "freq_" + row.id,
    name: row.food_name,
    meta: "Logged often",
    cal: Number(row.calories) || 0,
    protein: Number(row.protein_g) || 0,
    carbs: Number(row.carbs_g) || 0,
    fat: Number(row.fat_g) || 0,
    fibre: 0,
    sodium: 0,
    sugar: 0,
    servingGrams: 100,
    source: row.source || "log",
  })), [frequent.rows]);

  // Favourites the user has starred, snapshotted at favourite time.
  const favouriteFoods = useMemo(() => favourites.rows.map(row => ({
    id: "fav_" + row.id,
    name: row.name,
    meta: (row.brand ? row.brand + " · " : "") + (row.serving_label || "1 serving"),
    cal: Number(row.calories) || 0,
    protein: Number(row.protein_g) || 0,
    carbs: Number(row.carbs_g) || 0,
    fat: Number(row.fat_g) || 0,
    fibre: Number(row.fibre_g) || 0,
    sodium: Number(row.sodium_mg) || 0,
    sugar: Number(row.sugar_g) || 0,
    servingGrams: row.serving_grams || 100,
    source: row.source || "favourite",
  })), [favourites.rows]);

  async function logFood(food, meal) {
    await addFoodLog(food, meal);
    refetchRecent();
    setToast(`${food.name} added to ${meal}`);
    setExpandedId(null);
  }

  function addToBuilder(food) {
    setBuilderItems(prev => [...prev, food]);
    setToast(`${food.name} added to meal builder`);
    setExpandedId(null);
  }

  function handleAdd(food, meal) {
    if (builderMode) return addToBuilder(food);
    return logFood(food, meal);
  }

  async function handleDeleteCustom(food) {
    await customFoods.remove(food.customId);
    setToast(`${food.name} removed`);
    setExpandedId(null);
  }

  function handleToggle(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  function cancelBuilder() {
    setBuilderMode(false);
    setBuilderItems([]);
    setBuilderReviewOpen(false);
  }

  async function handleSaveBuilderMeal(name, items, mealToLog) {
    const snapshot = items.map(it => ({
      name: it.name, cal: it.cal, protein: it.protein, carbs: it.carbs,
      fat: it.fat, fibre: it.fibre || 0, sodium: it.sodium || 0, sugar: it.sugar || 0,
    }));
    await savedMeals.create(name, snapshot);
    if (mealToLog) {
      for (const it of items) {
        await addFoodLog(it, mealToLog);
      }
      refetchRecent();
    }
    setToast(`Saved "${name}"${mealToLog ? ` and logged to ${mealToLog}` : ""}`);
    cancelBuilder();
  }

  async function handleLogSavedMeal(savedMeal) {
    const items = savedMeal.items || [];
    for (const it of items) {
      await addFoodLog(it, activeMeal);
    }
    refetchRecent();
    setToast(`${savedMeal.name} logged to ${activeMeal}`);
    setSavedMealsOpen(false);
  }

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: "#0f0f0f", color: "#e8e8e8", fontFamily: "'DM Sans', sans-serif", display: "flex" }}>

      <AppNav active="food" />

      {/* ── Main content ── */}
      <div className="app-content-pad" style={{ flex: 1, overflow: "auto", minWidth: 0 }}>

        {/* Top bar */}
        <div className="page-pad-top" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 12px", paddingTop: 14, paddingBottom: 14, borderBottom: "1px solid #1e1e1e", background: "#0f0f0f", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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
            <div onClick={() => setCreateFoodOpen(true)} title="Create a custom food" style={{ width: 32, height: 32, background: "#181818", border: "1px solid #1e1e1e", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15, color: "#888" }}><i className="ti ti-plus" /></div>
            <div onClick={() => setSavedMealsOpen(true)} title="Saved meals" style={{ width: 32, height: 32, background: "#181818", border: "1px solid #1e1e1e", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15, color: "#888" }}><i className="ti ti-bookmark" /></div>
          </div>
        </div>

        {/* Page body */}
        <div className="page-pad">

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
            {liveLoading && <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #333", borderTopColor: "#8fbc8f", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />}
            {query && !liveLoading && <button onClick={() => { setQuery(""); setGenericResults([]); setPackagedLive([]); setLiveError(null); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>✕</button>}
            <div onClick={() => setScanOpen(true)} style={{ background: "#0f1a0f", border: "1px solid #3a5a3a", borderRadius: 8, padding: "7px 12px", color: "#8fbc8f", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }} onMouseEnter={e => e.currentTarget.style.borderColor = "#4a7a4a"} onMouseLeave={e => e.currentTarget.style.borderColor = "#3a5a3a"}>
              <i className="ti ti-barcode" style={{ fontSize: 14 }} /> Scan barcode
            </div>
          </div>

          {/* Browsing (no search) — your own data: favourites, frequently
              logged, and recently logged. No curated/hardcoded content —
              a search now finds real food via FatSecret, so a fake
              "Popular foods" list would only get in the way. */}
          {browsing && (
            <>
              {favouriteFoods.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Favourites</div>
                  {favouriteFoods.map(food => (
                    <FoodCard
                      key={food.id}
                      food={food}
                      isExpanded={expandedId === food.id}
                      onToggle={() => handleToggle(food.id)}
                      defaultMeal={activeMeal}
                      onAdd={handleAdd}
                      addLabel={builderMode ? "+ Add to meal" : undefined}
                      isFavourite={true}
                      onToggleFavourite={() => favourites.toggle(food)}
                    />
                  ))}
                </div>
              )}

              {frequentFoods.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Frequently logged</div>
                  {frequentFoods.map(food => (
                    <FoodCard
                      key={food.id}
                      food={food}
                      isExpanded={expandedId === food.id}
                      onToggle={() => handleToggle(food.id)}
                      defaultMeal={activeMeal}
                      onAdd={handleAdd}
                      addLabel={builderMode ? "+ Add to meal" : undefined}
                      isFavourite={favourites.isFavourite(food.name)}
                      onToggleFavourite={() => favourites.toggle(food)}
                    />
                  ))}
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Recently logged</div>
                {recentLoading ? null : recentFoods.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "#444", fontSize: 13, background: "#141414", border: "1px dashed #2a2a2a", borderRadius: 10 }}>
                    Log some food to see it here
                  </div>
                ) : (
                  recentFoods.map(food => (
                    <FoodCard
                      key={food.id}
                      food={food}
                      isExpanded={expandedId === food.id}
                      onToggle={() => handleToggle(food.id)}
                      defaultMeal={activeMeal}
                      onAdd={handleAdd}
                      addLabel={builderMode ? "+ Add to meal" : undefined}
                      isFavourite={favourites.isFavourite(food.name)}
                      onToggleFavourite={() => favourites.toggle(food)}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {/* Search results */}
          {!browsing && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#555" }}>
                  {liveLoading ? "Searching…" : `${allResults.length} result${allResults.length !== 1 ? "s" : ""}`}
                </span>
              </div>

              {/* Foods — custom foods + FatSecret generic results
                  (raw/cooked/every-cut variants across every food category,
                  not brands) */}
              {foodsResults.length === 0 && !liveLoading && packagedResults.length === 0 && !liveError ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#444", fontSize: 14 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                  No foods found for "{query}"
                  <br />
                  <span style={{ fontSize: 12, color: "#333", marginTop: 8, display: "block" }}>Try a different search term, use the scan button, or create it yourself</span>
                  <button onClick={() => setCreateFoodOpen(true)} style={{ marginTop: 16, background: "#0f1a0f", border: "1px solid #3a5a3a", borderRadius: 8, padding: "9px 16px", fontSize: 13, color: "#8fbc8f", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <i className="ti ti-plus" /> Create "{query}" as a custom food
                  </button>
                </div>
              ) : (
                foodsResults.map(food => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    isExpanded={expandedId === food.id}
                    onToggle={() => handleToggle(food.id)}
                    defaultMeal={activeMeal}
                    onAdd={handleAdd}
                    addLabel={builderMode ? "+ Add to meal" : undefined}
                    onDelete={food.source === "custom" ? () => handleDeleteCustom(food) : undefined}
                    isFavourite={favourites.isFavourite(food.name)}
                    onToggleFavourite={() => favourites.toggle(food)}
                  />
                ))
              )}

              {/* Can't find it — always available while searching, not just
                  on a dead-end, matching MyFitnessPal's "Can't find it? Add
                  a food" pattern */}
              {!liveLoading && foodsResults.length > 0 && (
                <div onClick={() => setCreateFoodOpen(true)} style={{ marginTop: 14, textAlign: "center", padding: "10px", color: "#666", fontSize: 12, cursor: "pointer", border: "1px dashed #2a2a2a", borderRadius: 8 }}>
                  <i className="ti ti-plus" style={{ marginRight: 5 }} />Can't find "{query}"? Create a custom food
                </div>
              )}

              {/* Packaged/branded products — Open Food Facts, AU-scoped,
                  kept separate so brand noise never crowds out the actual
                  food */}
              {(liveLoading || packagedResults.length > 0 || liveError) && (
                <div style={{ marginTop: foodsResults.length > 0 ? 20 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase" }}>Packaged products</span>
                    <span style={{ background: "#0a1520", border: "1px solid #2a4a6a", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#6aabcf" }}>🌐 Live search</span>
                  </div>
                  {liveLoading ? (
                    <div style={{ fontSize: 13, color: "#555", padding: "8px 0" }}>Searching…</div>
                  ) : liveError ? (
                    <div style={{ background: "#1a0f0f", border: "1px solid #c0707040", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c07070" }}>{liveError}</div>
                  ) : (
                    packagedResults.map(food => (
                      <FoodCard
                        key={food.id}
                        food={food}
                        isExpanded={expandedId === food.id}
                        onToggle={() => handleToggle(food.id)}
                        defaultMeal={activeMeal}
                        onAdd={handleAdd}
                        addLabel={builderMode ? "+ Add to meal" : undefined}
                        isFavourite={favourites.isFavourite(food.name)}
                        onToggleFavourite={() => favourites.toggle(food)}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {/* Required FatSecret Platform API attribution — must not be
              reworded per their attribution policy. */}
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <a href="https://platform.fatsecret.com" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#444" }}>Powered by fatsecret Platform API</a>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Meal builder floating bar */}
      {builderMode && (
        <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "#141414", border: "1px solid #4a7a4a", borderRadius: 12, padding: "10px 12px 10px 18px", display: "flex", alignItems: "center", gap: 12, zIndex: 90, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          <span style={{ fontSize: 13, color: "#8fbc8f" }}>Building meal · {builderItems.length} item{builderItems.length !== 1 ? "s" : ""}</span>
          <button onClick={() => setBuilderReviewOpen(true)} style={{ background: "#8fbc8f", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#0f0f0f", cursor: "pointer", fontFamily: "inherit" }}>Review & save</button>
          <button onClick={cancelBuilder} style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "#888", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        </div>
      )}

      {/* Scan modal */}
      {scanOpen && (
        <ScanModal
          onClose={() => setScanOpen(false)}
          defaultMeal={activeMeal}
          onAddFood={async (food, meal) => { await addFoodLog(food, meal); refetchRecent(); setToast(`${food.name} added to ${meal}`); }}
        />
      )}

      {/* Create a custom food */}
      {createFoodOpen && (
        <CreateFoodModal
          onClose={() => setCreateFoodOpen(false)}
          initialName={query}
          onCreate={async (food) => {
            await customFoods.create(food);
            setToast(`"${food.name}" saved as a custom food`);
          }}
        />
      )}

      {/* Saved meals */}
      {savedMealsOpen && (
        <SavedMealsModal
          meals={savedMeals.rows}
          loading={savedMeals.loading}
          onClose={() => setSavedMealsOpen(false)}
          onLog={handleLogSavedMeal}
          onDelete={(id) => savedMeals.remove(id)}
          onStartBuilder={() => { setSavedMealsOpen(false); setBuilderMode(true); setBuilderItems([]); }}
        />
      )}

      {/* Meal builder review */}
      {builderReviewOpen && (
        <BuilderReviewModal
          items={builderItems}
          defaultMeal={activeMeal}
          onClose={() => setBuilderReviewOpen(false)}
          onRemove={(i) => setBuilderItems(prev => prev.filter((_, idx) => idx !== i))}
          onSave={handleSaveBuilderMeal}
        />
      )}
    </div>
  );
}
