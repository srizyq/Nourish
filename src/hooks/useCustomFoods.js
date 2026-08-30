import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getCustomFoods, addCustomFood, deleteCustomFood } from '../lib/db';

// Foods the user has created themselves (MyFitnessPal-style "Create a
// Food") — persisted to their own account, so they show up in search and
// quick-add from then on.
export function useCustomFoods() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setRows([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getCustomFoods(user.id);
      setRows(data);
    } catch (err) {
      console.error("Failed to load custom foods:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (food) => {
    if (!user) return;
    const created = await addCustomFood(user.id, food);
    setRows(prev => [created, ...prev]);
    return created;
  }, [user]);

  const remove = useCallback(async (id) => {
    await deleteCustomFood(id);
    setRows(prev => prev.filter(r => r.id !== id));
  }, []);

  return { rows, loading, refetch, create, remove };
}
