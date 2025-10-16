const CACHE_NAME = 'wassel-v1.0.0';
const STATIC_CACHE = 'wassel-static-v1.0.0';
const DYNAMIC_CACHE = 'wassel-dynamic-v1.0.0';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API routes to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
  /^https:\/\/.*\.supabase\.co\/auth\/v1\//
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE;
            })
            .map((cacheName) => {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Check if request is for static assets
function isStaticAsset(request) {
  return request.destination === 'script' ||
         request.destination === 'style' ||
         request.destination === 'image' ||
         request.destination === 'font' ||
         request.url.includes('/static/') ||
         request.url.includes('/assets/');
}

// Check if request is for API
function isAPIRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Handle static assets - cache first strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to handle static asset', error);
    return new Response('Offline', { status: 503 });
  }
}

// Handle API requests - network first with cache fallback
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for API request');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle navigation requests - network first with cache fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, serving cached index.html');
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Handle other requests - cache first
async function handleOtherRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to handle request', error);
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline actions when connection is restored
  console.log('Service Worker: Performing background sync');
  // Implementation would depend on your specific offline needs
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Wassel',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Wassel', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});