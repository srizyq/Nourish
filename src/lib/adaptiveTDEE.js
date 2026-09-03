// Adaptive calorie targeting — instead of a fixed formula-based estimate
// (BMR × activity multiplier, computed once), this re-estimates the
// user's *actual* maintenance calories from their own logged weight
// trend vs. logged intake, the way MacroFactor's adaptive TDEE works.
// Deterministic, no network calls — same "honest, gated" ethos as
// lib/patterns.js: it refuses to guess until there's enough real data.

import { todayLocalDate } from './patterns';

// Same deficit/surplus convention already used by the formula-based
// "Calculated" mode in Settings.jsx, so switching between modes doesn't
// change what a given goal means.
const GOAL_ADJUSTMENTS = { lose: -400, maintain: 0, build: 300 };

// Body-composition energy density: ~7700 kcal stored/released per kg of
// body-mass change (a standard approximation covering mixed fat/lean
// tissue and water, used broadly in sports-science TDEE-estimation —
// not a proprietary constant).
const KCAL_PER_KG = 7700;

// How many days of "memory" the weight trend carries — roughly a week's
// worth of noise (water, sodium, digestion) gets smoothed out, while
// still tracking a real trend within 2-3 weeks.
const TREND_TAU_DAYS = 7;

// Need at least this many days of trend-weight span, and at least this
// many separate days with calories actually logged within that span,
// before trusting an estimate — otherwise a couple of noisy data points
// could swing the target wildly.
const MIN_TREND_SPAN_DAYS = 14;
const MIN_LOGGED_CALORIE_DAYS = 10;

function toKg(weight, unit) {
  return unit === 'lb' ? Number(weight) * 0.453592 : Number(weight);
}

function daysBetween(dateA, dateB) {
  return Math.round((new Date(dateB + 'T00:00:00') - new Date(dateA + 'T00:00:00')) / 86400000);
}

// Gap-aware exponential smoothing: a weight logged after a long gap
// pulls the trend toward it faster than one logged the day after the
// last entry, since a stale trend shouldn't cling to old data through a
// multi-week silence.
export function computeTrendWeight(weightLogs) {
  const sorted = [...weightLogs]
    .filter(w => w.weight != null && w.logged_date)
    .sort((a, b) => a.logged_date.localeCompare(b.logged_date));
  if (sorted.length === 0) return [];

  const points = [];
  let trend = toKg(sorted[0].weight, sorted[0].unit);
  points.push({ date: sorted[0].logged_date, trend, raw: trend });

  for (let i = 1; i < sorted.length; i++) {
    const raw = toKg(sorted[i].weight, sorted[i].unit);
    const gapDays = Math.max(0, daysBetween(sorted[i - 1].logged_date, sorted[i].logged_date));
    const decay = Math.exp(-gapDays / TREND_TAU_DAYS);
    trend = raw + (trend - raw) * decay;
    points.push({ date: sorted[i].logged_date, trend, raw });
  }
  return points;
}

// dailyCalories: array of { date, calories } (one row per day, 0 for
// days with nothing logged — the caller decides which days "count" by
// only including days that actually have calories > 0, since a day with
// calories:0 usually means "didn't log", not "ate nothing").
export function estimateTDEE(trendPoints, dailyCalories) {
  if (trendPoints.length < 2) return null;

  const endPoint = trendPoints[trendPoints.length - 1];
  const spanDays = daysBetween(trendPoints[0].date, endPoint.date);
  if (spanDays < MIN_TREND_SPAN_DAYS) return null;

  const loggedDays = dailyCalories.filter(d => d.calories > 0 && d.date >= trendPoints[0].date && d.date <= endPoint.date);
  if (loggedDays.length < MIN_LOGGED_CALORIE_DAYS) return null;

  const avgCalIn = loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length;
  const weightChangeKg = endPoint.trend - trendPoints[0].trend;
  const dailyEnergyStored = (weightChangeKg * KCAL_PER_KG) / spanDays;
  const tdee = avgCalIn - dailyEnergyStored;

  return {
    tdee: Math.round(tdee),
    avgCalIn: Math.round(avgCalIn),
    weightChangeKg: Math.round(weightChangeKg * 10) / 10,
    spanDays,
    loggedDayCount: loggedDays.length,
    startTrend: Math.round(trendPoints[0].trend * 10) / 10,
    endTrend: Math.round(endPoint.trend * 10) / 10,
  };
}

// Top-level entry point: given raw weight_logs + a date->calories map,
// returns either a full result (estimate + resulting target) or a
// `blocked` result explaining what's still needed, so the UI always has
// something honest to show instead of a silent gap.
export function computeAdaptiveTarget(weightLogs, dailyCalories, goal) {
  const trendPoints = computeTrendWeight(weightLogs);
  if (trendPoints.length === 0) {
    return { ready: false, reason: 'no-weight-logs' };
  }
  const spanDays = daysBetween(trendPoints[0].date, trendPoints[trendPoints.length - 1].date);
  if (spanDays < MIN_TREND_SPAN_DAYS) {
    return { ready: false, reason: 'not-enough-span', daysNeeded: MIN_TREND_SPAN_DAYS - spanDays };
  }

  const estimate = estimateTDEE(trendPoints, dailyCalories);
  if (!estimate) {
    const loggedDays = dailyCalories.filter(d => d.calories > 0 && d.date >= trendPoints[0].date).length;
    return { ready: false, reason: 'not-enough-logged-days', daysNeeded: MIN_LOGGED_CALORIE_DAYS - loggedDays };
  }

  const target = Math.round(estimate.tdee + (GOAL_ADJUSTMENTS[goal] ?? 0));
  return { ready: true, estimate, target, computedAt: todayLocalDate() };
}
