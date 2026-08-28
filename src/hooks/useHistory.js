import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getCheckinsForRange, getFoodLogsForRange } from '../lib/db';
import { joinDailyData } from '../lib/patterns';

// Fetches food_logs + checkins for the last `days` days and joins them into
// one row per calendar day, for Progress.jsx charts and the pattern engine.
export function useHistory(startDate, endDate) {
  const { user } = useAuth();
  const [foodLogs, setFoodLogs] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setFoodLogs([]); setCheckins([]); setLoading(false); return; }
    setLoading(true);
    const [logs, cks] = await Promise.all([
      getFoodLogsForRange(user.id, startDate, endDate),
      getCheckinsForRange(user.id, startDate, endDate),
    ]);
    setFoodLogs(logs);
    setCheckins(cks);
    setLoading(false);
  }, [user, startDate, endDate]);

  useEffect(() => { refetch(); }, [refetch]);

  const dailyData = joinDailyData(foodLogs, checkins);

  return { dailyData, foodLogs, checkins, loading, refetch };
}
