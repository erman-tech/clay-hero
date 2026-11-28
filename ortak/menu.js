/* Clay Hero ortak menü: ses aç/kapa, duraklatma, ana menüye dönüş. oyun.js'ten ÖNCE yüklenir (ses yollarını sarmak için).
   Oyun döngüleri window.__durdu doğruyken kare atlar; duraklatma onu kullanır. 22 Kas 2026. */
(function () {
  "use strict";
  var bet = document.currentScript, ANA = bet.getAttribute("data-ana") || "../menu.html", OYUN = bet.getAttribute("data-oyun") || "", YAN = bet.getAttribute("data-yan") || "sag";
  var TRD = document.documentElement.lang === "tr";   // 28 Kas 2026: Türkçe sürüm (sayfa lang="tr"); dil cihaza göre, oyunda değiştirilmez
  function T(en, tr) { return TRD ? tr : en; }
  // Filmlerde iki ses kanalı var: 1. İngilizce, 2. Türkçe anlatım (film/film_kur.py, DIL=tr). Türkçe sayfa Türkçe kanalı seçer; görüntü ortak, video iki kez indirilmez.
  if (TRD) {
    var trSec = function (v) {
      var a = v && v.audioTracks; if (!a) return;
      if (!v.__chTr) { v.__chTr = 1; try { a.addEventListener("addtrack", function () { trSec(v); }); } catch (x) {} }
      if (a.length < 2) return;
      var tr = -1; for (var i = 0; i < a.length; i++) if (/^(tr|tur)/i.test(a[i].language || "")) tr = i;
      if (tr < 0) tr = 1; for (var j = 0; j < a.length; j++) if (a[j].enabled !== (j === tr)) a[j].enabled = j === tr;
    };
    ["loadedmetadata", "canplay", "playing"].forEach(function (ad) { document.addEventListener(ad, function (e) { if (e.target && e.target.tagName === "VIDEO") trSec(e.target); }, true); });
  }
  var sesKapali = false; try { sesKapali = localStorage.getItem("ch_ses") === "0"; } catch (e) {}
  try { if (OYUN) { var g = JSON.parse(localStorage.getItem("ch_oynandi") || "{}"); g[OYUN] = 1; localStorage.setItem("ch_oynandi", JSON.stringify(g)); } } catch (e) {}

  // ---- ses: bütün sesler tek anahtardan ----
  var sesler = [], baglamlar = [], ustalar = [];
  var eskiCal = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { if (sesler.indexOf(this) < 0) { sesler.push(this); if (sesler.length > 60) sesler.shift(); } this.muted = sesKapali; return eskiCal.apply(this, arguments); };
  if (window.AudioNode && window.AudioDestinationNode) {
    var eskiBagla = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (hedef) {
      if (hedef instanceof AudioDestinationNode) {
        var b = hedef.context, i = baglamlar.indexOf(b);
        if (i < 0) { var u = b.createGain(); u.gain.value = sesKapali ? 0 : 1; eskiBagla.call(u, hedef); baglamlar.push(b); ustalar.push(u); i = baglamlar.length - 1; }
        if (this === ustalar[i]) return eskiBagla.apply(this, arguments);
        return eskiBagla.call(this, ustalar[i]);
      }
      return eskiBagla.apply(this, arguments);
    };
  }
  function sesUygula() { sesler.forEach(function (s) { s.muted = sesKapali; }); ustalar.forEach(function (u) { u.gain.value = sesKapali ? 0 : 1; }); try { localStorage.setItem("ch_ses", sesKapali ? "0" : "1"); } catch (e) {} }
  var duranlar = [];
  function sesDurdur(dur) {
    if (dur) { duranlar = sesler.filter(function (s) { return !s.paused && !s.ended && s.tagName !== "VIDEO"; }); duranlar.forEach(function (s) { s.pause(); }); baglamlar.forEach(function (b) { try { b.suspend(); } catch (e) {} }); }
    else { duranlar.forEach(function (s) { var p = eskiCal.call(s); if (p && p.catch) p.catch(function () {}); }); duranlar = []; baglamlar.forEach(function (b) { try { b.resume(); } catch (e) {} }); }
  }

  function kur() {
    var sahne = document.getElementById("sahne"); if (!sahne) return;
    function el(etiket, ozellik, ic) { var d = document.createElement(etiket); for (var k in ozellik) d.setAttribute(k, ozellik[k]); if (ic != null) d.textContent = ic; return d; }
    var kapak = document.getElementById("kapak");
    if (kapak && OYUN !== "sehirler") { var h = kapak.querySelector("h1"); if (h) h.parentNode.insertBefore(el("div", { "class": "ch-rozet" }, T("CLAY HERO", "HAMUR KAHRAMAN")), h); }
    var dur = el("button", { id: "chDur", "class": "ch-kose", type: "button", "aria-label": T("Pause", "Duraklat") }, "⏸");
    var ev = el("button", { id: "chEv", "class": "ch-kose", type: "button", "aria-label": T("Main menu", "Ana menü") }, "🏠");
    var ses = el("button", { id: "chSes", "class": "ch-kose", type: "button", "aria-label": T("Sound", "Ses") });
    if (YAN === "orta") { dur.style.left = "50%"; dur.style.marginLeft = "-34px"; } else dur.style[YAN === "sol" ? "left" : "right"] = "14px"; ev.style.left = "14px"; ses.style.right = "14px";
    var menu = el("div", { id: "chMenu" }), kart = el("div", { "class": "ch-kart" });
    var bDevam = el("button", { "class": "hamur kirmizi", type: "button" }, T("▶ Resume", "▶ Devam et")), bBastan = el("button", { "class": "hamur sari", type: "button" }, T("↻ Restart", "↻ Baştan başla"));
    var bSes = el("button", { "class": "hamur mor", type: "button" }), bEv = el("button", { "class": "hamur mavi", type: "button" }, T("🏠 Main menu", "🏠 Ana menü"));
    kart.appendChild(el("h1", {}, T("Paused", "Duraklatıldı"))); [bDevam, bBastan, bSes, bEv].forEach(function (b) { kart.appendChild(b); }); menu.appendChild(kart);
    [dur, ev, ses, menu].forEach(function (d) { sahne.appendChild(d); });
    function sesYaz() { ses.textContent = sesKapali ? "🔇" : "🔊"; bSes.textContent = sesKapali ? T("🔇 Sound: off", "🔇 Ses: kapalı") : T("🔊 Sound: on", "🔊 Ses: açık"); }
    function sesDegis() { sesKapali = !sesKapali; sesUygula(); sesYaz(); }
    function duraklat(ac) { window.__durdu = !!ac; menu.classList.toggle("acik", !!ac); sesDurdur(!!ac); }
    function eveGit() { window.__durdu = true; sesler.forEach(function (s) { try { s.pause(); } catch (e) {} }); location.href = ANA; }
    dur.addEventListener("click", function () { duraklat(true); }); bDevam.addEventListener("click", function () { duraklat(false); });
    bBastan.addEventListener("click", function () { location.reload(); }); ses.addEventListener("click", sesDegis); bSes.addEventListener("click", sesDegis);
    ev.addEventListener("click", eveGit); bEv.addEventListener("click", eveGit);
    addEventListener("keydown", function (e) { if (e.key === "Escape" || e.key === "p") { if (menu.classList.contains("acik")) duraklat(false); else if (dur.classList.contains("gor")) duraklat(true); } });
    document.addEventListener("visibilitychange", function () { if (document.hidden && dur.classList.contains("gor")) duraklat(true); });
    sesYaz();
    // ⏸ yalnız oyun oynanırken; 🏠 ve 🔊 yalnız kapakta
    function filmVar() { var f = document.getElementById("film"); return !!f && f.style.display !== "none" && !f.paused && !f.ended && getComputedStyle(f).display !== "none"; }
    setInterval(function () {
      var acik = document.querySelector(".ekran.acik"), kp = !!acik && acik.id === "kapak", m = menu.classList.contains("acik");
      dur.classList.toggle("gor", !acik && !m && !filmVar()); ev.classList.toggle("gor", kp); ses.classList.toggle("gor", kp);
    }, 250);
    window.__chMenu = { duraklat: duraklat, ses: function () { return !sesKapali; } };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kur); else kur();
})();
