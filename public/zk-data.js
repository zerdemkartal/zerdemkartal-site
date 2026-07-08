/* zk-data.js — FAZ 2 SÜRÜMÜ (API'ye bağlı veri katmanı).
   ------------------------------------------------------------------
   Prototipteki dosyayla AYNI yüzey (getItem/setItem/removeItem + get/set/keys/
   subscribe/REGISTRY) — sayfa kodu değişmeden çalışır. Fark sadece `backend`:

   - Açılışta GET /api/bootstrap → tüm public içerik bellek cache'ine alınır;
     sayfalar senkron getItem ile cache'ten okur. Cache dolduğunda her anahtar
     için 'zk-data' event'i yayınlanır (subscribe olan view'lar tazelenir).
   - setItem → cache'e anında yazar + arkada ilgili API ucuna PUT/POST atar
     (admin anahtarları için Authorization: Bearer <sessionStorage.zk_admin_jwt>).
   - Cihaza özel anahtarlar (oturum, ilerleme, client id) localStorage'da kalır.

   NOT: Bu köprü paneli + mevcut sayfaları API'ye bağlar. Public sayfaların
   nihai hedefi SSR port'udur (bkz. src/app/danismanliklar/page.jsx). */
(function () {
  'use strict';

  var API = ''; // aynı origin; farklıysa 'https://zerdemkartal.com' yap

  // Sunucuya senkronlanan içerik anahtarları → API yolu
  var CONTENT = {
    zk_anasayfa: 'anasayfa', zk_danismanlik: 'danismanlik', zk_programlar: 'programlar',
    zk_pd_astropen: 'pd_astropen', zk_pd_hermes: 'pd_hermes', zk_astroloji101: 'astroloji101',
    zk_harita: 'harita', zk_hakkimda: 'hakkimda'
  };
  // Cihazda kalanlar (sunucuya gitmez)
  var LOCAL_ONLY = { zk_uye_oturum: 1, zk_astroloji101_progress: 1, zk_google_client_id: 1 };

  var cache = {};   // anahtar → string (JSON)
  var ready = false;
  var shadow = {};  // liste anahtarları için id → alan-imzası (PATCH diff'i)

  function authHeaders() {
    var t = null;
    try { t = sessionStorage.getItem('zk_admin_jwt'); } catch (e) {}
    return t ? { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  function emit(key, value) {
    try { window.dispatchEvent(new CustomEvent('zk-data', { detail: { key: key, value: value } })); } catch (e) {}
  }

  // ---- açılış: bootstrap ----
  fetch(API + '/api/bootstrap').then(function (r) { return r.json(); }).then(function (boot) {
    var keys = boot.keys || {};
    Object.keys(keys).forEach(function (k) {
      cache[k] = typeof keys[k] === 'string' ? keys[k] : JSON.stringify(keys[k]);
      emit(k, cache[k]);
    });
    ready = true;
    emit('__zk_bootstrap', '1');
    hydrateAdmin();
  }).catch(function (e) { console.warn('zk-data bootstrap başarısız:', e); hydrateAdmin(); });

  // ---- admin hidrasyonu: panel açıkken sunucu listeleri cache'e alınır ----
  // (bootstrap public'tir; e-posta içeren listeler sadece JWT ile gelir)
  function trDate(iso) { try { return new Date(iso).toLocaleDateString('tr-TR'); } catch (e) { return ''; } }
  var ADMIN_LISTS = [
    { url: '/api/leads', key: 'zk_admin_talep', sig: ['status', 'note'],
      map: function (r) { return { id: r.id, name: r.name, email: r.email || undefined, type: r.type, message: r.message || undefined, rvDate: r.rvDate || undefined, rvTime: r.rvTime || undefined, note: r.note || undefined, status: r.status || 'new', date: trDate(r.createdAt), __synced: true }; } },
    { url: '/api/orders', key: 'zk_siparis', sig: ['status'],
      map: function (r) { return { id: r.id, name: r.name, email: r.email, product: r.product, price: r.price, license: r.license, status: r.status || 'paid', date: trDate(r.createdAt), __synced: true }; } },
    { url: '/api/members', key: 'zk_uye_hesaplar', sig: null, // salt-okunur liste
      map: function (r) { return { name: r.name, email: r.email, pass: '', provider: r.provider || undefined, picture: r.picture || undefined, birth: r.birth || undefined, joinedAt: r.joinedAt }; } }
  ];
  function hydrateAdmin() {
    var t = null; try { t = sessionStorage.getItem('zk_admin_jwt'); } catch (e) {}
    if (!t) return;
    ADMIN_LISTS.forEach(function (cfg) {
      fetch(API + cfg.url, { headers: { Authorization: 'Bearer ' + t } })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (rows) {
          var list = rows.map(cfg.map);
          cache[cfg.key] = JSON.stringify(list);
          if (cfg.sig) snapshot(cfg.key, list, cfg.sig);
          emit(cfg.key, cache[cfg.key]);
        })
        .catch(function (e) { console.warn('zk-data admin hidrasyon', cfg.key, e); });
    });
  }
  function snapshot(k, list, fields) {
    var m = {};
    list.forEach(function (it) { if (it && it.id != null) m[String(it.id)] = fields.map(function (f) { return it[f] == null ? '' : String(it[f]); }).join('\u0001'); });
    shadow[k] = m;
  }

  // Liste senkronu: yeni kayıt (→POST) + alan değişikliği (→PATCH) tek geçişte.
  function syncList(k, v, cfg) {
    var list; try { list = JSON.parse(v); } catch (e) { return; }
    if (!Array.isArray(list)) return;
    var prev = shadow[k] || {}; var next = {}; var marked = false;
    list.forEach(function (it) {
      if (!it || it.id == null) return;
      var id = String(it.id);
      var sig = cfg.sig.map(function (f) { return it[f] == null ? '' : String(it[f]); }).join('\u0001');
      if (!it.__synced) {
        fetch(API + cfg.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg.postBody(it)) })
          .catch(function (e) { console.warn('zk-data POST', k, e); });
        it.__synced = true; marked = true;
      } else if (Object.prototype.hasOwnProperty.call(prev, id) && prev[id] !== sig) {
        fetch(API + cfg.url + '/' + encodeURIComponent(id), { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(cfg.patchBody(it)) })
          .catch(function (e) { console.warn('zk-data PATCH', k, e); });
      }
      next[id] = sig;
    });
    shadow[k] = next;
    if (marked) cache[k] = JSON.stringify(list);
  }
  var LIST_SYNC = {
    zk_admin_talep: { url: '/api/leads', sig: ['status', 'note'],
      postBody: function (it) { return { id: it.id, name: it.name, email: it.email, type: it.type, message: it.message, rvDate: it.rvDate, rvTime: it.rvTime, date: it.date }; },
      patchBody: function (it) { return { status: it.status || 'new', note: it.note || '' }; } },
    zk_siparis: { url: '/api/orders', sig: ['status'],
      postBody: function (it) { return { id: it.id, name: it.name, email: it.email, product: it.product, price: it.price, license: it.license }; },
      patchBody: function (it) { return { status: it.status || 'paid' }; } }
  };

  // ---- arkaya yazma ----
  function pushRemote(k, v) {
    if (LOCAL_ONLY[k]) return;
    if (CONTENT[k]) {
      fetch(API + '/api/content/' + CONTENT[k], { method: 'PUT', headers: authHeaders(), body: v })
        .catch(function (e) { console.warn('zk-data PUT', k, e); });
    } else if (k === 'zk_blog_tree') {
      fetch(API + '/api/blog/tree', { method: 'PUT', headers: authHeaders(), body: v }).catch(function () {});
    } else if (k === 'zk_blog_showcase') {
      fetch(API + '/api/blog/showcase', { method: 'PUT', headers: authHeaders(), body: v }).catch(function () {});
    } else if (k === 'zk_admin_settings') {
      fetch(API + '/api/settings', { method: 'PUT', headers: authHeaders(), body: v }).catch(function () {});
    } else if (k === 'zk_bulten') {
      // Prototip diziye push eder; en yeni kaydı public uca gönder
      try {
        var bl = JSON.parse(v); var bLast = bl[bl.length - 1];
        if (bLast && !bLast.__synced) {
          fetch(API + '/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: bLast.email, source: bLast.source }) }).catch(function () {});
          bLast.__synced = true; cache[k] = JSON.stringify(bl);
        }
      } catch (e) {}
    } else if (LIST_SYNC[k]) {
      // zk_admin_talep + zk_siparis: yeni kayıt → POST, durum/not değişikliği → PATCH
      syncList(k, v, LIST_SYNC[k]);
    }
    // zk_uye_hesaplar: üye kayıt/girişi Faz 2'de kendi auth uçlarına taşınır (README §Sonraki adımlar).
  }

  var backend = {
    getItem: function (k) {
      if (LOCAL_ONLY[k]) { try { return localStorage.getItem(k); } catch (e) { return null; } }
      return Object.prototype.hasOwnProperty.call(cache, k) ? cache[k] : null;
    },
    setItem: function (k, v) {
      if (LOCAL_ONLY[k]) { try { localStorage.setItem(k, v); } catch (e) {} return; }
      cache[k] = v; pushRemote(k, v);
    },
    removeItem: function (k) {
      if (LOCAL_ONLY[k]) { try { localStorage.removeItem(k); } catch (e) {} return; }
      delete cache[k]; // sunucuda silme ucu yok (kural) — sadece cache'ten düşer
    },
    keys: function () { return Object.keys(cache); }
  };

  var ZKData = {
    getItem: function (k) { return backend.getItem(k); },
    setItem: function (k, v) { backend.setItem(k, v); emit(k, v); },
    removeItem: function (k) { backend.removeItem(k); emit(k, null); },
    get: function (k, d) {
      var v = backend.getItem(k);
      if (v == null || v === '') return d;
      try { return JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) { ZKData.setItem(k, JSON.stringify(v)); },
    keys: function () { return backend.keys(); },
    subscribe: function (fn) {
      var onLocal = function (e) { fn({ key: e.detail.key, value: e.detail.value, remote: false }); };
      var onStorage = function (e) { if (e.key) fn({ key: e.key, value: e.newValue, remote: true }); };
      window.addEventListener('zk-data', onLocal);
      window.addEventListener('storage', onStorage);
      return function () {
        window.removeEventListener('zk-data', onLocal);
        window.removeEventListener('storage', onStorage);
      };
    },
    isReady: function () { return ready; },
    refreshAdmin: hydrateAdmin, // panel girişten sonra çağırabilir (JWT yazıldıktan sonra)
    REGISTRY: { /* katalog prototipteki zk-data.js ile aynı — bkz. devir paketi */ }
  };

  window.ZKData = ZKData;
})();
