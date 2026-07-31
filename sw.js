/* ════════════════════════════════════════════════════════════════════
 * Olivia Work Platform v10.6 — Service Worker
 * 离线缓存策略：Cache First，Network Fallback
 * ════════════════════════════════════════════════════════════════════ */

const CACHE_NAME = "olivia-work-v10.6";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/template-data.js",
  "/manifest.json",
  "/icon.svg"
];

// 安装：缓存核心静态资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求：Cache First 策略
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 跳过非 GET 请求和 chrome-extension 请求
  if (request.method !== "GET" || request.url.startsWith("chrome-extension://")) {
    return;
  }

  // API 请求：Network First（保证数据新鲜）
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response(JSON.stringify({ ok: false, error: "离线模式，请检查网络" }), { headers: { "Content-Type": "application/json" } })))
    );
    return;
  }

  // 静态资源：Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // 后台更新缓存
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => new Response("离线中，请检查网络连接", { status: 503, headers: { "Content-Type": "text/plain" } }));
    })
  );
});
