// Shared helpers for the meal/time logging split: free-tier users pick a
// meal category (breakfast/lunch/dinner/snacks); Pro users log against an
// actual clock time instead, with the log grouped hourly rather than by
// meal category.

const MEAL_WINDOWS = [
  { meal: 'breakfast', before: 11 },
  { meal: 'lunch', before: 15 },
  { meal: 'dinner', before: 21 },
];

// A sensible meal-category default based on the current time of day,
// rather than always defaulting to Lunch regardless of when you're
// actually logging.
export function mealFromDate(d) {
  const h = d.getHours();
  for (const w of MEAL_WINDOWS) if (h < w.before) return w.meal;
  return 'snacks';
}

export function currentTimeHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Combine today's date with a "HH:MM" string into a real Date.
export function timeStringToDate(hhmm, base = new Date()) {
  const [h, m] = (hhmm || '').split(':').map(Number);
  const d = new Date(base);
  if (!Number.isNaN(h) && !Number.isNaN(m)) d.setHours(h, m, 0, 0);
  return d;
}

export function formatHourLabel(hour) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${hour < 12 ? 'am' : 'pm'}`;
}

export function formatTime12h(hhmm) {
  const [h, m] = (hhmm || '').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

export function formatTimeFromDate(d) {
  return formatTime12h(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
}

// Groups already-mapped log items (each carrying loggedAt/createdAt) into
// hourly buckets, sorted chronologically, skipping hours with nothing in
// them — used for the Pro "hourly" daily log view in place of the
// breakfast/lunch/dinner/snacks grouping.
export function groupItemsByHour(items) {
  const buckets = new Map();
  for (const item of items) {
    const ts = item.loggedAt || item.createdAt;
    if (!ts) continue;
    const hour = new Date(ts).getHours();
    if (!buckets.has(hour)) buckets.set(hour, []);
    buckets.get(hour).push(item);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, hourItems]) => ({ hour, label: formatHourLabel(hour), items: hourItems }));
}
