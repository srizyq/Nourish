import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getCheckinsForRange, getFoodLogsForRange } from '../lib/db';
import { joinDailyData } from '../lib/patterns';

// Fetches food_logs + checkins for the last `days` days and joins them into
// one row per calendar day, for Progress.jsx charts and the pattern engine.
// `userIdOverride` lets Coach Mode reuse this for a connected client's data
// instead of the signed-in trainer's own (RLS allows the read either way).
export function useHistory(startDate, endDate, userIdOverride) {
  const { user } = useAuth();
  const userId = userIdOverride || user?.id;
  const [foodLogs, setFoodLogs] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) { setFoodLogs([]); setCheckins([]); setLoading(false); return; }
    setLoading(true);
    const [logs, cks] = await Promise.all([
      getFoodLogsForRange(userId, startDate, endDate),
      getCheckinsForRange(userId, startDate, endDate),
    ]);
    setFoodLogs(logs);
    setCheckins(cks);
    setLoading(false);
  }, [userId, startDate, endDate]);

  useEffect(() => { refetch(); }, [refetch]);

  const dailyData = joinDailyData(foodLogs, checkins);

  return { dailyData, foodLogs, checkins, loading, refetch };
}
