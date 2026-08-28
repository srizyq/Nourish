import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getCheckinForDate, upsertCheckin } from '../lib/db';

export function useCheckins(date) {
  const { user } = useAuth();
  const [checkin, setCheckin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user || !date) { setCheckin(null); setLoading(false); return; }
    setLoading(true);
    const data = await getCheckinForDate(user.id, date);
    setCheckin(data);
    setLoading(false);
  }, [user, date]);

  useEffect(() => { refetch(); }, [refetch]);

  const save = useCallback(async (fields) => {
    if (!user || !date) return;
    const updated = await upsertCheckin(user.id, date, fields);
    setCheckin(updated);
    return updated;
  }, [user, date]);

  return { checkin, loading, save, refetch };
}
