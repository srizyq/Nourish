import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

precacheAndRoute(self.__WB_MANIFEST);

// vite-plugin-pwa's `registerType: 'autoUpdate'` only actually auto-updates
// if the service worker cooperates with two things: (1) it must listen for
// the SKIP_WAITING message the app's registration script sends when it
// detects a new version, and call self.skipWaiting() — without this, a new
// worker installs but sits "waiting" indefinitely, since the spec default
// only activates a waiting worker once every open tab/window for this
// origin has been fully closed (unreliable to guarantee on a phone, even
// after force-quitting the app — this was the actual cause of "I updated
// but it didn't take effect" reports); (2) clientsClaim() so the newly
// activated worker takes control of already-open pages immediately instead
// of waiting for their next full navigation.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
clientsClaim();

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
  new StaleWhileRevalidate({ cacheName: 'tabler-icons' })
);

// ─── Push notifications (reminders) ────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Attune', body: "Don't forget to log today's food." };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch { /* use defaults */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/dashboard' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
