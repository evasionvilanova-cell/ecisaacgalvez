// ============================================================
//  ECDB — capa de dades de la web (Supabase)
//  Totes les pàgines llegeixen i escriuen a través d'aquest fitxer.
// ============================================================
(function () {
  var C = window.EC_CONFIG || {};
  var READY = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
  var sb = READY ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;

  // Supabase retorna null als camps buits; les pàgines esperen ''
  function clean(rows) {
    return (rows || []).map(function (r) {
      var o = {};
      Object.keys(r).forEach(function (k) { o[k] = r[k] == null ? '' : r[k]; });
      return o;
    });
  }
  function ok(res) { if (res.error) throw res.error; return res.data; }
  function sheets(params) {
    if (!C.SHEETS_API) return Promise.reject(new Error('Sense backend'));
    return fetch(C.SHEETS_API + '?' + params).then(function (r) { return r.json(); });
  }

  var ECDB = {
    ready: READY,
    client: sb,

    // ---------- Lectura (pàgines públiques) ----------
    getAll: function (table) {
      if (!READY) return sheets('action=getAll&table=' + encodeURIComponent(table));
      return sb.from(table).select('*').order('created_at', { ascending: true }).then(ok).then(clean);
    },
    getConfig: function () {
      if (!READY) return sheets('action=getConfig');
      return sb.from('config').select('key,value').then(ok).then(function (rows) {
        var o = {}; (rows || []).forEach(function (r) { o[r.key] = r.value == null ? '' : r.value; }); return o;
      });
    },
    // Notícies publicades (banner / pop-up / llistat)
    getNoticies: function () {
      if (!READY) return Promise.resolve([]);
      return sb.from('noticies').select('*').eq('activa', true).order('data', { ascending: false }).then(ok).then(clean);
    },

    // ---------- Formulari públic ----------
    addInscripcio: function (row) {
      if (!READY) return Promise.reject(new Error('NO_DB'));
      return sb.from('inscripcions').insert(row).then(ok);
    },

    addMissatge: function (row) {
      if (!READY) return Promise.reject(new Error('NO_DB'));
      return sb.from('missatges').insert(row).then(ok);
    },

    // ---------- Escriptura (només administradors) ----------
    insert: function (table, row) { delete row.id; return sb.from(table).insert(row).then(ok); },
    update: function (table, id, row) { row = Object.assign({}, row); delete row.id; return sb.from(table).update(row).eq('id', id).then(ok); },
    remove: function (table, id) { return sb.from(table).delete().eq('id', id).then(ok); },
    setConfig: function (obj) {
      var rows = Object.keys(obj).map(function (k) { return { key: k, value: obj[k] == null ? '' : String(obj[k]) }; });
      return sb.from('config').upsert(rows).then(ok);
    },
    upload: function (file) {
      var path = Date.now() + '-' + file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      return sb.storage.from('imatges').upload(path, file).then(ok).then(function () {
        return sb.storage.from('imatges').getPublicUrl(path).data.publicUrl;
      });
    },

    // ---------- Sessió d'administrador ----------
    login: function (email, password) {
      return sb.auth.signInWithPassword({ email: email, password: password }).then(ok)
        .then(function () { return sb.rpc('is_admin'); })
        .then(function (r) {
          if (r.data !== true) return sb.auth.signOut().then(function () { throw new Error('Aquest usuari no és administrador'); });
        });
    },
    logout: function () { return sb.auth.signOut(); },
    isAdmin: function () {
      if (!READY) return Promise.resolve(false);
      return sb.auth.getSession().then(function (r) {
        if (!r.data.session) return false;
        return sb.rpc('is_admin').then(function (x) { return x.data === true; });
      });
    },

    // Llegeix l'antic Google Sheets (per a la importació)
    sheets: sheets
  };

  // Retalla els marges blancs o transparents d'una imatge (logos amb molt d'espai buit).
  // Retorna un canvas retallat, o null si no es pot (p. ex. imatge d'un altre domini sense CORS).
  function trimCanvas(img) {
    try {
      var w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) return null;
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d'); x.drawImage(img, 0, 0);
      var d = x.getImageData(0, 0, w, h).data, t = h, l = w, r = -1, b = -1;
      for (var y = 0; y < h; y++) for (var i = 0; i < w; i++) {
        var p = (y * w + i) * 4, a = d[p + 3];
        var blank = a < 16 || (d[p] > 240 && d[p + 1] > 240 && d[p + 2] > 240);
        if (!blank) { if (y < t) t = y; if (y > b) b = y; if (i < l) l = i; if (i > r) r = i; }
      }
      if (r < 0) return null;
      var pad = Math.round(Math.max(r - l, b - t) * 0.03);
      l = Math.max(0, l - pad); t = Math.max(0, t - pad); r = Math.min(w - 1, r + pad); b = Math.min(h - 1, b + pad);
      if (l === 0 && t === 0 && r === w - 1 && b === h - 1) return null; // ja està ajustada
      var o = document.createElement('canvas'); o.width = r - l + 1; o.height = b - t + 1;
      o.getContext('2d').drawImage(c, l, t, o.width, o.height, 0, 0, o.width, o.height);
      return o;
    } catch (e) { return null; }
  }
  // Per a les pàgines: ajusta els <img> que ja estan carregant
  ECDB.trimImg = function (img) {
    if (img.dataset.trimmed) return;
    img.dataset.trimmed = '1';
    var go = function () { var o = trimCanvas(img); if (o) img.src = o.toDataURL('image/png'); };
    if (!/^data:|^blob:/.test(img.src) && !img.crossOrigin && !/^(\.\/|\/)?[^:]*$/.test(img.getAttribute('src'))) {
      // imatge externa: es torna a carregar amb permís CORS per poder-la retallar
      var n = new Image(); n.crossOrigin = 'anonymous';
      n.onload = function () { var o = trimCanvas(n); if (o) img.src = o.toDataURL('image/png'); };
      n.src = img.src; return;
    }
    if (img.complete) go(); else img.addEventListener('load', go, { once: true });
  };
  // Per a l'admin: retalla un arxiu abans de pujar-lo
  ECDB.trimFile = function (file) {
    return new Promise(function (res) {
      if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return res(file);
      var u = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var o = trimCanvas(img); URL.revokeObjectURL(u);
        if (!o) return res(file);
        o.toBlob(function (b) { res(b ? new File([b], file.name.replace(/\.\w+$/, '') + '.png', { type: 'image/png' }) : file); }, 'image/png');
      };
      img.onerror = function () { res(file); };
      img.src = u;
    });
  };

  window.ECDB = ECDB;
  window.ecEsc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
})();
