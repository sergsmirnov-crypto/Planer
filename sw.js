// Кэш оболочки приложения. Без него страница на хостинге просто не откроется
// без сети, и никакой localStorage не поможет: грузить будет нечего.
//
// Данные сюда не попадают — они живут в localStorage, а обмен с Таблицей
// идёт мимо кэша, всегда по сети.

const CACHE = "planner-shell-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const request = e.request;

  // всё чужое, и в первую очередь Apps Script, кэш не трогает
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  // сеть вперёд, кэш как запасной аэродром: так обновления доезжают сами
  e.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match("./index.html")))
  );
});
