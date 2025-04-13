// This is the "Offline page" service worker with Firebase Cloud Messaging support

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging.js');

const CACHE = "pwabuilder-page";
const offlineFallbackPage = "ToDo-replace-this-name.html";

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyAcnCKmcXcgUBHOGGEj8dizh2ybY7iQ7JI",
  authDomain: "script-sprouts.firebaseapp.com",
  projectId: "script-sprouts",
  storageBucket: "script-sprouts.appspot.com",
  messagingSenderId: "223432338173",
  appId: "1:223432338173:web:549ca36657ea0b38b12c94",
  measurementId: "G-ZMCS394K9H"
});

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon-96x96.png',
    badge: '/favicon-96x96.png',
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // This looks to see if the current notification is already open and focuses it
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});

// Standard PWA Builder service worker code below
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(offlineFallbackPage))
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;

        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});
