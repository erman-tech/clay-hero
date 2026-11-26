/* Clay Hero: uygulama katmanı (kök sayfalar: index.html, menu.html).
   1) Çevrimdışı katmanı (sw.js) kaydeder. 2) Seçilen kahramanın oyun dosyalarını ve filmlerini arka planda cihaza kaydeder
   (öteki 11 görünüş inmez). 3) "Install" düğmesi: Android'de kurulum penceresi, iPad/iPhone'da Ana Ekrana Ekle tarifi. */
(function () {
  "use strict";
  var destek = "serviceWorker" in navigator && "caches" in window;
  var tek = window.matchMedia && (matchMedia("(display-mode: fullscreen)").matches || matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if (destek) navigator.serviceWorker.register("sw.js").catch(function () {});

  var kutu = document.getElementById("uygulama"); if (!kutu) return;
  kutu.innerHTML = '<span id="uygDurum"></span><button id="uygKur" type="button" hidden>📲 Install app</button>' +
    '<div id="uygTarif" hidden><b>Add Clay Hero to your Home Screen</b><p>1. Tap the Share button <span aria-hidden="true">⎋</span> in Safari.<br>2. Choose “Add to Home Screen”.<br>3. Open Clay Hero from the new icon.</p><button type="button" id="uygTamam">OK</button></div>';
  var durum = document.getElementById("uygDurum"), kur = document.getElementById("uygKur"), tarif = document.getElementById("uygTarif");

  // ---- kurulum ----
  var bekleyen = null, ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); bekleyen = e; if (!tek) kur.hidden = false; });
  addEventListener("appinstalled", function () { kur.hidden = true; });
  if (ios && !tek) kur.hidden = false;
  kur.addEventListener("click", function () { if (bekleyen) { bekleyen.prompt(); bekleyen = null; kur.hidden = true; } else tarif.hidden = false; });
  document.getElementById("uygTamam").addEventListener("click", function () { tarif.hidden = true; });

  // ---- çevrimdışı kayıt ----
  if (!destek) { durum.textContent = ""; return; }
  var K = null; try { K = JSON.parse(localStorage.getItem("clayHero") || "null"); } catch (e) {}
  if (!K || !K.sac) return;
  var gorunus = K.sac + "_" + K.renk + "_" + K.ten;
  function gerekli(yol) { // öteki görünüşlerin figürleri, portreleri ve filmleri inmez
    var m = /^(?:oyun\/kahraman|filmler)\/([^/]+)\//.exec(yol); if (m) return m[1] === gorunus || m[1] === "ortak";
    m = /^portre\/(.+)\.jpg$/.exec(yol); if (m) return m[1] === gorunus;
    return true;
  }
  function yaz(t) { durum.textContent = t; }
  function basla() {
    fetch("ortak/dosyalar.json", { cache: "no-cache" }).then(function (y) { return y.json(); }).then(function (d) {
      var imza = d.surum + ":" + gorunus, eski = null; try { eski = localStorage.getItem("ch_cevrimdisi"); } catch (e) {}
      var liste = d.dosyalar.filter(function (x) { return gerekli(x[0]); });
      var toplam = liste.reduce(function (a, x) { return a + x[1]; }, 0), inen = 0, hata = 0, sira = 0;
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
      return Promise.all([caches.open("ch-medya"), caches.open("ch-kod")]).then(function (c) {
        function hangi(yol) { return /\.(png|jpg|jpeg|webp|mp3|mp4|webmanifest)$/i.test(yol) ? c[0] : c[1]; }
        var kok = new URL(".", location.href).pathname;
        function bir() {
          if (sira >= liste.length) return Promise.resolve();
          var x = liste[sira++], ad = kok + x[0], depo = hangi(x[0]);
          return depo.match(ad).then(function (var_) {
            if (var_ && eski === imza) return;                      // bu sürümde zaten kayıtlı
            if (var_ && depo === c[0]) return;                      // görsel, ses, film değişmez; yeniden indirilmez
            return fetch(x[0], { cache: "no-cache" }).then(function (y) { if (y.status !== 200) throw 0; return depo.put(ad, y); });
          }).catch(function () { hata++; }).then(function () {
            inen += x[1]; yaz("⬇ Saving for offline play… " + Math.min(99, Math.round(inen / toplam * 100)) + "%"); return bir();
          });
        }
        yaz("⬇ Saving for offline play… 0%");
        return Promise.all([bir(), bir(), bir(), bir()]).then(function () {
          if (hata) { yaz("⚠ Offline copy incomplete (" + hata + " files). It will retry next time."); return; }
          try { localStorage.setItem("ch_cevrimdisi", imza); } catch (e) {}
          yaz("✓ Ready to play offline · " + Math.round(toplam / 1048576) + " MB saved");
        });
      });
    }).catch(function () { yaz(""); });
  }
  setTimeout(basla, 1200); // menü önce çizilsin
  window.__uygulama = { gorunus: gorunus, gerekli: gerekli };
})();
