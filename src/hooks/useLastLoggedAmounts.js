import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getRecentFoodLogs } from '../lib/db';

// Maps a food's name (lowercased) to the amount+unit it was most recently
// logged with, so quick-add can default to that instead of always
// guessing 1 serving. Recent/Frequent already surface a real food_logs
// row per food (with logged_amount/logged_unit on it directly), but
// Favourites don't — they're a separately-starred snapshot, so this is
// the lookup that lets a favourite also remember its last-used amount.
// Fetches more history than Recent/Frequent need so a favourite you
// haven't logged lately still resolves correctly.
export function useLastLoggedAmounts() {
  const { user } = useAuth();
  const [map, setMap] = useState(new Map());

  const refetch = useCallback(async () => {
    if (!user) { setMap(new Map()); return; }
    const logs = await getRecentFoodLogs(user.id, 200);
    const next = new Map();
    for (const row of logs) {
      const key = row.food_name.trim().toLowerCase();
      if (next.has(key)) continue; // first occurrence wins — query is most-recent-first
      if (row.logged_amount == null || !row.logged_unit) continue;
      next.set(key, { amount: Number(row.logged_amount), unit: row.logged_unit });
    }
    setMap(next);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  return { map, refetch };
}
