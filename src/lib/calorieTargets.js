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

export function calcBMR(weight, height, age, unit) {
  let w = Number(weight), h = Number(height);
  if (unit === 'imperial') {
    w = w * 0.453592;   // lbs → kg
    h = h * 2.54;       // inches → cm
  }
  return 10 * w + 6.25 * h - 5 * Number(age) + 5;
}

export function calcCalories(form) {
  const bmr = calcBMR(form.weight, form.height, form.age, form.unit);
  const tdee = bmr * (activityMultipliers[form.activity] || 1.55);
  return Math.round(tdee + (goalAdjustments[form.goal] || 0));
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
