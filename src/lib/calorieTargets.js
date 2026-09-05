// Shared calorie/macro-target math — used by the formula-based
// "Calculated" mode, the manual "Custom" mode, and the data-driven
// "Adaptive" mode (lib/adaptiveTDEE.js) so all three build a targets
// object the same way once they've settled on a calorie number.

export const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

// Flat fallback used when there's no pace on file (pre-pace profiles, or
// "maintain" which never has one) — matches the app's original behaviour
// before per-user pace existed.
export const goalAdjustments = {
  lose: -400,
  maintain: 0,
  build: +300,
};

export const goalMacroSplits = {
  lose:     { protein: 0.35, carbs: 0.35, fat: 0.30 },
  maintain: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  build:    { protein: 0.30, carbs: 0.45, fat: 0.25 },
};

// 1kg of body fat ≈ 7700 kcal — standard estimate for converting a
// weekly-pace goal into a daily calorie deficit/surplus.
const KCAL_PER_KG = 7700;

export function calcBMR(weight, height, age, unit, sex) {
  let w = Number(weight), h = Number(height);
  if (unit === 'imperial') {
    w = w * 0.453592;   // lbs → kg
    h = h * 2.54;       // inches → cm
  }
  const base = 10 * w + 6.25 * h - 5 * Number(age);
  // Mifflin-St Jeor: male +5, female -161. "unspecified"/missing falls
  // back to the male constant — the app's original, pre-sex-field default.
  return sex === 'female' ? base - 161 : base + 5;
}

// Turns a goal + optional weekly pace (kg/week, always a positive
// magnitude) into a signed daily calorie adjustment. Falls back to the
// flat legacy adjustment when no pace is on file.
export function calcGoalAdjustment(goal, paceKgPerWeek) {
  if (!paceKgPerWeek || goal === 'maintain') return goalAdjustments[goal] || 0;
  const dailyKcal = Math.round((paceKgPerWeek * KCAL_PER_KG) / 7);
  return goal === 'lose' ? -dailyKcal : goal === 'build' ? dailyKcal : 0;
}

export function calcCalories(form) {
  const bmr = calcBMR(form.weight, form.height, form.age, form.unit, form.sex);
  const tdee = bmr * (activityMultipliers[form.activity] || 1.55);
  return Math.round(tdee + calcGoalAdjustment(form.goal, form.paceKgPerWeek));
}

// Build a full targets object from a calorie number + macro % split
export function buildTargets(calories, split, water = 8) {
  const proteinCal = calories * split.protein;
  const carbsCal   = calories * split.carbs;
  const fatCal     = calories * split.fat;
  return {
    calories,
    protein: { g: Math.round(proteinCal / 4), cal: Math.round(proteinCal), pct: split.protein },
    carbs:   { g: Math.round(carbsCal   / 4), cal: Math.round(carbsCal),   pct: split.carbs   },
    fat:     { g: Math.round(fatCal      / 9), cal: Math.round(fatCal),     pct: split.fat     },
    water,
  };
}

// Derive a protein/carbs/fat percentage split from stored gram targets.
export function splitFromGrams(proteinG, carbsG, fatG) {
  const proteinCal = proteinG * 4, carbsCal = carbsG * 4, fatCal = fatG * 9;
  const total = proteinCal + carbsCal + fatCal;
  if (!total) return goalMacroSplits.maintain;
  return { protein: proteinCal / total, carbs: carbsCal / total, fat: fatCal / total };
}
