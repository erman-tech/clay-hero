/* Clay Hero: karakter yapma ekranı (erkek çocuk). Tek dosya, kütüphane yok.
   20 Kas 2026: "çocuklar normal olmalı, the hero gibi gerçekçi; o kadar opsiyona gerek yok".
   Parçalardan yüz kurmak yerine filmdeki hamur çocuğun hazır portreleri gösterilir: portre/<saç>_<renk>_<ten>.jpg.
   Seçenekler filmi olan 12 görünüşle birebir aynı (film/v_<saç>_<renk>_<ten>); filmi olmayan birleşim seçilemez.
   Seçim yalnız bu cihazda saklanır (localStorage "clayHero"); hiçbir yere gönderilmez. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var TEN = [["acik", "Light", "#f3c7a2"], ["bugday", "Tan", "#b9825a"], ["koyu", "Deep", "#6b422b"]];
  var RENK = [["siyah", "Black", "#2f2b2d"], ["kahve", "Brown", "#7a4d2d"], ["sari", "Blond", "#e9b949"]];
  var SAC = [["duz", "Neat"], ["dikenli", "Spiky"]];
  // filmi olan birleşimler: ten -> saç renkleri (her biri iki saç modeliyle)
  var VAR = { acik: ["siyah", "kahve", "sari"], bugday: ["siyah", "kahve"], koyu: ["siyah"] };
  var K = { sac: "dikenli", renk: "kahve", ten: "acik", isim: "" };

  try { var e = JSON.parse(localStorage.getItem("clayHero") || "null"); if (e) ["sac", "renk", "ten", "isim"].forEach(function (a) { if (typeof e[a] === "string") K[a] = e[a]; }); } catch (h) { /* saklama kapalı olabilir */ }
  function gecerli(k) { return !!VAR[k.ten] && VAR[k.ten].indexOf(k.renk) >= 0 && (k.sac === "duz" || k.sac === "dikenli"); }
  if (!gecerli(K)) { K.sac = "dikenli"; K.renk = "kahve"; K.ten = "acik"; }
  // kahraman zaten yapılmışsa doğrudan ana menü açılır; "Change hero" ?edit=1 ile gelir
  if (K.isim && !/[?&]edit=1/.test(location.search)) { location.replace("menu.html"); return; }

  function ad(k) { return k.sac + "_" + k.renk + "_" + k.ten; }
  function sakla() { try { localStorage.setItem("clayHero", JSON.stringify(K)); } catch (h) { /* yoksay */ } }
  function ciz() { $("figur").src = "portre/" + ad(K) + ".jpg"; $("figur").alt = "Your clay hero"; }

  function dugme(kap, secili, kilitli, etiket, ic, tikla) {
    var d = document.createElement("button"); d.type = "button"; d.className = "sec" + (secili ? " secili" : "");
    d.setAttribute("aria-label", etiket); d.setAttribute("aria-pressed", secili ? "true" : "false");
    if (kilitli) { d.disabled = true; d.setAttribute("aria-label", etiket + " (coming soon)"); var y = document.createElement("span"); y.className = "yakinda"; y.textContent = "SOON"; d.appendChild(y); }   // filmi olmayan birleşim: seçilemez, "SOON" yazar
    d.appendChild(ic); d.addEventListener("click", tikla); kap.appendChild(d);
  }
  function top(renk) { var t = document.createElement("div"); t.className = "renk"; t.style.background = renk; return t; }
  function kucuk(k) { var i = document.createElement("img"); i.src = "portre/" + ad(k) + ".jpg"; i.alt = ""; return i; }

  function secenekler() {
    var kt = $("ten"), kr = $("renk"), ks = $("sac"); kt.innerHTML = kr.innerHTML = ks.innerHTML = "";
    TEN.forEach(function (t) {
      dugme(kt, K.ten === t[0], false, t[1], top(t[2]), function () {
        K.ten = t[0]; if (VAR[K.ten].indexOf(K.renk) < 0) K.renk = VAR[K.ten][0]; degisti();
      });
    });
    RENK.forEach(function (r) {
      dugme(kr, K.renk === r[0], VAR[K.ten].indexOf(r[0]) < 0, r[1], top(r[2]), function () { K.renk = r[0]; degisti(); });
    });
    SAC.forEach(function (s) {
      dugme(ks, K.sac === s[0], false, s[1], kucuk({ sac: s[0], renk: K.renk, ten: K.ten }), function () { K.sac = s[0]; degisti(); });
    });
  }
  function degisti() { sakla(); ciz(); secenekler(); $("durum").textContent = ""; }

  $("isim").value = K.isim || "";
  $("isim").addEventListener("input", function () { K.isim = this.value.slice(0, 14); sakla(); });
  $("karistir").addEventListener("click", function () {
    var t = TEN[Math.floor(Math.random() * TEN.length)][0], r = VAR[t][Math.floor(Math.random() * VAR[t].length)];
    K.ten = t; K.renk = r; K.sac = SAC[Math.floor(Math.random() * 2)][0]; degisti();
  });
  $("hazir").addEventListener("click", function () {
    var isim = (K.isim || "").trim(); if (!isim) { $("durum").textContent = "Give your hero a name first."; $("isim").focus(); return; }
    sakla(); $("durum").textContent = isim + " is ready!"; location.href = "menu.html"; // ana menü; kahraman localStorage "clayHero"dan okunur
  });

  ciz(); secenekler();
  window.ClayHero = { kahraman: K, ad: function () { return ad(K); } };
})();
