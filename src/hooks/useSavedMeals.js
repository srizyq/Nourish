import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getSavedMeals, addSavedMeal, deleteSavedMeal } from '../lib/db';

// Named bundles of foods the user has saved to log in one tap (MyFitnessPal-
// style "Meals"/recipes) — e.g. "My usual breakfast" = oats + banana + honey.
export function useSavedMeals() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setRows([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getSavedMeals(user.id);
      setRows(data);
    } catch (err) {
      console.error("Failed to load saved meals:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (name, items) => {
    if (!user) return;
    const created = await addSavedMeal(user.id, name, items);
    setRows(prev => [created, ...prev]);
    return created;
  }, [user]);

  const remove = useCallback(async (id) => {
    await deleteSavedMeal(id);
    setRows(prev => prev.filter(r => r.id !== id));
  }, []);

  return { rows, loading, refetch, create, remove };
}
