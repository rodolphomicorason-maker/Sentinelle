/*  Espace pasteur de branche : chargement et enregistrement des données de SA branche. */
(function () {
  'use strict';
  var S = window.Sentinelle, ORG = S.ORG, B = null;
  var base = function () { return 'orgs/' + ORG + '/branches/' + B; };
  function strip(d) { var o = Object.assign({}, d); delete o._id; delete o._path; return o; }
  function replaceAll(arr, items) { arr.length = 0; items.forEach(function (x) { arr.push(x); }); }
  function upsertBy(arr, key, item) { var i = arr.findIndex(function (x) { return String(x[key]) === String(item[key]); }); if (i >= 0) arr[i] = item; else arr.push(item); }
  function removeBy(arr, key, id) { var i = arr.findIndex(function (x) { return String(x[key]) === String(id); }); if (i >= 0) arr.splice(i, 1); }
  function num(s) { var m = String(s).match(/(\d+)\s*$/); return m ? +m[1] : 0; }
  function sortNum(arr, key) { arr.sort(function (a, b) { return num(a[key]) - num(b[key]); }); }

  /* collection simple : tableau en mémoire <-> sous-collection Firestore */
  function simple(name, arr, key) {
    return {
      name: name, col: function () { return base() + '/' + name; }, persist: true, live: true,
      read: function () { return arr; }, idOf: function (x) { return x[key]; },
      toDoc: function (x) { var o = Object.assign({}, x); delete o._id; delete o._path; return o; },
      path: function (id) { return base() + '/' + name + '/' + id; },
      load: function (docs) { replaceAll(arr, docs.map(strip)); sortNum(arr, key); },
      upsert: function (d) { upsertBy(arr, key, strip(d)); sortNum(arr, key); },
      remove: function (d) { removeBy(arr, key, d._id); }
    };
  }

  window.__branchSpecs = function (ctx) {
    B = ctx.branchId;
    var colOf = function (sp) { sp.col = sp.col(); return sp; };
    var specs = [];

    /* 1. identité de la branche et effectifs (document de la branche) */
    specs.push({
      name: 'stats', single: 'stats', col: base(), persist: true, merge: true, noDelete: true, live: false,
      read: function () { return [{ id: 'stats' }]; }, idOf: function () { return 'stats'; },
      toDoc: function () { return { members: { total: MEMBER_TOTALS.total, m: MEMBER_TOTALS.h, f: MEMBER_TOTALS.f, jeunes: MEMBER_TOTALS.jeunes, enfants: MEMBER_TOTALS.enfants, nouveaux: MEMBER_TOTALS.nouveaux }, baptises: MEMBER_TOTALS.baptises }; },
      path: function () { return base(); },
      load: function (docs) {
        var d = docs[0]; if (!d) throw new Error('Branche introuvable : ' + B);
        var p = d.pastor || {};
        Object.assign(BRANCH, { id: d.id, orgName: d.orgName || 'Église de la Grâce', name: d.name, city: d.city, quartier: d.quartier, address: d.address, phone: d.phone, email: d.email, logoInitials: d.logoInitials || 'EG', pastor: { name: p.name, fn: d.pastorFn || 'Pasteur de la branche', phone: p.phone, email: p.email } });
        var m = d.members || {}; Object.assign(MEMBER_TOTALS, { total: m.total, h: m.m, f: m.f, jeunes: m.jeunes, enfants: m.enfants, nouveaux: m.nouveaux, baptises: d.baptises });
      },
      upsert: function () { }, remove: function () { }
    });

    specs.push(colOf(simple('members', MEMBERS, 'mat')));

    /* 2. activités : l'état du rapport est stocké dans le document de l'activité (champ _report) */
    var act = simple('activities', ACTIVITIES, 'id');
    act.toDoc = function (a) { var o = Object.assign({}, a); delete o._id; delete o._path; o._report = REPORT_STATE[a.id] || null; return o; };
    act.load = function (docs) {
      replaceAll(ACTIVITIES, []); Object.keys(REPORT_STATE).forEach(function (k) { delete REPORT_STATE[k]; });
      docs.forEach(function (d) { var a = strip(d); if (a._report) REPORT_STATE[a.id] = a._report; delete a._report; ACTIVITIES.push(a); }); sortNum(ACTIVITIES, 'id');
    };
    act.upsert = function (d) { var a = strip(d); if (a._report) REPORT_STATE[a.id] = a._report; else delete REPORT_STATE[a.id]; delete a._report; upsertBy(ACTIVITIES, 'id', a); sortNum(ACTIVITIES, 'id'); };
    act.remove = function (d) { removeBy(ACTIVITIES, 'id', d._id); delete REPORT_STATE[d._id]; };
    specs.push(colOf(act));

    specs.push(colOf(simple('finOps', FIN_OPERATIONS, 'id')));
    specs.push(colOf(simple('genReports', REPORTS_GENERAUX, 'id')));
    specs.push(colOf(simple('transmitted', OTHER_TRANSMITTED_REPORTS, 'id')));
    specs.push(colOf(simple('branchUsers', BRANCH_USERS, 'id')));

    /* 3. journal des actions (les nouvelles entrées reçoivent un identifiant et un numéro d'ordre) */
    var au = simple('audit', AUDIT_LOG, '_id');
    au.ensureId = function (it) { if (!it._id) { it._id = 'au' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); it.seq = Date.now(); } };
    au.toDoc = function (x) { var o = Object.assign({}, x); delete o._id; delete o._path; return o; };
    var sortAudit = function () { AUDIT_LOG.sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); }); };
    au.load = function (docs) { replaceAll(AUDIT_LOG, docs.map(function (d) { var o = strip(d); o._id = d._id; return o; })); sortAudit(); };
    au.upsert = function (d) { var o = strip(d); o._id = d._id; upsertBy(AUDIT_LOG, '_id', o); sortAudit(); };
    au.remove = function (d) { removeBy(AUDIT_LOG, '_id', d._id); };
    specs.push(colOf(au));
    /* 4. relances envoyées par le fondateur (lecture seule) */
    specs.push({
      name: 'relances', col: 'orgs/' + ORG + '/relances', eq: { field: 'branchId', value: B }, persist: false, live: true,
      read: function () { return RELANCES; }, idOf: function (x) { return x._id; }, toDoc: function (x) { var o = Object.assign({}, x); delete o._id; delete o._path; return o; },
      load: function (docs) { replaceAll(RELANCES, docs.map(function (d) { var o = strip(d); o._id = d._id; return o; })); RELANCES.sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); }); },
      upsert: function (d) { var o = strip(d); o._id = d._id; var isNew = !RELANCES.some(function (x) { return x._id === d._id; }); upsertBy(RELANCES, '_id', o); RELANCES.sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); }); if (isNew && typeof toast === 'function') toast('Nouvelle relance du fondateur : ' + (o.message || '')); },
      remove: function (d) { removeBy(RELANCES, '_id', d._id); }
    });
    return specs;
  };
  var RELANCES = [];
  function hookNotifications() {
    if (typeof buildNotifs !== 'function' || window.__relHook) return; window.__relHook = true;
    var orig = buildNotifs;
    window.buildNotifs = buildNotifs = function () {
      var L = orig();
      RELANCES.slice().reverse().forEach(function (r) { L.unshift({ id: 'rel_' + r._id, k: 'alert', ic: 'info', t: 'Relance du fondateur', d: r.message || 'Merci de transmettre votre rapport.', w: r.sentOn || '', go: function () { goTo('reports'); } }); });
      return L;
    };
  }

  S.start({
    role: 'pasteur',
    init: function () { },
    specs: function (ctx) { return window.__branchSpecs(ctx); },
    afterLoad: function () { hookNotifications(); if (typeof normalizeDataDates === 'function') { try { normalizeDataDates(); } catch (e) { } } },
    rebuild: function () { if (typeof normalizeDataDates === 'function') { try { normalizeDataDates(); } catch (e) { } } try { ntBadge(); } catch (e) { } },
    refresh: function () { try { goTo(CURRENT, CURRENT_PARAM); } catch (e) { } }
  });
})();
