/*  Espace fondateur : chargement des données de toutes les branches, enregistrement des actions du fondateur,
    mises à jour en direct quand un pasteur enregistre ou transmet quelque chose. */
(function () {
  'use strict';
  var S = window.Sentinelle, ORG = S.ORG, Store = S.Store, O = 'orgs/' + ORG;
  var CODE = { 'cotonou': '', 'porto-novo': 'PN', 'parakou': 'PK', 'abomey-calavi': 'AC' };
  var G = { members: [], activities: [], finOps: [], genReports: [] };   // données brutes de toutes les branches
  var DERIVED_BRANCH = ['activitiesThisMonth', 'lastReport'];

  function strip(d) { var o = Object.assign({}, d); delete o._id; delete o._path; return o; }
  function replaceAll(arr, items) { arr.length = 0; items.forEach(function (x) { arr.push(x); }); }
  function upsertBy(arr, key, item) { var i = arr.findIndex(function (x) { return String(x[key]) === String(item[key]); }); if (i >= 0) arr[i] = item; else arr.push(item); }
  function removeBy(arr, key, id) { var i = arr.findIndex(function (x) { return String(x[key]) === String(id); }); if (i >= 0) arr.splice(i, 1); }
  function num(s) { var m = String(s).match(/(\d+)\s*$/); return m ? +m[1] : 0; }
  function branchOf(path) { return String(path).split('/')[3]; }

  /* ---------- dates ---------- */
  var MS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  var ML = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function p2(n) { return String(n).padStart(2, '0'); }
  function parseFr(s) {
    var n = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
    if (n) return { iso: n[3] + '-' + p2(+n[2]) + '-' + p2(+n[1]), h: n[4] ? +n[4] : 0, mi: n[5] ? +n[5] : 0 };
    var m = String(s || '').match(/(\d{1,2})\s+([a-zéû\.]+)\s+(\d{4})(?:[,\s·]+(\d{1,2})h(\d{2}))?/i); if (!m) return null;
    var k = m[2].toLowerCase().replace('.', ''), i = MS.findIndex(function (x) { return k.indexOf(x.slice(0, 3)) === 0; });
    if (i < 0) return null;
    return { iso: m[3] + '-' + p2(i + 1) + '-' + p2(+m[1]), h: m[4] ? +m[4] : 0, mi: m[5] ? +m[5] : 0 };
  }
  function frS(iso) { var d = new Date(iso + 'T12:00:00'); return d.getDate() + ' ' + MS[d.getMonth()] + (d.getMonth() === 2 || d.getMonth() === 4 || d.getMonth() === 5 || d.getMonth() === 7 ? '' : '.') + ' ' + d.getFullYear(); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
  function todayISO() { var d = (typeof _now === 'function') ? _now() : new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }

  /* ---------- collections de l'organisation (le fondateur lit et écrit) ---------- */
  function orgColl(name, arr, key, extra) {
    var sp = {
      name: name, col: O + '/' + name, persist: true, live: true,
      read: function () { return arr(); }, idOf: function (x) { return x[key]; },
      toDoc: function (x) { var o = Object.assign({}, x); delete o._id; delete o._path; return o; },
      path: function (id) { return O + '/' + name + '/' + id; },
      load: function (docs) { var a = arr(); replaceAll(a, docs.map(strip)); if (key !== '_id') a.sort(function (x, y) { return num(x[key]) - num(y[key]); }); },
      upsert: function (d) { var a = arr(); upsertBy(a, key, strip(d)); if (key !== '_id') a.sort(function (x, y) { return num(x[key]) - num(y[key]); }); },
      remove: function (d) { removeBy(arr(), key, d._id); }
    };
    return Object.assign(sp, extra || {});
  }

  function specs() {
    var list = [];
    /* organisation : informations + droits d'accès + données des graphiques */
    list.push({
      name: 'org', single: 'org', col: O, persist: true, merge: true, noDelete: true, live: false,
      read: function () { return [{ id: 'org' }]; }, idOf: function () { return 'org'; },
      toDoc: function () { return { meta: { rights: DATA.rights } }; }, path: function () { return O; },
      load: function (docs) {
        var d = docs[0] || {}, meta = d.meta || {}, o = strip(d); delete o.meta; delete o.seededAt;
        Object.assign(DATA.org, o);
        replaceAll(DATA.rights, meta.rights || []);
        DATA.memberGrowth = meta.memberGrowth || []; DATA.participationEvolution = meta.participationEvolution || []; DATA.activitiesByType = meta.activitiesByType || [];
      },
      upsert: function () { }, remove: function () { }
    });
    /* Églises branches : les champs calculés ne sont jamais enregistrés */
    list.push(orgColl('branches', function () { return DATA.branches; }, 'id', {
      toDoc: function (x) { var o = Object.assign({}, x); delete o._id; delete o._path; DERIVED_BRANCH.forEach(function (k) { delete o[k]; }); return o; },
      load: function (docs) { replaceAll(DATA.branches, docs.map(strip)); DATA.branches.sort(function (a, b) { return String(a.code).localeCompare(String(b.code)); }); },
      upsert: function (d) { upsertBy(DATA.branches, 'id', strip(d)); DATA.branches.sort(function (a, b) { return String(a.code).localeCompare(String(b.code)); }); }
    }));
    list.push(orgColl('pastors', function () { return DATA.pastors; }, 'id'));
    list.push(orgColl('orgUsers', function () { return DATA.users; }, 'id'));
    list.push(orgColl('events', function () { return DATA.events; }, 'id'));
    list.push(orgColl('monthly', function () { return DATA.monthly; }, 'id'));
    /* journal du fondateur : les nouvelles entrées reçoivent un identifiant et un numéro d'ordre */
    var sortAudit = function () { DATA.auditLog.sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); }); };
    list.push(orgColl('audit', function () { return DATA.auditLog; }, '_id', {
      ensureId: function (it) { if (!it._id) { it._id = 'au' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); it.seq = Date.now(); } },
      load: function (docs) { replaceAll(DATA.auditLog, docs.map(function (d) { var o = strip(d); o._id = d._id; return o; })); sortAudit(); },
      upsert: function (d) { var o = strip(d); o._id = d._id; upsertBy(DATA.auditLog, '_id', o); sortAudit(); }
    }));
    /* données de toutes les branches : lecture seule, mises à jour en direct */
    ['members', 'activities', 'finOps', 'genReports'].forEach(function (g) {
      list.push({
        name: 'g_' + g, group: g, persist: false, live: true, alwaysApply: true,
        read: function () { return G[g]; }, idOf: function (x) { return x._path; }, toDoc: function (x) { var o = Object.assign({}, x); delete o._path; delete o._b; delete o._id; return o; },
        load: function (docs) { replaceAll(G[g], docs.map(function (d) { var o = strip(d); o._path = d._path; o._b = branchOf(d._path); o._id = d._id; return o; })); },
        upsert: function (d) { var o = strip(d); o._path = d._path; o._b = branchOf(d._path); o._id = d._id; upsertBy(G[g], '_path', o); },
        remove: function (d) { removeBy(G[g], '_path', d._path); }
      });
    });
    return list;
  }

  /* ---------- données calculées pour les écrans du fondateur ---------- */
  function rebuild() {
    var bid = {}; DATA.branches.forEach(function (b) { bid[b.id] = b; });
    var active = function (b) { return bid[b] && bid[b].status === 'active'; };
    // membres (vue consolidée)
    DATA.membersList = G.members.filter(function (m) { return (m.status || 'actif') === 'actif' && bid[m._b]; }).map(function (m) {
      var c = CODE[m._b]; return { id: c ? c + '-' + m.mat : m.mat, nom: m.nom, sexe: m.sexe, age: m.age, tel: m.tel, profession: m.profession, quartier: m.quartier, date: m.dateIntegration, bapt: !!m.baptise, statut: m.statut, branchId: m._b };
    }).sort(function (a, b) { return a.branchId === b.branchId ? num(a.id) - num(b.id) : (bid[a.branchId].code < bid[b.branchId].code ? -1 : 1); });
    // opérations financières
    DATA.ops = G.finOps.filter(function (o) { return bid[o._b]; }).map(function (o) {
      return { id: o._b + '-' + o.id, branchId: o._b, date: o.date, type: o.type, categorie: o.categorie, montant: o.montant, description: o.description, mode: o.mode, reference: o.reference, dateISO: o.dateISO };
    }).sort(function (a, b) { return b.dateISO.localeCompare(a.dateISO); });
    var R = DATA.ops.filter(function (o) { return o.type === 'recette'; }).reduce(function (a, o) { return a + o.montant; }, 0),
      D = DATA.ops.filter(function (o) { return o.type === 'depense'; }).reduce(function (a, o) { return a + o.montant; }, 0);
    DATA.finances = { recettes: R, depenses: D, solde: R - D, devise: 'FCFA', parBranche: DATA.branches.map(function (b) { return { branche: b.city, recettes: DATA.ops.filter(function (o) { return o.branchId === b.id && o.type === 'recette'; }).reduce(function (a, o) { return a + o.montant; }, 0), depenses: DATA.ops.filter(function (o) { return o.branchId === b.id && o.type === 'depense'; }).reduce(function (a, o) { return a + o.montant; }, 0) }; }) };
    // rapports de culte : calculés à partir des activités de chaque branche
    var today = todayISO(), reports = [];
    G.activities.forEach(function (a) {
      if (a.type !== 'Culte' || a.statut !== 'terminee' || !bid[a._b]) return;
      var r = a._report, e = a.effectif || {}, cr = a.compteRendu || {}, pastor = bid[a._b].pastor ? bid[a._b].pastor.name : '';
      var rep = { id: 'rc_' + a._b + '_' + a.id, date: frS(a.dateISO), dateISO: a.dateISO, type: 'Rapport de culte', activity: a.intitule, branchId: a._b, pastor: pastor, status: '', transmittedOn: null, delai: '', participation: null, contenu: null };
      if (r && r.status === 'transmis') {
        var t = parseFr(r.transmisLe) || { iso: a.dateISO, h: 0, mi: 0 }, lag = Math.max(0, daysBetween(a.dateISO, t.iso));
        rep.status = lag === 0 ? 'recu' : 'retard'; rep.delai = lag === 0 ? 'À temps' : lag + ' jour' + (lag > 1 ? 's' : '') + ' de retard';
        rep.transmittedOn = frS(t.iso) + ' · ' + p2(t.h) + 'h' + p2(t.mi);
        rep.participation = { total: e.total || 0, h: e.h || 0, f: e.f || 0, j: e.j || 0, e: e.e || 0 };
        rep.contenu = { orateur: a.orateur || pastor, theme: a.titreMessage || '', reference: a.reference || '', deroulement: cr.deroulement || '', faits: [cr.points, cr.resultats].filter(Boolean).join(' '), difficultes: cr.difficultes || '', recommandations: cr.recommandations || '', observations: cr.observations || '' };
      } else {
        var days = daysBetween(a.dateISO, today); if (days < 1) return;
        rep.status = 'manquant'; rep.delai = days + ' jour' + (days > 1 ? 's' : '') + ' de retard';
      }
      reports.push(rep);
    });
    // rapports mensuels du mois précédent
    var now = new Date(), pm = new Date(now.getFullYear(), now.getMonth() - 1, 1, 12), lab = ML[pm.getMonth()].charAt(0).toUpperCase() + ML[pm.getMonth()].slice(1) + ' ' + pm.getFullYear();
    var first = pm.getFullYear() + '-' + p2(pm.getMonth() + 1) + '-01';
    DATA.branches.forEach(function (b) {
      var rg = G.genReports.filter(function (g) { return g._b === b.id && g.type === 'Mensuel' && g.periode === lab; })[0];
      var ok = rg && rg.statut === 'transmis', t = ok ? parseFr(rg.transmisLe) : null;
      reports.push({ id: 'rm_' + b.id, date: lab, dateISO: first, type: 'Rapport mensuel', activity: 'Synthèse du mois', branchId: b.id, pastor: b.pastor ? b.pastor.name : '', status: ok ? 'recu' : 'attente', transmittedOn: ok && t ? frS(t.iso) : null, delai: ok ? 'À temps' : 'En attente', participation: null, contenu: ok && rg.contenu ? rg.contenu : null });
    });
    reports.sort(function (a, b) { return a.type === b.type ? b.dateISO.localeCompare(a.dateISO) : (a.type === 'Rapport de culte' ? -1 : 1); });
    replaceAll(DATA.reports, reports);
    // indicateurs par branche
    var ym = today.slice(0, 7);
    DATA.branches.forEach(function (b) {
      b.activitiesThisMonth = G.activities.filter(function (a) { return a._b === b.id && a.statut === 'terminee' && String(a.dateISO).slice(0, 7) === ym; }).length;
      var cultes = DATA.reports.filter(function (r) { return r.branchId === b.id && r.type === 'Rapport de culte'; });
      var last = cultes[0];
      b.lastReport = last ? { label: 'Culte du ' + last.date, status: last.status } : { label: 'Aucun rapport', status: 'manquant' };
    });
  }

  function hookRelances() {
    ['relance', 'relanceSun'].forEach(function (fn) {
      var orig = window[fn]; if (typeof orig !== 'function' || orig.__hooked) return;
      var w = function () {
        var before = DATA.auditLog.length, args = arguments, ret = orig.apply(this, args);
        var added = DATA.auditLog.slice(0, Math.max(0, DATA.auditLog.length - before + 0));
        var news = DATA.auditLog.filter(function (a) { return /^Relance envoyée à /.test(a.action) && !a._id; });
        var ops = []; var d = new Date();
        news.forEach(function (a) {
          var m = a.action.match(/\(([^)]+)\)\s*$/), city = m ? m[1] : '', br = DATA.branches.filter(function (b) { return b.city === city; })[0]; if (!br) return;
          var last = DATA.reports.filter(function (r) { return r.branchId === br.id && r.type === 'Rapport de culte' && r.status === 'manquant'; })[0];
          var id = 'rel' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
          ops.push({ op: 'set', path: O + '/relances/' + id, data: { branchId: br.id, reportId: last ? last.id : null, pastor: br.pastor ? br.pastor.name : '', message: last ? 'Votre rapport de culte du ' + last.date + ' n\'a pas encore été transmis. Merci de le transmettre dès que possible.' : 'Merci de transmettre votre rapport de culte.', from: DATA.org.founder, sentOn: 'Aujourd\'hui, ' + p2(d.getHours()) + 'h' + p2(d.getMinutes()), seq: Date.now() } });
        });
        if (ops.length) Store.commit(ops).catch(function (e) { console.error('Relance non envoyée', e); });
        return ret;
      };
      w.__hooked = true; window[fn] = w;
    });
  }
  S.start({
    role: 'fondateur',
    init: function () { },
    specs: function () { return specs(); },
    afterLoad: function () { rebuild(); hookRelances(); },
    rebuild: rebuild,
    refresh: function () { try { goTo(CURRENT, CURRENT_PARAM); } catch (e) { } }
  });
})();
