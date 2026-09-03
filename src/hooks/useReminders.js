import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { savePushSubscription, deletePushSubscriptionByEndpoint } from '../lib/db';
import { pushSupported, requestNotificationPermission, subscribeToPush, unsubscribeFromPush } from '../lib/pushNotifications';

// Ties together the profile's reminder settings (enabled/time/timezone)
// with the actual browser push subscription — enabling reminders means
// asking for notification permission, subscribing this device to push,
// and saving that subscription server-side so the reminders cron can
// reach it; disabling unwinds all of that.
export function useReminders() {
  const { user } = useAuth();
  const { profile, save } = useProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const enable = useCallback(async (time) => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      if (!pushSupported()) throw new Error('Push notifications are not supported in this browser.');
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') throw new Error('Notification permission was not granted.');
      const subscription = await subscribeToPush();
      await savePushSubscription(user.id, subscription.toJSON());
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await save({ reminder_enabled: true, reminder_time: time, reminder_timezone: timezone });
    } catch (err) {
      console.error('Failed to enable reminders:', err);
      setError(err.message || "Couldn't enable reminders — try again.");
      throw err;
    } finally {
      setBusy(false);
    }
  }, [user, save]);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const existing = await unsubscribeFromPush();
      if (existing) await deletePushSubscriptionByEndpoint(existing.endpoint);
      await save({ reminder_enabled: false });
    } catch (err) {
      console.error('Failed to disable reminders:', err);
      setError("Couldn't disable reminders — try again.");
      throw err;
    } finally {
      setBusy(false);
    }
  }, [save]);

  const setTime = useCallback(async (time) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await save({ reminder_time: time, reminder_timezone: timezone });
  }, [save]);

  return {
    enabled: !!profile?.reminder_enabled,
    time: profile?.reminder_time || '19:00',
    busy,
    error,
    enable,
    disable,
    setTime,
  };
}
