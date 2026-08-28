import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getRecentFoodLogs } from '../lib/db';

// The user's most recently logged foods, deduplicated by name (most recent
// occurrence wins), for quick re-adding on the food search page.
export function useRecentFoods(limit = 6) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const logs = await getRecentFoodLogs(user.id, 40);
    const seen = new Set();
    const unique = [];
    for (const row of logs) {
      const key = row.food_name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(row);
      if (unique.length >= limit) break;
    }
    setRows(unique);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => { refetch(); }, [refetch]);

  return { rows, loading, refetch };
}
