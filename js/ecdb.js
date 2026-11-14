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

  window.ECDB = ECDB;
  window.ecEsc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
})();
