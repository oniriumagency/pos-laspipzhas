// ============================================================
// Pipzhas POS — Service Worker v1.0
// Estrategia: Network-First con fallback a Cache
// Esto garantiza datos frescos con resiliencia offline.
// ============================================================

const CACHE_NAME = 'pipzhas-pos-v1';

// Recursos del App Shell que cachearemos en la instalación
const APP_SHELL_ASSETS = [
  '/',
  '/pos',
  '/offline.html',
  '/manifest.json',
];

// ---- INSTALL: Pre-cache del App Shell ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos addAll con manejo de errores para no bloquear la instalación
      return Promise.allSettled(
        APP_SHELL_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] No se pudo cachear: ${url}`, err);
          })
        )
      );
    }).then(() => {
      // Forzamos activación inmediata sin esperar a que se cierre la página
      return self.skipWaiting();
    })
  );
});

// ---- ACTIVATE: Limpiar cachés viejas ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log(`[SW] Eliminando caché obsoleta: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Toma control de todas las pestañas abiertas inmediatamente
      return self.clients.claim();
    })
  );
});

// ---- FETCH: Estrategia Network-First ----
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo interceptar requests GET
  if (request.method !== 'GET') return;

  // No interceptar requests de la API de Supabase para garantizar datos reales
  if (request.url.includes('supabase.co')) return;

  // No interceptar hot-reloads de Next.js en desarrollo
  if (request.url.includes('_next/webpack-hmr')) return;
  if (request.url.includes('__nextjs')) return;

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Si la red responde bien, actualizamos la caché y devolvemos
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Red inaccesible: intentamos la caché
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no hay caché y es una navegación de página, mostramos offline
          if (request.destination === 'document') {
            return caches.match('/offline.html');
          }
          // Para otros recursos, fallamos silenciosamente
          return new Response('', { status: 408, statusText: 'Request Timeout' });
        });
      })
  );
});
