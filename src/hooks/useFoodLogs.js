import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { addFoodLog, deleteFoodLog, updateFoodLog, getFoodLogsForDate } from '../lib/db';
import { mealFromDate, groupItemsByHour } from '../lib/mealTime';

function mapRow(row) {
  return {
    id: row.id,
    name: row.food_name,
    meal: row.meal,
    cal: Number(row.calories) || 0,
    protein: Number(row.protein_g) || 0,
    carbs: Number(row.carbs_g) || 0,
    fat: Number(row.fat_g) || 0,
    fibre: Number(row.fibre_g) || 0,
    sodium: Number(row.sodium_mg) || 0,
    sugar: Number(row.sugar_g) || 0,
    saturatedFat: Number(row.saturated_fat_g) || 0,
    transFat: Number(row.trans_fat_g) || 0,
    cholesterol: Number(row.cholesterol_mg) || 0,
    potassium: Number(row.potassium_mg) || 0,
    addedSugar: Number(row.added_sugar_g) || 0,
    vitaminD: Number(row.vitamin_d_mcg) || 0,
    calcium: Number(row.calcium_mg) || 0,
    iron: Number(row.iron_mg) || 0,
    servingGrams: row.serving_grams || null,
    loggedAt: row.logged_at || null,
    createdAt: row.created_at || null,
  };
}

export function useFoodLogs(date) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user || !date) { setLogs([]); setLoading(false); return; }
    setLoading(true);
    const data = await getFoodLogsForDate(user.id, date);
    setLogs(data);
    setLoading(false);
  }, [user, date]);

  useEffect(() => { refetch(); }, [refetch]);

  const items = useMemo(() => logs.map(mapRow), [logs]);

  const meals = useMemo(() => {
    const grouped = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    for (const item of items) {
      const key = item.meal in grouped ? item.meal : 'snacks';
      grouped[key].push(item);
    }
    return grouped;
  }, [items]);

  // Pro users' daily log view — same items, grouped by the hour they were
  // actually logged instead of by meal category.
  const hourlyGroups = useMemo(() => groupItemsByHour(items), [items]);

  // mealName is optional — when omitted (Pro/time-based logging), the meal
  // category is derived from loggedAt purely so the food_logs row (which
  // still requires a meal value) has something sensible; the Pro UI never
  // shows this value to the user.
  const addFood = useCallback(async (food, mealName, loggedAt) => {
    if (!user || !date) return;
    const meal = mealName ? mealName.toLowerCase() : mealFromDate(loggedAt || new Date());
    const created = await addFoodLog(user.id, {
      loggedDate: date,
      meal,
      loggedAt: loggedAt || null,
      name: food.name,
      cal: food.cal,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      fibre: food.fibre || 0,
      sodium: food.sodium || 0,
      sugar: food.sugar || 0,
      saturatedFat: food.saturatedFat || 0,
      transFat: food.transFat || 0,
      cholesterol: food.cholesterol || 0,
      potassium: food.potassium || 0,
      addedSugar: food.addedSugar || 0,
      vitaminD: food.vitaminD || 0,
      calcium: food.calcium || 0,
      iron: food.iron || 0,
      servingGrams: food.servingGrams || null,
      source: food.source,
    });
    setLogs(prev => [...prev, created]);
    return created;
  }, [user, date]);

  const deleteFood = useCallback(async (id) => {
    await deleteFoodLog(id);
    setLogs(prev => prev.filter(l => l.id !== id));
  }, []);

  const updateFood = useCallback(async (id, food) => {
    const updated = await updateFoodLog(id, food);
    setLogs(prev => prev.map(l => (l.id === id ? updated : l)));
    return updated;
  }, []);

  return { logs, meals, hourlyGroups, loading, addFood, deleteFood, updateFood, refetch };
}
