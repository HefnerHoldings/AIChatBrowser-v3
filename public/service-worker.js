// MadEasy Browser Service Worker v1.0
// Advanced offline functionality with intelligent caching

const CACHE_NAME = 'madeasy-browser-v1';
const DYNAMIC_CACHE = 'madeasy-dynamic-v1';
const STATIC_CACHE = 'madeasy-static-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS.filter(asset => {
        // Only cache existing assets
        return fetch(asset, { method: 'HEAD' })
          .then(() => true)
          .catch(() => false);
      }));
    }).catch(err => {
      console.error('[ServiceWorker] Install failed:', err);
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('madeasy-') && 
                   cacheName !== CACHE_NAME &&
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName !== STATIC_CACHE;
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Take control of all clients
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) return;
  
  // Determine caching strategy based on request type
  const strategy = getStrategy(request);
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(request));
      break;
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(request));
      break;
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(request));
      break;
      
    case CACHE_STRATEGIES.CACHE_ONLY:
      event.respondWith(cacheOnly(request));
      break;
      
    case CACHE_STRATEGIES.NETWORK_ONLY:
    default:
      event.respondWith(networkOnly(request));
  }
});

// Message event - handle commands from the app
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'CACHE_URLS':
      cacheUrls(event.data.urls).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ size });
      });
      break;
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  let data = {
    title: 'MadEasy Browser',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'madeasy-notification',
    renotify: false,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {}
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, data)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[ServiceWorker] Periodic sync:', event.tag);
  
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

// Helper functions for caching strategies

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Update cache in background
    fetchAndCache(request, DYNAMIC_CACHE);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return offlineFallback(request);
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || offlineFallback(request);
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

async function cacheOnly(request) {
  const cached = await caches.match(request);
  return cached || offlineFallback(request);
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return offlineFallback(request);
  }
}

// Utility functions

function getStrategy(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // API calls - network first
  if (path.startsWith('/api/')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  // Static assets - cache first
  if (path.match(/\.(js|css|woff2?|ttf|otf|eot)$/)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // Images - stale while revalidate
  if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  
  // HTML pages - network first
  if (request.mode === 'navigate') {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  // Default - network first
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response);
    }
  } catch (error) {
    // Silent fail - this is background update
  }
}

async function offlineFallback(request) {
  if (request.mode === 'navigate') {
    const cached = await caches.match('/offline.html');
    if (cached) return cached;
  }
  
  // Return a basic offline response
  return new Response('Offline - Content not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain'
    })
  });
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  return cache.addAll(urls);
}

async function getCacheSize() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return 0;
  }
  
  const estimate = await navigator.storage.estimate();
  return estimate.usage || 0;
}

async function syncData() {
  // Implement data synchronization logic
  console.log('[ServiceWorker] Syncing data...');
  
  // Example: sync offline form submissions
  const db = await openDB();
  const pendingData = await db.getAllPending();
  
  for (const data of pendingData) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await db.markSynced(data.id);
    } catch (error) {
      console.error('[ServiceWorker] Sync failed:', error);
    }
  }
}

async function updateContent() {
  // Implement periodic content update
  console.log('[ServiceWorker] Updating content...');
  
  // Pre-cache important pages
  const importantUrls = [
    '/',
    '/dashboard',
    '/settings'
  ];
  
  const cache = await caches.open(DYNAMIC_CACHE);
  for (const url of importantUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        cache.put(url, response);
      }
    } catch (error) {
      console.error('[ServiceWorker] Update failed for:', url);
    }
  }
}

// Simple IndexedDB wrapper for offline data
async function openDB() {
  return {
    getAllPending: async () => [],
    markSynced: async (id) => {}
  };
}