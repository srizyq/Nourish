// Shared realistic mock data so every variant is judged on the same
// underlying content — only the design language differs between them.
export const mock = {
  name: 'Sriram',
  date: 'Friday 4 September',
  streak: 12,
  calorieTarget: 2200,
  calorieConsumed: 1840,
  protein: { value: 142, target: 165 },
  carbs: { value: 198, target: 230 },
  fat: { value: 54, target: 70 },
  water: { glasses: 5, target: 8 },
  mood: 'good',
  energy: 7,
  insight: "You average 7.8/10 energy on days you log 30g+ protein before noon, vs 5.2/10 otherwise — a 2.6-point lift across 18 logged days.",
  weekCalories: [1950, 2100, 1800, 2200, 1750, 2050, 1840],
  weekLabels: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  weightTrend: [82.4, 82.1, 81.9, 81.7, 81.4, 81.2, 80.9],
  expenditure: { avg: 2340, diff: -42 },
  favourites: [
    { name: 'Banana', emoji: '🍌', cal: 105 },
    { name: 'Greek yoghurt', emoji: '🥣', cal: 130 },
    { name: 'Chicken breast', emoji: '🍗', cal: 165 },
    { name: 'Avocado', emoji: '🥑', cal: 240 },
    { name: 'Salmon', emoji: '🐟', cal: 208 },
  ],
  meals: [
    { meal: 'Breakfast', items: [{ name: 'Greek yoghurt + berries', cal: 320 }, { name: 'Long black', cal: 5 }], total: 325 },
    { meal: 'Lunch', items: [{ name: 'Chicken & rice bowl', cal: 610 }, { name: 'Apple', cal: 95 }], total: 705 },
    { meal: 'Dinner', items: [{ name: 'Salmon, greens, sweet potato', cal: 680 }], total: 680 },
    { meal: 'Snacks', items: [{ name: 'Protein shake', cal: 130 }], total: 130 },
  ],
};
