// ============================================================
//  web.js — coses comunes a totes les pàgines públiques:
//   · Textos editables des de l'admin (atribut data-cfg="clau")
//   · Banner de notícia (franja a dalt)
//   · Pop-up de notícia en entrar
//   · Llistat de notícies (si la pàgina té #noticies-list)
// ============================================================
(function () {
  var esc = window.ecEsc;
  var css = ''
    + '.ec-bar{position:relative;z-index:1001;background:linear-gradient(90deg,#c4207a,#fc449d);color:#fff;text-align:center;font:600 .85rem/1.4 Raleway,system-ui,sans-serif;padding:.6rem 3rem}'
    + '.ec-bar a{color:#fff;font-weight:800;text-decoration:underline;cursor:pointer;margin-left:.4rem}'
    + '.ec-bar button{position:absolute;right:.8rem;top:50%;transform:translateY(-50%);background:none;border:0;color:#fff;font-size:1.1rem;cursor:pointer}'
    + '.ec-mo{position:fixed;inset:0;z-index:3000;background:rgba(26,10,18,.75);display:none;align-items:center;justify-content:center;padding:1.2rem}'
    + '.ec-mo.open{display:flex;animation:ecf .25s}@keyframes ecf{from{opacity:0}}'
    + '.ec-box{background:#fff;border-radius:20px;max-width:540px;width:100%;max-height:90vh;overflow:auto;position:relative;box-shadow:0 30px 80px rgba(0,0,0,.4);font-family:Raleway,system-ui,sans-serif}'
    + '.ec-box img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}'
    + '.ec-in{padding:1.6rem 1.8rem 1.8rem}.ec-in small{color:#fc449d;font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-size:.7rem}'
    + '.ec-in h3{font-size:1.6rem;font-weight:900;color:#1a0a12;margin:.4rem 0 .8rem;line-height:1.15}'
    + '.ec-in p{color:#6b3a55;line-height:1.7;white-space:pre-line;margin:0 0 1.2rem}'
    + '.ec-btn{display:inline-block;background:#fc449d;color:#fff;padding:.8rem 1.6rem;border-radius:50px;font-weight:800;text-decoration:none;font-size:.85rem}'
    + '.ec-x{position:absolute;top:.7rem;right:.7rem;width:34px;height:34px;border-radius:50%;border:0;background:rgba(26,10,18,.6);color:#fff;font-size:1rem;cursor:pointer;z-index:2}'
    + '.ec-news{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;max-width:1100px;margin:2.5rem auto 0}'
    + '.ec-post{background:#fff;border-radius:18px;overflow:hidden;cursor:pointer;box-shadow:0 8px 30px rgba(252,68,157,.12);transition:transform .2s;text-align:left}'
    + '.ec-post:hover{transform:translateY(-4px)}.ec-post .ph{aspect-ratio:16/9;background:linear-gradient(135deg,#1a0a12,#c4207a) center/cover}'
    + '.ec-post .b{padding:1.2rem 1.3rem 1.4rem}.ec-post small{color:#fc449d;font-weight:700;font-size:.72rem}'
    + '.ec-post h4{font-size:1.1rem;font-weight:900;color:#1a0a12;margin:.3rem 0 .4rem}.ec-post p{color:#6b3a55;font-size:.88rem;margin:0;line-height:1.55}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function fd(d) {
    if (!d) return '';
    var p = String(d).slice(0, 10).split('-');
    return new Date(+p[0], p[1] - 1, +p[2]).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function safe(u) { u = String(u || '').trim(); return /^(https?:|#|mailto:|tel:|[a-z0-9_\-./]+\.html)/i.test(u) ? u : ''; }

  var NEWS = [];
  var mo = document.createElement('div');
  mo.className = 'ec-mo';
  mo.innerHTML = '<div class="ec-box"><button class="ec-x" aria-label="Tancar">&#x2715;</button><div id="ec-mo-c"></div></div>';
  mo.addEventListener('click', function (e) { if (e.target === mo || e.target.className === 'ec-x') mo.classList.remove('open'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') mo.classList.remove('open'); });

  window.ecOpenNews = function (id) {
    var n = NEWS.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!n) return;
    var link = safe(n.enllac);
    document.getElementById('ec-mo-c').innerHTML =
      (n.imatge ? '<img src="' + esc(safe(n.imatge)) + '" alt="">' : '')
      + '<div class="ec-in"><small>' + esc(fd(n.data)) + '</small><h3>' + esc(n.titol) + '</h3><p>' + esc(n.text || n.resum) + '</p>'
      + (link ? '<a class="ec-btn" href="' + esc(link) + '"' + (/^https?:/.test(link) ? ' target="_blank" rel="noopener"' : '') + ' onclick="document.querySelector(\'.ec-mo\').classList.remove(\'open\')">' + esc(n.boto || 'Més informació') + ' &rarr;</a>' : '')
      + '</div>';
    mo.classList.add('open');
  };

  function start() {
    document.body.appendChild(mo);

    // Textos editables
    if (document.querySelector('[data-cfg]')) {
      ECDB.getConfig().then(function (cfg) {
        document.querySelectorAll('[data-cfg]').forEach(function (el) {
          var v = cfg[el.getAttribute('data-cfg')];
          if (v) el.textContent = v;
        });
      }).catch(function () {});
    }

    ECDB.getNoticies().then(function (list) {
      // Les notícies amb data de fi passada ja no es mostren
      var avui = new Date().toISOString().slice(0, 10);
      list = list.filter(function (n) { return !n.fins || String(n.fins).slice(0, 10) >= avui; });
      NEWS = list;
      // Banner
      var b = list.filter(function (n) { return n.banner; })[0];
      if (b && sessionStorage.getItem('ec_bar') !== String(b.id)) {
        var bar = document.createElement('div');
        bar.className = 'ec-bar';
        bar.innerHTML = '&#x1F4E3; ' + esc(b.titol) + '<a onclick="ecOpenNews(\'' + esc(b.id) + '\')">Llegir</a><button aria-label="Tancar">&#x2715;</button>';
        // Les capçaleres fixes de cada pàgina baixen per deixar lloc al banner
        var fixed = Array.prototype.filter.call(document.querySelectorAll('nav, header, .nav, .navbar'), function (el) {
          var cs = getComputedStyle(el); return (cs.position === 'fixed' || cs.position === 'sticky') && parseInt(cs.top, 10) === 0;
        });
        var place = function (h) { fixed.forEach(function (el) { el.style.top = h + 'px'; }); if (!fixed.length) document.body.style.paddingTop = h ? h + 'px' : ''; };
        bar.querySelector('button').onclick = function () { sessionStorage.setItem('ec_bar', String(b.id)); bar.remove(); place(0); };
        bar.style.position = 'fixed'; bar.style.top = '0'; bar.style.left = '0'; bar.style.right = '0';
        document.body.insertBefore(bar, document.body.firstChild);
        place(bar.offsetHeight);
      }
      // Pop-up (es mostra un cop per notícia i visitant)
      var p = list.filter(function (n) { return n.popup; })[0];
      if (p && localStorage.getItem('ec_popup') !== String(p.id)) {
        setTimeout(function () { ecOpenNews(p.id); localStorage.setItem('ec_popup', String(p.id)); }, 1200);
      }
      // Llistat
      var box = document.getElementById('noticies-list');
      if (box) {
        var sec = document.getElementById('noticies');
        if (!list.length) { if (sec) sec.style.display = 'none'; return; }
        box.innerHTML = list.slice(0, 6).map(function (n) {
          return '<article class="ec-post" onclick="ecOpenNews(\'' + esc(n.id) + '\')"><div class="ph"' + (n.imatge ? ' style="background-image:url(\'' + esc(safe(n.imatge)) + '\')"' : '') + '></div>'
            + '<div class="b"><small>' + esc(fd(n.data)) + '</small><h4>' + esc(n.titol) + '</h4><p>' + esc(n.resum) + '</p></div></article>';
        }).join('');
      }
    }).catch(function (e) { console.warn('Notícies', e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
