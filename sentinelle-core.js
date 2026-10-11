/*  Sentinelle – socle commun : connexion Firebase, accès aux données, synchronisation.
    Utilisé par l'espace fondateur et l'espace pasteur de branche. */
(function () {
  'use strict';
  var CFG = window.SENTINELLE_FIREBASE_CONFIG || {};
  var ORG = 'egdlg';
  var FBV = '10.12.2';

  /* ===================== Accès Firebase ===================== */
  var FB = null;
  function loadFirebase() {
    if (FB) return Promise.resolve(FB);
    var base = 'https://www.gstatic.com/firebasejs/' + FBV + '/';
    return Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]).then(function (m) {
      var app = m[0].initializeApp(CFG);
      FB = { app: app, A: m[1], F: m[2], auth: m[1].getAuth(app), db: m[2].getFirestore(app) };
      return FB;
    });
  }
  function parts(p) { return p.split('/'); }
  var FirebaseStore = {
    mode: 'firebase',
    init: function () { return loadFirebase(); },
    onAuth: function (cb) { return loadFirebase().then(function (f) { f.A.onAuthStateChanged(f.auth, function (u) { cb(u ? { uid: u.uid, email: u.email } : null); }); }); },
    signIn: function (email, pw) { return loadFirebase().then(function (f) { return f.A.signInWithEmailAndPassword(f.auth, email, pw); }).then(function (c) { return { uid: c.user.uid, email: c.user.email }; }); },
    signOut: function () { return loadFirebase().then(function (f) { return f.A.signOut(f.auth); }); },
    resetPassword: function (email) { return loadFirebase().then(function (f) { return f.A.sendPasswordResetEmail(f.auth, email); }); },
    claims: function () { return loadFirebase().then(function (f) { return f.auth.currentUser.getIdTokenResult(true); }).then(function (r) { return r.claims; }); },
    idToken: function () { return loadFirebase().then(function (f) { return f.auth.currentUser.getIdToken(); }); },
    get: function (path) { return loadFirebase().then(function (f) { return f.F.getDoc(f.F.doc.apply(null, [f.db].concat(parts(path)))); }).then(function (s) { return s.exists() ? s.data() : null; }); },
    list: function (path, eq) { return loadFirebase().then(function (f) { var c = f.F.collection.apply(null, [f.db].concat(parts(path))); return f.F.getDocs(eq ? f.F.query(c, f.F.where(eq.field, '==', eq.value)) : c); }).then(function (s) { return s.docs.map(function (d) { return Object.assign({ _id: d.id, _path: d.ref.path }, d.data()); }); }); },
    listGroup: function (name) { return loadFirebase().then(function (f) { return f.F.getDocs(f.F.collectionGroup(f.db, name)); }).then(function (s) { return s.docs.map(function (d) { return Object.assign({ _id: d.id, _path: d.ref.path }, d.data()); }); }); },
    commit: function (ops) {
      return loadFirebase().then(function (f) {
        var chunks = [], i; for (i = 0; i < ops.length; i += 400) chunks.push(ops.slice(i, i + 400));
        return chunks.reduce(function (p, ch) {
          return p.then(function () {
            var b = f.F.writeBatch(f.db);
            ch.forEach(function (o) { var r = f.F.doc.apply(null, [f.db].concat(parts(o.path))); if (o.op === 'del') b.delete(r); else if (o.merge) b.set(r, o.data, { merge: true }); else b.set(r, o.data); });
            return b.commit();
          });
        }, Promise.resolve());
      });
    },
    listen: function (target, cb) {
      var un = function () { }, dead = false;
      loadFirebase().then(function (f) {
        if (dead) return;
        var q = typeof target === 'string' ? f.F.collection.apply(null, [f.db].concat(parts(target))) : target.group ? f.F.collectionGroup(f.db, target.group) : f.F.query(f.F.collection.apply(null, [f.db].concat(parts(target.col))), f.F.where(target.eq.field, '==', target.eq.value));
        un = f.F.onSnapshot(q, function (snap) {
          cb(snap.docChanges().map(function (c) { return { type: c.type, id: c.doc.id, path: c.doc.ref.path, data: c.doc.data(), local: c.doc.metadata.hasPendingWrites }; }));
        }, function (e) { console.warn('Écoute interrompue', e && e.code); });
      });
      return function () { dead = true; un(); };
    }
  };
  var Store = CFG.mock && window.SentinelleMockStore ? window.SentinelleMockStore : FirebaseStore;

  /* ===================== Interface : chargement, état, connexion ===================== */
  var css = '#sn-load{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;flex-direction:column;gap:16px;background:linear-gradient(160deg,#01307a,#01255D 55%,#001a47);color:#fff;font:500 15px Poppins,system-ui,sans-serif}'
    + '#sn-load.on{display:flex}#sn-load i{width:44px;height:44px;border-radius:50%;border:4px solid rgba(255,255,255,.2);border-top-color:#F6B52C;animation:snspin .9s linear infinite}'
    + '@keyframes snspin{to{transform:rotate(360deg)}}'
    + '#sn-state{position:fixed;left:12px;bottom:10px;z-index:900;display:flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;background:rgba(1,37,93,.88);color:#dbe7ff;font:500 11px Poppins,system-ui,sans-serif;opacity:.82;pointer-events:none}'
    + '#sn-state b{width:8px;height:8px;border-radius:50%;background:#1fa855}#sn-state.sync b{background:#F6B52C}#sn-state.err b{background:#e05252}'
    + '#lgErr{display:none;margin:0 0 14px;padding:10px 12px;border-radius:10px;background:#fde0e0;color:#8f1f1f;font-size:13px;line-height:1.4}#lgErr.on{display:block}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function el(id, html, cls) { var e = document.getElementById(id); if (!e) { e = document.createElement('div'); e.id = id; document.body.appendChild(e); } if (html != null) e.innerHTML = html; if (cls != null) e.className = cls; return e; }
  function loader(on, msg) { var e = el('sn-load', '<i></i><div>' + (msg || 'Chargement…') + '</div>'); e.classList.toggle('on', !!on); }
  function stateDot(kind, txt) { var e = el('sn-state', '<b></b><span>' + txt + '</span>', kind || ''); e.style.display = 'flex'; }
  function loginError(msg) { var e = document.getElementById('lgErr'); if (e) { e.textContent = msg || ''; e.classList.toggle('on', !!msg); } }
  function frErr(e) {
    var c = (e && e.code) || '';
    if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(c)) return 'E-mail ou mot de passe incorrect.';
    if (/too-many-requests/.test(c)) return 'Trop de tentatives. Patientez quelques minutes puis réessayez.';
    if (/network/.test(c)) return 'Connexion impossible. Vérifiez votre accès Internet.';
    return (e && e.message) ? e.message : 'Une erreur est survenue.';
  }

  /* ===================== Synchronisation ===================== */
  function stable(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
  }
  function canon(d) { var o = Object.assign({}, d); delete o._id; delete o._path; return o; }
  function createSync(specs, opts) {
    opts = opts || {};
    var snap = {}, unsub = [], flushing = false, again = false, timer = null, refreshTimer = null;
    function idOf(sp, it) { if (sp.ensureId) sp.ensureId(it); return String(sp.idOf(it)); }
    function mapOf(sp) { var m = new Map(); sp.read().forEach(function (it) { m.set(idOf(sp, it), stable(sp.toDoc(it))); }); return m; }
    function modalOpen() { return !!document.querySelector('.modal-bg,.modal-box'); }
    function editing() { var a = document.activeElement; return a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.id !== 'lgEmail' && a.id !== 'lgPwd'; }
    function setState(k, t) { stateDot(k, t); }
    return {
      loadAll: function () {
        return Promise.all(specs.map(function (sp) {
          var p = sp.group ? Store.listGroup(sp.group) : sp.single ? Store.get(sp.col).then(function (d) { return d ? [Object.assign({ _id: sp.single, _path: sp.col }, d)] : []; }) : Store.list(sp.col, sp.eq);
          return p.then(function (docs) { sp.load(docs); if (sp.persist || sp.live) snap[sp.name] = mapOf(sp); });
        }));
      },
      flush: function () {
        if (flushing) { again = true; return Promise.resolve(); }
        flushing = true;
        var ops = [], next = {};
        specs.forEach(function (sp) {
          if (!sp.persist) return;
          var cur = mapOf(sp), prev = snap[sp.name] || new Map();
          cur.forEach(function (json, id) { if (prev.get(id) !== json) { var d = JSON.parse(json); ops.push({ op: 'set', path: sp.path(id), data: d, merge: !!sp.merge }); } });
          prev.forEach(function (json, id) { if (!cur.has(id) && !sp.noDelete) ops.push({ op: 'del', path: sp.path(id) }); });
          next[sp.name] = cur;
        });
        if (!ops.length) { flushing = false; return Promise.resolve(); }
        setState('sync', 'Enregistrement…');
        return Store.commit(ops).then(function () { Object.keys(next).forEach(function (k) { snap[k] = next[k]; }); setState('', 'Synchronisé'); })
          .catch(function (e) { console.error('Échec de l\'enregistrement', e); setState('err', 'Enregistrement impossible'); })
          .then(function () { flushing = false; if (again) { again = false; return this.flush(); } }.bind(this));
      },
      schedule: function () { var s = this; clearTimeout(timer); timer = setTimeout(function () { s.flush(); }, 450); },
      start: function () {
        var s = this;
        ['click', 'change', 'submit', 'keyup'].forEach(function (ev) { document.addEventListener(ev, function () { s.schedule(); }, true); });
        setInterval(function () { s.flush(); }, 4000);
        window.addEventListener('online', function () { s.flush(); });
        specs.forEach(function (sp) {
          if (!sp.live) return;
          unsub.push(Store.listen(sp.group ? { group: sp.group } : sp.eq ? { col: sp.col, eq: sp.eq } : sp.col, function (changes) {
            var applied = false;
            changes.forEach(function (c) {
              if (c.local) return;
              var key = String(sp.group ? c.path : c.id);
              var doc = Object.assign({ _id: c.id, _path: c.path }, c.data);
              var map = snap[sp.name] || (snap[sp.name] = new Map());
              if (c.type === 'removed') { if (map.has(key)) { sp.remove(doc); map.delete(key); applied = true; } return; }
              var json = stable(canon(doc));
              if (map.get(key) === json) return;
              sp.upsert(doc); map.set(key, json); applied = true;
            });
            if (applied) s.afterRemote();
          }));
        });
        setState('', 'Synchronisé');
      },
      afterRemote: function () {
        if (opts.rebuild) opts.rebuild();
        clearTimeout(refreshTimer);
        var go = function () { if (modalOpen() || editing()) { refreshTimer = setTimeout(go, 2500); return; } if (opts.refresh) opts.refresh(); };
        refreshTimer = setTimeout(go, 500);
      },
      stop: function () { unsub.forEach(function (u) { try { u(); } catch (e) { } }); unsub = []; }
    };
  }

  /* ===================== Cycle de connexion d'un espace ===================== */
  function start(app) {
    var sync = null, booted = false, denied = null, curUid = null;
    function $(s) { return document.querySelector(s); }
    function showLogin() { loader(false); var l = document.getElementById('loginScreen'); if (l) l.style.display = ''; }
    function boot(user) {
      if (booted || (denied && user && denied === user.uid)) return Promise.resolve();
      booted = true; loader(true, 'Chargement de vos données…');
      return Store.claims().then(function (cl) {
        if (cl.role !== app.role || cl.orgId !== ORG) {
          booted = false; denied = user && user.uid;
          return Store.signOut().then(function () { showLogin(); loginError(app.role === 'fondateur' ? 'Ce compte n\'est pas un compte fondateur. Utilisez l\'espace pasteur de branche.' : 'Ce compte n\'est pas un compte de branche. Utilisez l\'espace fondateur.'); });
        }
        var ctx = { orgId: ORG, branchId: cl.branchId || null, user: user };
        return Promise.resolve(app.init(ctx)).then(function () {
          sync = createSync(app.specs(ctx), { rebuild: app.rebuild, refresh: app.refresh });
          return sync.loadAll();
        }).then(function () {
          if (app.afterLoad) app.afterLoad(ctx);
          window.__sentinelleSync = sync; curUid = user && user.uid;
          if (typeof window.doLogin === 'function') window.doLogin();
          sync.start(); loader(false);
        });
      }).catch(function (e) {
        console.error(e); booted = false; loader(false);
        Store.signOut().catch(function () { });
        showLogin(); loginError('Chargement impossible : ' + (e && e.message ? e.message : e));
      });
    }
    window.Sentinelle.login = function () {
      var em = ($('#lgEmail') || {}).value || '', pw = ($('#lgPwd') || {}).value || '';
      loginError(''); denied = null;
      if (!em.trim() || !pw) { loginError('Saisissez votre e-mail et votre mot de passe.'); return; }
      var btn = $('#loginScreen .btn-login'); if (btn) { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = 'Connexion…'; }
      Store.signIn(em.trim(), pw).then(function (u) { return boot(u); })
        .catch(function (e) { loginError(frErr(e)); })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.t || 'Se connecter'; } });
    };
    window.Sentinelle.forgot = function () {
      var em = (($('#lgEmail') || {}).value || '').trim();
      if (!em) { loginError('Saisissez d\'abord votre e-mail, puis cliquez sur « Mot de passe oublié ».'); return; }
      Store.resetPassword(em).then(function () { loginError(''); alert('Un e-mail de réinitialisation vient d\'être envoyé à ' + em + '.'); }).catch(function (e) { loginError(frErr(e)); });
    };
    window.Sentinelle.resetDemo = function () {
      if (!confirm('Remettre toutes les données de démonstration à leur état de départ ?\nLes modifications faites par vous et par les pasteurs seront effacées.')) return;
      loader(true, 'Réinitialisation en cours… (environ 20 secondes)');
      Store.idToken().then(function (t) { return fetch('/api/reset-demo', { method: 'POST', headers: { 'Authorization': 'Bearer ' + t } }); })
        .then(function (r) { return r.json().catch(function () { return { ok: false, erreur: 'Réponse inattendue du serveur' }; }); })
        .then(function (j) { loader(false); if (j.ok) { alert('Démonstration réinitialisée (' + j.documents + ' documents).'); location.reload(); } else alert('La réinitialisation a échoué : ' + (j.erreur || 'erreur inconnue')); })
        .catch(function (e) { loader(false); alert('La réinitialisation a échoué : ' + (e && e.message ? e.message : e)); });
    };
    window.doLogout = function () {
      try { if (sync) { sync.flush(); sync.stop(); } } catch (e) { }
      Store.signOut().then(function () { location.href = '/'; });
    };
    var pw = $('#lgPwd'); if (pw) pw.addEventListener('keydown', function (e) { if (e.key === 'Enter') window.Sentinelle.login(); });
    var em = $('#lgEmail'); if (em) em.addEventListener('keydown', function (e) { if (e.key === 'Enter') window.Sentinelle.login(); });
    loader(true, 'Vérification de votre session…');
    Store.init().then(function () {
      var settled = false;
      return Store.onAuth(function (u) {
        if (curUid && (!u || u.uid !== curUid)) { location.reload(); return; }   // la session a changé dans un autre onglet
        if (u && !booted) boot(u); else if (!u && !settled) { settled = true; showLogin(); }
      });
    }).catch(function (e) { console.error(e); showLogin(); loginError('Impossible de joindre Firebase. Vérifiez la configuration (public/js/firebase-config.js).'); });
  }

  window.Sentinelle = { ORG: ORG, Store: Store, createSync: createSync, start: start, loader: loader, login: function () { }, forgot: function () { } };
})();
