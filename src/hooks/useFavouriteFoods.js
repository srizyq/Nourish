import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getFavouriteFoods, addFavouriteFood, removeFavouriteFoodByName } from '../lib/db';

// Foods the user has manually starred for quick access — snapshotted at
// favourite time since a favourite can come from any live search source
// (FatSecret, Open Food Facts), not just our own tables.
export function useFavouriteFoods() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setRows([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getFavouriteFoods(user.id);
      setRows(data);
    } catch (err) {
      console.error('Failed to load favourite foods:', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const isFavourite = useCallback(
    (name) => rows.some(r => r.name.toLowerCase() === name.toLowerCase()),
    [rows]
  );

  const add = useCallback(async (food) => {
    if (!user) return;
    const created = await addFavouriteFood(user.id, food);
    setRows(prev => [created, ...prev.filter(r => r.name.toLowerCase() !== food.name.toLowerCase())]);
    return created;
  }, [user]);

  const remove = useCallback(async (name) => {
    if (!user) return;
    await removeFavouriteFoodByName(user.id, name);
    setRows(prev => prev.filter(r => r.name.toLowerCase() !== name.toLowerCase()));
  }, [user]);

  const toggle = useCallback(async (food) => {
    if (isFavourite(food.name)) await remove(food.name);
    else await add(food);
  }, [isFavourite, add, remove]);

  return { rows, loading, isFavourite, toggle, refetch };
}
