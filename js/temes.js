// ============================================================
//  temes.js — dissenys de la web (colors + tipografies)
//
//  · El tema actiu es tria a l'admin (Pàgina inici → Disseny).
//  · Per previsualitzar sense canviar res: afegeix ?tema=vermell
//    (o blau, verd, rosa) a qualsevol pàgina.
//
//  Funciona substituint la paleta rosa original per la del tema
//  dins dels estils de cada pàgina, així no cal duplicar pàgines.
// ============================================================
(function () {
  var BASE = {
    accent: ['#fc449d', '252,68,157'], light: ['#ff7ec3', '255,126,195'], deep: ['#c4207a', '196,32,122'],
    d1: ['#1a0a12', '26,10,18'], d2: ['#2d0a1e', '45,10,30'], d3: ['#3a0a25', '58,10,37'], d4: ['#5a1040', '90,16,64'],
    off: ['#fff5fb', '255,245,251'], gray: ['#6b3a55', '107,58,85']
  };

  var TEMES = {
    rosa: { nom: 'Rosa (actual)' },
    rosablanc: {
      nom: 'Rosa i Blanc', desc: 'Tot en rosa i blanc, sense negre: fresc i alegre',
      accent: ['#ff2f8e', '255,47,142'], light: ['#ffd3e7', '255,211,231'], deep: ['#d81470', '216,20,112'],
      d1: ['#b3125f', '179,18,95'], d2: ['#c7176b', '199,23,107'], d3: ['#d92a7b', '217,42,123'], d4: ['#f0559a', '240,85,154'],
      off: ['#fff4f9', '255,244,249'], gray: ['#9b4d74', '155,77,116'],
      extra: [['#050505', '#9e0f53'], ['rgba(0,0,0,', 'rgba(150,10,80,']],
      head: "'Poppins'", body: "'Nunito'",
      fonts: 'family=Poppins:wght@600;700;800;900&family=Nunito:wght@400;600;700;800;900'
    },
    vermell: {
      nom: 'Vermell Pista', desc: 'Negre i vermell de competició, lletra condensada esportiva',
      accent: ['#e10600', '225,6,0'], light: ['#ff4d3d', '255,77,61'], deep: ['#a30400', '163,4,0'],
      d1: ['#0c0c0e', '12,12,14'], d2: ['#141417', '20,20,23'], d3: ['#1c1c20', '28,28,32'], d4: ['#2a2a30', '42,42,48'],
      off: ['#f5f5f3', '245,245,243'], gray: ['#55555c', '85,85,92'],
      head: "'Barlow Condensed'", body: "'Inter'", headUpper: true,
      fonts: 'family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@300;400;600;700;900'
    },
    blau: {
      nom: 'Blau Mediterrani', desc: 'Blau marí de Vilanova amb corall, lletra moderna i arrodonida',
      accent: ['#ff5a36', '255,90,54'], light: ['#ff8a6b', '255,138,107'], deep: ['#d63d1c', '214,61,28'],
      d1: ['#081a33', '8,26,51'], d2: ['#0c2446', '12,36,70'], d3: ['#112e57', '17,46,87'], d4: ['#1b4a85', '27,74,133'],
      off: ['#f2f7fc', '242,247,252'], gray: ['#41536e', '65,83,110'],
      head: "'Outfit'", body: "'DM Sans'",
      fonts: 'family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;600;700;900'
    },
    verd: {
      nom: 'Verd Clàssic', desc: 'Verd bosc i taronja de mallot, tipografia clàssica de ciclisme',
      accent: ['#f26b1d', '242,107,29'], light: ['#ff9a5c', '255,154,92'], deep: ['#c9520e', '201,82,14'],
      d1: ['#0c241a', '12,36,26'], d2: ['#112f22', '17,47,34'], d3: ['#163a2a', '22,58,42'], d4: ['#22553e', '34,85,62'],
      off: ['#f7f3e8', '247,243,232'], gray: ['#4a5a4f', '74,90,79'],
      head: "'Playfair Display'", body: "'Work Sans'",
      fonts: 'family=Playfair+Display:wght@700;800;900&family=Work+Sans:wght@300;400;600;700;900'
    }
  };
  window.EC_TEMES = TEMES;
  if (window.EC_ADMIN) return; // a l'admin només calen les dades

  // Quin tema? 1) ?tema= a la URL (previsualització)  2) el que hi ha a l'admin (cache)
  var q = (location.search.match(/[?&]tema=([a-z]+)/) || [])[1];
  if (q && TEMES[q]) sessionStorage.setItem('ec_tema_prev', q);
  if (q === 'sortir') sessionStorage.removeItem('ec_tema_prev');
  var preview = sessionStorage.getItem('ec_tema_prev');
  var actiu = preview || localStorage.getItem('ec_tema') || 'rosa';
  if (!TEMES[actiu]) actiu = 'rosa';
  var T = TEMES[actiu];

  function swap(txt) {
    if (!txt || actiu === 'rosa') return txt;
    Object.keys(BASE).forEach(function (k) {
      txt = txt.split(BASE[k][0]).join(T[k][0]).split(BASE[k][0].toUpperCase()).join(T[k][0]);
      txt = txt.replace(new RegExp(BASE[k][1].replace(/,/g, ',\\s*'), 'g'), T[k][1]);
    });
    (T.extra || []).forEach(function (p) { txt = txt.split(p[0]).join(p[1]); });
    txt = txt.replace(/'Raleway'|"Raleway"|\bRaleway\b/g, T.head).replace(/'Montserrat'|"Montserrat"|\bMontserrat\b/g, T.body);
    return txt;
  }
  function paint(root) {
    if (actiu === 'rosa') return;
    (root || document).querySelectorAll('style:not([data-tema]), [style]').forEach(function (el) {
      if (el.closest && el.closest('[data-notema]')) return;
      if (el.tagName === 'STYLE') { el.textContent = swap(el.textContent); el.setAttribute('data-tema', '1'); }
      else { var s = el.getAttribute('style'); var n = swap(s); if (n !== s) el.setAttribute('style', n); }
    });
  }

  if (actiu !== 'rosa') {
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?' + T.fonts + '&display=swap';
    document.head.appendChild(l);
    if (T.headUpper) {
      var st = document.createElement('style'); st.setAttribute('data-tema', '1');
      st.textContent = 'h1,h2,h3,.race-name{text-transform:uppercase;letter-spacing:.01em}';
      document.head.appendChild(st);
    }
    paint();
    document.addEventListener('DOMContentLoaded', function () {
      paint();
      // el contingut que arriba de la base de dades també es repinta
      new MutationObserver(function (ms) {
        ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { paint(n); if (n.hasAttribute && n.hasAttribute('style')) paint(n.parentNode); } }); });
      }).observe(document.body, { childList: true, subtree: true });
    });
  }

  // Sincronitza amb el tema triat a l'admin (si canvia, recarrega un cop)
  document.addEventListener('DOMContentLoaded', function () {
    if (window.ECDB && !preview) {
      ECDB.getConfig().then(function (c) {
        var t = TEMES[c.tema] ? c.tema : 'rosa';
        if (t !== (localStorage.getItem('ec_tema') || 'rosa')) { localStorage.setItem('ec_tema', t); location.reload(); }
      }).catch(function () {});
    }
    // Barra de previsualització
    if (preview) {
      var bar = document.createElement('div');
      bar.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:5000;background:#111;color:#fff;border-radius:50px;padding:6px 8px 6px 16px;display:flex;gap:6px;align-items:center;font:600 12px/1 system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.35);flex-wrap:wrap;justify-content:center;max-width:94vw';
      bar.innerHTML = '<span style="opacity:.7;margin-right:4px">Previsualització:</span>' + Object.keys(TEMES).map(function (k) {
        var c = TEMES[k].accent ? TEMES[k].accent[0] : BASE.accent[0];
        return '<a href="?tema=' + k + '" style="text-decoration:none;color:#fff;padding:8px 12px;border-radius:50px;display:inline-flex;gap:6px;align-items:center;' + (k === actiu ? 'background:#fff;color:#111' : 'background:rgba(255,255,255,.1)') + '"><i style="width:10px;height:10px;border-radius:50%;background:' + c + ';display:inline-block"></i>' + TEMES[k].nom + '</a>';
      }).join('') + '<a href="?tema=sortir" style="text-decoration:none;color:#fff;opacity:.6;padding:8px 10px">Sortir ✕</a>';
      bar.setAttribute('data-notema', '1');
      document.body.appendChild(bar);
    }
  });
})();
