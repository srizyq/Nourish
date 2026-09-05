import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getWeightLogsForRange, getLatestWeightLog, upsertWeightLog } from '../lib/db';

// startDate=null fetches everything since the user started tracking (used
// for the Progress page's "all time" range option). `userIdOverride` lets
// Coach Mode reuse this for a connected client's data instead of the
// signed-in trainer's own (RLS allows the read either way).
export function useWeightLogs(startDate, endDate, userIdOverride) {
  const { user } = useAuth();
  const userId = userIdOverride || user?.id;
  const [logs, setLogs] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) { setLogs([]); setLatest(null); setLoading(false); return; }
    setLoading(true);
    try {
      const [rangeLogs, latestLog] = await Promise.all([
        getWeightLogsForRange(userId, startDate, endDate),
        getLatestWeightLog(userId),
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
  }, [userId, startDate, endDate]);

  useEffect(() => { refetch(); }, [refetch]);

  const logWeight = useCallback(async (date, weight, unit) => {
    if (!userId) return;
    const created = await upsertWeightLog(userId, date, weight, unit);
    await refetch();
    return created;
  }, [userId, refetch]);

  return { logs, latest, loading, logWeight, refetch };
}
