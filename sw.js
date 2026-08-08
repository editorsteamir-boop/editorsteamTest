const CACHE_PREFIX = "editors-team-";
const STATIC_CACHE = `${CACHE_PREFIX}static-v11-sales.1.0`;
const PAGE_CACHE = `${CACHE_PREFIX}pages-v11-sales.1.0`;

const ESSENTIAL_ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./payment-result.html",
  "./assets/css/sales.css?v=1.0.0",
  "./assets/js/sales-public.js?v=1.0.0",
  "./assets/js/sales-admin.js?v=1.0.0",
  "./assets/js/payment-result.js?v=1.0.0",
  "./assets/css/admin.css?v=11.0.0",
  "./assets/js/github-admin.js?v=11.0.0",
  "./assets/css/main.css?v=11.0.0",
  "./assets/js/plan.js?v=6.0.0",
  "./assets/js/app.js?v=11.0.0",
  "./assets/js/projects.js?v=11.0.0",
  "./assets/js/editors.js?v=9.0.0",
  "./assets/js/splash.js?v=11.0.0",
  "./assets/css/portfolio.css?v=2.2.0",
  "./assets/js/portfolio.js?v=11.0.0",
  "./assets/images/logo-transparent.png",
  "./assets/images/icon-192.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.allSettled(ESSENTIAL_ASSETS.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && ![STATIC_CACHE, PAGE_CACHE].includes(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

function normalizedRequest(request) {
  const url = new URL(request.url);
  return new Request(url.origin + url.pathname, { method: "GET" });
}

async function networkFirst(request, cacheName, timeoutMs = 8000, normalize = false) {
  const cache = await caches.open(cacheName);
  const cacheKey = normalize ? normalizedRequest(request) : request;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { cache: "no-cache", signal: controller.signal });
    clearTimeout(timer);
    if (response && response.ok) await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    clearTimeout(timer);
    const cached = await cache.match(cacheKey, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const refresh = fetch(request).then(response => {
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || refresh || new Response("اتصال اینترنت برقرار نیست.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === "navigate";
  const isAdmin = url.pathname.endsWith("/admin.html");
  const isDynamicData = url.pathname.includes("/data/") && url.pathname.endsWith(".json");

  if (isDynamicData) {
    event.respondWith(networkFirst(request, PAGE_CACHE, 8000, true).catch(() => new Response("[]", { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } })));
    return;
  }
  if (url.pathname.endsWith("/assets/js/github-admin.js") || url.pathname.endsWith("/assets/js/portfolio.js") || url.pathname.endsWith("/assets/js/sales-public.js") || url.pathname.endsWith("/assets/js/sales-admin.js") || url.pathname.endsWith("/assets/js/payment-result.js") || url.pathname.endsWith("/assets/css/admin.css") || url.pathname.endsWith("/assets/css/sales.css")) {
    event.respondWith(networkFirst(request, STATIC_CACHE, 8000, false));
    return;
  }
  if (isNavigation || isAdmin) {
    event.respondWith(networkFirst(request, PAGE_CACHE, 8000, true).catch(() => caches.match(normalizedRequest(new Request(self.location.origin + "/index.html")), { ignoreSearch: true })));
    return;
  }
  if (["style", "script", "image", "font"].includes(request.destination)) event.respondWith(staleWhileRevalidate(request));
});
