import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getWeightLogsForRange, getLatestWeightLog, upsertWeightLog } from '../lib/db';

// startDate=null fetches everything since the user started tracking (used
// for the Progress page's "all time" range option).
export function useWeightLogs(startDate, endDate) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setLogs([]); setLatest(null); setLoading(false); return; }
    setLoading(true);
    try {
      const [rangeLogs, latestLog] = await Promise.all([
        getWeightLogsForRange(user.id, startDate, endDate),
        getLatestWeightLog(user.id),
      ]);
      setLogs(rangeLogs);
      setLatest(latestLog);
    } catch (err) {
      console.error('Failed to load weight logs:', err);
      setLogs([]);
      setLatest(null);
    } finally {
      setLoading(false);
    }
  }, [user, startDate, endDate]);

  useEffect(() => { refetch(); }, [refetch]);

  const logWeight = useCallback(async (date, weight, unit) => {
    if (!user) return;
    const created = await upsertWeightLog(user.id, date, weight, unit);
    await refetch();
    return created;
  }, [user, refetch]);

  return { logs, latest, loading, logWeight, refetch };
}
