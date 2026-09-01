import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { addFoodLog, deleteFoodLog, getFoodLogsForDate } from '../lib/db';

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

  const meals = useMemo(() => {
    const grouped = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    for (const row of logs) {
      const key = row.meal in grouped ? row.meal : 'snacks';
      grouped[key].push({
        id: row.id,
        name: row.food_name,
        cal: Number(row.calories) || 0,
        protein: Number(row.protein_g) || 0,
        carbs: Number(row.carbs_g) || 0,
        fat: Number(row.fat_g) || 0,
        fibre: Number(row.fibre_g) || 0,
        sodium: Number(row.sodium_mg) || 0,
        sugar: Number(row.sugar_g) || 0,
      });
    }
    return grouped;
  }, [logs]);

  const addFood = useCallback(async (food, mealName) => {
    if (!user || !date) return;
    const created = await addFoodLog(user.id, {
      loggedDate: date,
      meal: mealName.toLowerCase(),
      name: food.name,
      cal: food.cal,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      fibre: food.fibre || 0,
      sodium: food.sodium || 0,
      sugar: food.sugar || 0,
      source: food.source,
    });
    setLogs(prev => [...prev, created]);
    return created;
  }, [user, date]);

  const deleteFood = useCallback(async (id) => {
    await deleteFoodLog(id);
    setLogs(prev => prev.filter(l => l.id !== id));
  }, []);

  return { logs, meals, loading, addFood, deleteFood, refetch };
}
