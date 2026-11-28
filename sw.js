/* Clay Hero: çevrimdışı katman. SURUM satırını oyun_kaynak/uygulama_bagla.py yazar; elle değiştirme.
   Kural: sayfa ve kod ÖNCE internetten (yeni sürüm hemen gelsin), olmazsa kayıttan; görsel, ses ve film ÖNCE kayıttan.
   Film dosyaları parça parça istenir (Range); kayıttaki tam dosyadan istenen parça kesilip verilir. */
var SURUM = "73f57ee4f5";
var KOD = "ch-kod", MEDYA = "ch-medya";
var MEDYA_UZ = /\.(png|jpg|jpeg|webp|mp3|mp4|webmanifest)$/i;

self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

function parca(istek, yanit) {
  var m = /bytes=(\d+)-(\d*)/.exec(istek.headers.get("range") || "");
  if (!m) return Promise.resolve(yanit);
  return yanit.arrayBuffer().then(function (buf) {
    var bas = +m[1], son = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
    if (bas >= buf.byteLength) return new Response("", { status: 416, headers: { "Content-Range": "bytes */" + buf.byteLength } });
    return new Response(buf.slice(bas, son + 1), { status: 206, statusText: "Partial Content", headers: {
      "Content-Type": yanit.headers.get("Content-Type") || "application/octet-stream", "Accept-Ranges": "bytes",
      "Content-Range": "bytes " + bas + "-" + son + "/" + buf.byteLength, "Content-Length": String(son - bas + 1) } });
  });
}

self.addEventListener("fetch", function (e) {
  var istek = e.request; if (istek.method !== "GET") return;
  var u = new URL(istek.url); if (u.origin !== location.origin) return;
  if (MEDYA_UZ.test(u.pathname)) {
    e.respondWith(caches.open(MEDYA).then(function (c) {
      return c.match(u.pathname, { ignoreSearch: true }).then(function (kayit) {
        if (kayit) return parca(istek, kayit);
        return fetch(istek).then(function (y) { // parçalı (206) yanıt kaydedilmez; tam dosyayı sayfadaki indirici kaydeder
          if (y.status === 200 && !istek.headers.get("range")) c.put(u.pathname, y.clone());
          return y;
        });
      });
    }));
    return;
  }
  e.respondWith(fetch(istek, { cache: "no-cache" }).then(function (y) {
    if (y.status === 200) { var k = y.clone(); caches.open(KOD).then(function (c) { c.put(u.pathname, k); }); }
    return y;
  }).catch(function () {
    return caches.open(KOD).then(function (c) { return c.match(u.pathname, { ignoreSearch: true }); }).then(function (k) {
      return k || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
    });
  }));
});
