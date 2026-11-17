/* ==========================================================
   عامل الخدمة — مركز الأعشاب
   تخزين مؤقت للعمل بدون إنترنت + تحديث محكّم
   ========================================================== */

const VERSION = "v1.2.0";
const CORE_CACHE = "ah-core-" + VERSION;
const RUNTIME_CACHE = "ah-runtime-" + VERSION;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/data-core.js",
  "./js/data-herbs.js",
  "./js/data-mixtures.js",
  "./js/data-diseases.js",
  "./js/data-tools.js",
  "./js/data-videos.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

/* التثبيت: تخزين الملفات الأساسية */
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CORE_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* التفعيل: تنظيف الإصدارات القديمة */
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CORE_CACHE && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* الجلب: ذاكرة أولاً للأصول المحلية، شبكة أولاً للخطوط */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  /* الخطوط من جوجل: شبكة أولاً مع تخزين دائم */
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  /* الملفات المحلية: ذاكرة أولاً ثم شبكة */
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(cached =>
        cached ||
        fetch(req).then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
          }
          return res;
        }).catch(() =>
          caches.match("./index.html").then(page => page || Response.error())
        )
      )
    );
  }
});

/* استقبال أمر التحديث الفوري */
self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
