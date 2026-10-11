'use strict';
/* Générateur du jeu de données de démonstration Sentinelle.
   Toutes les dates sont calculées par rapport à la date de référence (par défaut : aujourd'hui),
   pour que la démo paraisse toujours à jour après une réinitialisation. */
const base = require('./base.json');
const ORG = 'egdlg';

/* ---------- outils ---------- */
function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOIS_L = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const pad = n => String(n).padStart(2, '0');
const noon = d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
const addDays = (d, n) => { const x = noon(d); x.setDate(x.getDate() + n); return x; };
const isoOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const frS = d => d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
const frL = d => d.getDate() + ' ' + MOIS_L[d.getMonth()] + ' ' + d.getFullYear();
const hm = (h, m) => pad(h) + 'h' + pad(m || 0);
const stamp = (d, h, m) => frS(d) + ', ' + hm(h, m);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const round1000 = n => Math.round(n / 1000) * 1000;
const R = rng(20261009);
const pick = a => a[Math.floor(R() * a.length)];
const int = (a, b) => a + Math.floor(R() * (b - a + 1));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clean = o => JSON.parse(JSON.stringify(o, (k, v) => v === undefined ? null : v));

const FIRST_M = ['Koffi', 'Codjo', 'Sèna', 'Gbèdo', 'Rodrigue', 'Fidèle', 'Prosper', 'Séraphin', 'Armand', 'Bertin', 'Eustache', 'Hermann', 'Judicaël', 'Rolland', 'Cyriaque', 'Désiré', 'Thierry', 'Marius', 'Gérard', 'Honoré', 'Médard', 'Ulrich', 'Wilfried', 'Isidore', 'Alexis', 'Basile', 'Césaire', 'Dieudonné'];
const FIRST_F = ['Adjovi', 'Afi', 'Mariette', 'Chantal', 'Nadège', 'Rachelle', 'Judith', 'Grâce', 'Espérance', 'Prisca', 'Odile', 'Sylvie', 'Reine', 'Noëlle', 'Carine', 'Estelle', 'Flore', 'Gisèle', 'Henriette', 'Inès', 'Joëlle', 'Lydie', 'Mireille', 'Pélagie', 'Rosine', 'Solange', 'Tatiana', 'Victoire'];
const SURN = ['AGBENOU', 'ADJABLA', 'HOUNGBEDJI', 'SOSSOU', 'AGOSSOU', 'DOSSOU', 'TOKPO', 'GNONLONFOUN', 'AKAKPO', 'HOUNGBO', 'DANSOU', 'ZANNOU', 'HOUNSOU', 'SEMEVO', 'AVOCE', 'GBAGUIDI', 'ZINSOU', 'HOUEDJI', 'DEGLA', 'HOUNKPE', 'ALAPINI', 'BOKO', 'CAKPO', 'DJOSSOU', 'EZIN', 'FAGBEMI', 'GANDONOU', 'HINVI', 'IDOHOU', 'KIKI', 'LOKO', 'MEDENOU', 'NOUDEHOU', 'OLOU', 'QUENUM', 'SAGBO', 'TCHOMAKOU', 'VODOUNOU', 'YEHOUESSI'];
const PROF_M = ['Enseignant', 'Mécanicien', 'Comptable', 'Retraité', 'Enseignant', 'Mécanicien'];
const PROF_F = ['Commerçante', 'Infirmière', 'Couturière', 'Institutrice', 'Comptable', 'Coiffeuse', 'Commerçante'];
const THEMES = [['La persévérance dans la foi', 'Hébreux 12:1-3'], ['La puissance de la prière', 'Jacques 5:16'], ['Marcher dans la lumière', '1 Jean 1:7'], ['Le pardon qui libère', 'Matthieu 6:14'], ['Servir avec joie', 'Psaumes 100:2'], ['La foi qui agit', 'Jacques 2:17'], ['L\'unité dans le corps de Christ', '1 Corinthiens 12:12-27'], ['Persévérer dans la prière', 'Luc 18:1'], ['Le fruit de l\'Esprit', 'Galates 5:22-23'], ['Une espérance vivante', '1 Pierre 1:3']];
const CR_DER = ['Culte débuté avec un temps de louange, suivi de la prédication et d\'un temps de prière collective.', 'Louange, annonces, prédication puis moment de communion fraternelle.', 'Service conduit avec des chants de louange, message et prière pour les malades.'];
const CR_PTS = ['Plusieurs nouvelles familles présentes pour la première fois.', 'Forte mobilisation des membres.', 'Bonne participation des jeunes.', 'Chorale très appréciée.', 'Accueil chaleureux des visiteurs.'];
const CR_RES = ['Quelques nouveaux visiteurs enregistrés, dont certains souhaitent rejoindre l\'église.', 'Plusieurs témoignages partagés.', 'Deux décisions pour Christ.', 'Moment fort de communion.'];

/* ---------- configuration des quatre branches ---------- */
const CFG = {
  'cotonou': { init: 'CO', size: 230, fin: 1, baptises: 201, quartiers: ['Gbégamey', 'Fidjrossè', 'Akpakpa', 'Cadjehoun', 'Zogbo', 'Haie Vive', 'Agla'], sec: ['Béatrice Zossou', 'b.zossou@egdlg.org'], tres: ['Paul Ahouansou', 'p.ahouansou@egdlg.org'], h: [9, 0, 11, 30], culte: ['pending', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok'], prayerLeader: 'Béatrice Zossou', studyTeacher: 'Paul Ahouansou' },
  'porto-novo': { init: 'PN', size: 165, fin: .6, baptises: 150, quartiers: ['Houinmè', 'Ouando', 'Djassin', 'Tokpota', 'Attakè', 'Akron'], sec: ['Claire Ahoyo', 'c.ahoyo@egdlg.org'], tres: ['Ferdinand Sèdégan', 'f.sedegan@egdlg.org'], h: [9, 0, 11, 30], culte: ['late2', 'ok', 'late1', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok'], prayerLeader: 'Claire Ahoyo', studyTeacher: 'Ferdinand Sèdégan' },
  'parakou': { init: 'PK', size: 95, fin: .3, baptises: 70, quartiers: ['Titirou', 'Banikanni', 'Albarika', 'Zongo', 'Madina', 'Arafat'], sec: ['Rachida Bio', 'r.bio@egdlg.org'], tres: ['Tidjani Séko', 't.seko@egdlg.org'], h: [9, 30, 11, 30], culte: ['none', 'none', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok'], prayerLeader: 'Rachida Bio', studyTeacher: 'Tidjani Séko' },
  'abomey-calavi': { init: 'AC', size: 55, fin: .15, baptises: 45, quartiers: ['Godomey', 'Togoudo', 'Zinvié', 'Akassato', 'Tankpè'], sec: ['Sylvie Gnanvi', 's.gnanvi@egdlg.org'], tres: ['Eric Houssou', 'e.houssou@egdlg.org'], h: [8, 0, 10, 0], culte: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok'], prayerLeader: 'Sylvie Gnanvi', studyTeacher: 'Eric Houssou' }
};

/* ---------- membres ---------- */
function genMembers(ref, br, cfg) {
  const st = br.members, N = st.total;
  const out = [];
  const rem = { enf: st.enfants, jeu: st.jeunes, adu: N - st.enfants - st.jeunes, H: st.m, F: st.f, nouv: st.nouveaux, bapt: cfg.baptises };
  const cat = age => age < 12 ? 'Enfant' : age <= 25 ? 'Jeune' : 'Adulte';
  if (br.id === 'cotonou') base.branchMembersSample.forEach(m => {
    out.push(Object.assign({}, m));
    rem[m.categorie === 'Enfant' ? 'enf' : m.categorie === 'Jeune' ? 'jeu' : 'adu']--; rem[m.sexe === 'Homme' ? 'H' : 'F']--;
    if (m.statut === 'Nouveau converti') rem.nouv--; if (m.baptise) rem.bapt--;
  });
  const cats = shuffle([].concat(Array(Math.max(0, rem.enf)).fill('Enfant'), Array(Math.max(0, rem.jeu)).fill('Jeune'), Array(Math.max(0, rem.adu)).fill('Adulte')));
  const sexes = shuffle([].concat(Array(Math.max(0, rem.H)).fill('Homme'), Array(Math.max(0, rem.F)).fill('Femme')));
  const n = Math.min(cats.length, sexes.length);
  const idx = shuffle(Array.from({ length: n }, (_, i) => i));
  const nouvIdx = new Set(idx.filter(i => cats[i] !== 'Enfant').slice(0, Math.max(0, rem.nouv)));
  const baptIdx = new Set(idx.filter(i => !nouvIdx.has(i) && cats[i] !== 'Enfant' || (!nouvIdx.has(i) && cats[i] === 'Enfant' && R() < .3)).slice(0, Math.max(0, rem.bapt)));
  const created = new Date(br.created.replace(/(\d+) ([a-zéû\.]+) (\d{4})/i, (m, d, mo, y) => { const i = MOIS.findIndex(x => x.slice(0, 3) === mo.toLowerCase().slice(0, 3)); return y + '-' + pad(i + 1) + '-' + pad(+d); }) + 'T12:00:00');
  for (let k = 0; k < n; k++) {
    const sexe = sexes[k], c = cats[k], age = c === 'Enfant' ? int(3, 11) : c === 'Jeune' ? int(12, 25) : int(26, 72);
    const prenom = pick(sexe === 'Homme' ? FIRST_M : FIRST_F), nom = prenom + ' ' + pick(SURN);
    const nais = addDays(ref, -(age * 365 + int(0, 360)));
    const nouv = nouvIdx.has(k);
    let integ = nouv ? addDays(ref, -int(8, 85)) : addDays(ref, -int(100, Math.max(160, Math.round((ref - created) / 864e5) - 30)));
    if (integ < created) integ = addDays(created, int(5, 200));
    const mat = 'MEM-' + pad(out.length + 1).padStart(3, '0');
    const dep = c === 'Enfant' ? 'Groupe Enfants' : c === 'Jeune' ? 'Groupe Jeunes' : pick(['Groupe 1', 'Groupe 2', 'Groupe 3']);
    const prof = c === 'Enfant' ? 'Élève' : c === 'Jeune' ? pick(['Élève', 'Étudiant', 'Étudiant']) : pick(sexe === 'Homme' ? PROF_M : PROF_F);
    const mat2 = c === 'Adulte' ? (sexe === 'Homme' ? pick(['Marié', 'Marié', 'Marié', 'Célibataire']) : pick(['Mariée', 'Mariée', 'Célibataire', 'Veuve', 'Divorcée'])) : 'Célibataire';
    out.push({ mat, nom, sexe, age, naissance: frL(nais).replace(/(\d+) (\S+) (\d+)/, (m, d, mo, y) => d + ' ' + mo + ' ' + y), tel: '+229 01 ' + pick(['97', '95', '96', '94', '90', '91']) + ' ' + pad(int(10, 99)) + ' ' + pad(int(10, 99)) + ' ' + pad(int(10, 99)), profession: prof, quartier: pick(cfg.quartiers), dateIntegration: frS(integ), baptise: baptIdx.has(k), departement: dep, statut: nouv ? 'Nouveau converti' : 'Membre', matrimonial: mat2, categorie: c, status: 'actif', naissanceISO: isoOf(nais), dateIntegrationISO: isoOf(integ) });
  }
  return out;
}

/* ---------- génération d'une branche ---------- */
function genBranch(ref, br) {
  const cfg = CFG[br.id], past = br.pastor.name, T = noon(ref), dow = T.getDay();
  const S0 = dow === 0 ? addDays(T, -7) : addDays(T, -dow);
  const acts = [], ops = [];
  let n = 0; const id = () => 'a' + (++n);
  const eff = (total, withVis) => { const h = Math.round(total * .46), f = Math.round(total * .42), j = Math.round(total * .08), e = total - h - f - j; const o = { total, h, f, j, e }; if (withVis) o.visiteurs = int(2, 9); return o; };
  const cr = () => ({ deroulement: pick(CR_DER), points: pick(CR_PTS), resultats: pick(CR_RES), difficultes: 'Aucune difficulté majeure signalée.', recommandations: 'Aucune recommandation particulière.', observations: 'Bonne ambiance générale.' });
  const base_ = (type, intitule, d, h, lieu, resp, extra) => Object.assign({ id: id(), type, intitule, date: frS(d), heureDebut: hm(h[0], h[1]), heureFin: hm(h[2], h[3]), lieu, responsable: resp }, extra, { dateISO: isoOf(d) });
  const fac = [1, .98, 1.03, .99, .95, 1.04, .94, .97, .96];
  // cultes
  cfg.culte.forEach((outcome, i) => {
    const d = addDays(S0, -7 * i), th = THEMES[(i + br.code.length) % THEMES.length], total = Math.round(cfg.size * fac[i] * (1 + (R() - .5) * .04));
    const guest = i === 3;
    const jeune = i === 4 && br.id === 'cotonou';
    const a = base_('Culte', jeune ? 'Culte de jeûne' : 'Culte dominical', d, [cfg.h[0], cfg.h[1], cfg.h[2] + (jeune ? 1 : 0), cfg.h[3]], 'Temple de l\'église', past, { orateur: guest ? 'Pasteur invité' : past, titreMessage: jeune ? 'La puissance du jeûne' : th[0], reference: jeune ? 'Ésaïe 58:6' : th[1], effectif: eff(total, true), statut: 'terminee', compteRendu: cr(), creeParr: past, creeLe: stamp(d, cfg.h[0] - 1, 0), modifieLe: stamp(d, 13, 10) });
    a._o = outcome; acts.push(a);
  });
  acts.push(Object.assign(base_('Culte', 'Culte dominical', addDays(S0, 7), [cfg.h[0], cfg.h[1], cfg.h[2], cfg.h[3]], 'Temple de l\'église', past, { orateur: 'À confirmer', titreMessage: '', reference: '', effectif: null, statut: 'programmee', compteRendu: null, creeParr: past, creeLe: stamp(addDays(S0, -3), 10, 0), modifieLe: stamp(addDays(S0, -3), 10, 0) })));
  // prières du mercredi
  const sinceWed = (dow - 3 + 7) % 7;
  for (let i = 0; i < 6; i++) {
    const d = addDays(T, -(sinceWed + 7 * i)); const today = sinceWed === 0 && i === 0;
    const th = THEMES[(i * 3 + 1) % THEMES.length];
    const a = base_('Réunion de prière', 'Réunion de prière du mercredi', d, [19, 0, 21, 0], 'Salle principale', cfg.prayerLeader, { animateur: cfg.prayerLeader, theme: ['Prière pour les familles', 'Prière pour la nation', 'Intercession pour l\'église', 'Prière pour les malades', 'Action de grâce', 'Prière pour les jeunes'][i], reference: th[1], effectif: today ? null : eff(Math.round(cfg.size * .28 * (1 + (R() - .5) * .1))), statut: today ? 'programmee' : 'terminee', compteRendu: today ? null : cr(), creeParr: cfg.prayerLeader, creeLe: stamp(d, 18, 30), modifieLe: stamp(d, 21, 15) });
    acts.push(a);
  }
  acts.push(base_('Réunion de prière', 'Réunion de prière du mercredi', addDays(T, -sinceWed + 7), [19, 0, 21, 0], 'Salle principale', cfg.prayerLeader, { animateur: cfg.prayerLeader, theme: 'Prière pour la nation', reference: '', effectif: null, statut: 'programmee', compteRendu: null, creeParr: cfg.prayerLeader, creeLe: stamp(addDays(T, -5), 10, 5), modifieLe: stamp(addDays(T, -5), 10, 5) }));
  // études bibliques du vendredi
  const sinceFri = (dow - 5 + 7) % 7;
  for (let i = 0; i < 4; i++) {
    const d = addDays(T, -((sinceFri === 0 ? 7 : sinceFri) + 7 * i)); const th = THEMES[(i * 2 + 4) % THEMES.length];
    acts.push(base_('Étude biblique', i === 0 ? 'Étude biblique - Les Psaumes' : 'Étude biblique du vendredi', d, [18, 0, 20, 0], 'Salle des jeunes', cfg.studyTeacher, { enseignant: cfg.studyTeacher, theme: i === 0 ? 'Les Psaumes de confiance' : th[0], reference: i === 0 ? 'Psaume 23' : th[1], effectif: eff(Math.round(cfg.size * .17 * (1 + (R() - .5) * .1))), statut: 'terminee', compteRendu: cr(), creeParr: cfg.studyTeacher, creeLe: stamp(d, 17, 0), modifieLe: stamp(d, 20, 10) }));
  }
  acts.push(base_('Étude biblique', 'Étude biblique du vendredi', addDays(T, (sinceFri === 0 ? 0 : 7 - sinceFri)), [18, 0, 20, 0], 'Salle des jeunes', cfg.studyTeacher, { enseignant: cfg.studyTeacher, theme: 'À définir', reference: '', effectif: null, statut: 'programmee', compteRendu: null, creeParr: cfg.studyTeacher, creeLe: stamp(addDays(T, -6), 9, 0), modifieLe: stamp(addDays(T, -6), 9, 0) }));
  // autres
  const dv = addDays(S0, -21);
  acts.push(base_('Autres', 'Visite aux malades', dv, [8, 0, 12, 0], 'Dans la ville', past, { intervenant: 'Équipe d\'évangélisation', theme: 'Encouragement et prière', effectif: { total: Math.round(cfg.size * .05), h: Math.round(cfg.size * .02), f: Math.round(cfg.size * .03), j: 0, e: 0 }, statut: 'terminee', compteRendu: { deroulement: 'Visite de plusieurs familles du quartier, prières et distribution de vivres.', points: 'Accueil chaleureux des familles visitées.', resultats: 'Deux familles ont exprimé le souhait de venir au culte.', difficultes: 'Circulation difficile dans certains quartiers.', recommandations: 'Prévoir un véhicule dédié la prochaine fois.', observations: 'Aucune observation particulière.' }, creeParr: past, creeLe: stamp(dv, 7, 30), modifieLe: stamp(dv, 12, 30) }));
  const dc = addDays(S0, -14);
  acts.push(base_('Autres', 'Veillée de prière annulée', dc, [22, 0, 2, 0], 'Temple de l\'église', past, { intervenant: 'Non désigné', theme: 'Veillée mensuelle', effectif: null, statut: 'annulee', compteRendu: null, creeParr: past, creeLe: stamp(addDays(dc, -4), 9, 0), modifieLe: stamp(addDays(dc, -1), 16, 0), motifAnnulation: 'Coupure électrique générale dans le quartier' }));
  acts.push(base_('Autres', 'Journée d\'évangélisation', addDays(T, 12), [8, 0, 13, 0], 'Marché du quartier', past, { intervenant: 'Équipe d\'évangélisation', theme: 'Évangélisation de proximité', effectif: null, statut: 'programmee', compteRendu: null, creeParr: past, creeLe: stamp(addDays(T, -2), 10, 0), modifieLe: stamp(addDays(T, -2), 10, 0) }));

  // état des rapports
  acts.forEach(a => {
    const o = a._o; delete a._o; a._report = null;
    if (a.statut !== 'terminee') return;
    const d = new Date(a.dateISO + 'T12:00:00'), p = past;
    const mk = (lag, hv) => ({ status: 'transmis', genereLe: stamp(d, 13, 10), valideLe: stamp(addDays(d, lag), hv, 0), valideParr: p, transmisLe: stamp(addDays(d, lag), hv, 5) });
    if (a.type === 'Culte') {
      if (o === 'ok') a._report = mk(0, 14); else if (o === 'late1') a._report = mk(1, 9); else if (o === 'late2') a._report = mk(2, 9);
      else if (o === 'pending') a._report = { status: 'a_valider', genereLe: stamp(d, 13, 10) };
    } else { const age = Math.round((T - d) / 864e5); a._report = age > 8 ? mk(0, 21) : { status: 'a_valider', genereLe: stamp(addDays(d, 0), 21, 30) }; }
  });

  // finances
  const s = cfg.fin, rcN = { c: 40 }, dpN = { c: 17 };
  const addOp = (d, type, categorie, montant, description, mode, user, just) => { const y = d.getFullYear(); const ref_ = type === 'recette' ? 'RC-' + y + '-' + pad(++rcN.c).padStart(3, '0') : 'DP-' + y + '-' + pad(++dpN.c).padStart(3, '0'); ops.push({ date: frS(d), type, categorie, montant: round1000(montant), description, mode, reference: ref_, utilisateur: user, justificatif: just !== false, dateISO: isoOf(d) }); };
  for (let i = cfg.culte.length - 1; i >= 0; i--) {
    const d = addDays(S0, -7 * i), f = fac[i] * (.92 + R() * .16);
    addOp(d, 'recette', 'Dîmes', 480000 * s * f, 'Dîmes du culte dominical', 'Espèces', past);
    addOp(d, 'recette', 'Offrandes', 215000 * s * f, 'Offrande du culte dominical', 'Espèces', past);
    if (i % 2 === 1) addOp(d, 'recette', 'Actions de grâce', 130000 * s * f, 'Actions de grâce', 'Mobile Money', cfg.sec[0]);
    if (i % 4 === 2) addOp(d, 'recette', 'Dons', 90000 * s * f, 'Don d\'un membre bienfaiteur', 'Virement', cfg.tres[0]);
  }
  const monthsBack = [0, 1, 2];
  monthsBack.forEach(mb => {
    const m0 = new Date(T.getFullYear(), T.getMonth() - mb, 1, 12);
    const dd = day => { const x = new Date(m0.getFullYear(), m0.getMonth(), day, 12); return x; };
    const lbl = MOIS_L[m0.getMonth()] + ' ' + m0.getFullYear();
    const items = [[2, 'Électricité', 65000 * s, 'Facture SBEE, ' + lbl, 'Mobile Money', cfg.sec[0]], [3, 'Loyer', 150000 * s, 'Loyer de la salle', 'Virement', cfg.tres[0]], [5, 'Eau', 18000 * s, 'Facture SONEB, ' + lbl, 'Mobile Money', cfg.sec[0]], [9, 'Communication', 25000 * s, 'Crédit de communication', 'Mobile Money', cfg.tres[0]], [14, 'Entretien', 40000 * s, 'Entretien des locaux', 'Espèces', cfg.tres[0]]];
    items.forEach(([day, cat, amt, desc, mode, u]) => { const d = dd(day); if (d <= T) addOp(d, 'depense', cat, amt, desc, mode, u, !(mb === 0 && cat === 'Entretien')); });
  });
  ops.sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  ops.forEach((o, i) => o.id = 'f' + (i + 1));

  // rapports généraux
  const members = genMembers(ref, br, cfg);
  const monthWin = (y, m) => ({ s: isoOf(new Date(y, m, 1, 12)), e: isoOf(new Date(y, m + 1, 0, 12)) });
  const content = (y, m, label) => {
    const w = monthWin(y, m), A = acts.filter(a => a.statut === 'terminee' && a.dateISO >= w.s && a.dateISO <= w.e), O = ops.filter(o => o.dateISO >= w.s && o.dateISO <= w.e);
    const par = {}; A.forEach(a => par[a.type] = (par[a.type] || 0) + 1);
    const rec = O.filter(o => o.type === 'recette').reduce((x, o) => x + o.montant, 0), dep = O.filter(o => o.type === 'depense').reduce((x, o) => x + o.montant, 0);
    return { label, activitesCount: A.length, activitesParType: par, participation: A.reduce((x, a) => x + ((a.effectif || {}).total || 0), 0), recettes: rec, depenses: dep, solde: rec - dep, membresTotal: br.members.total };
  };
  const pm = new Date(T.getFullYear(), T.getMonth() - 1, 1, 12), pm2 = new Date(T.getFullYear(), T.getMonth() - 2, 1, 12);
  const lab = d => cap(MOIS_L[d.getMonth()]) + ' ' + d.getFullYear();
  const mon = addDays(S0, -6);
  const gen = [];
  gen.push({ id: 'rg1', periode: 'Semaine du ' + frS(mon) + ' au ' + frS(S0), type: 'Hebdomadaire', statut: 'a_valider', genereLe: frS(addDays(S0, 1)) });
  const m1ok = br.id !== 'parakou';
  gen.push(m1ok ? { id: 'rg2', periode: lab(pm), type: 'Mensuel', statut: 'transmis', genereLe: frS(new Date(T.getFullYear(), T.getMonth(), 2, 12)), valideLe: frS(new Date(T.getFullYear(), T.getMonth(), 3, 12)), valideParr: past, transmisLe: frS(new Date(T.getFullYear(), T.getMonth(), 3, 12)), contenu: content(pm.getFullYear(), pm.getMonth(), lab(pm)) }
    : { id: 'rg2', periode: lab(pm), type: 'Mensuel', statut: 'brouillon', genereLe: 'Non généré' });
  gen.push({ id: 'rg3', periode: lab(pm2), type: 'Mensuel', statut: 'transmis', genereLe: frS(new Date(pm.getFullYear(), pm.getMonth(), 2, 12)), valideLe: frS(new Date(pm.getFullYear(), pm.getMonth(), 3, 12)), valideParr: past, transmisLe: frS(new Date(pm.getFullYear(), pm.getMonth(), 3, 12)), contenu: content(pm2.getFullYear(), pm2.getMonth(), lab(pm2)) });
  const q = Math.floor(T.getMonth() / 3) + 1;
  gen.push({ id: 'rg4', periode: (q === 1 ? '1er' : q + 'e') + ' trimestre ' + T.getFullYear(), type: 'Trimestriel', statut: 'brouillon', genereLe: 'Non généré' });
  const transmitted = [{ id: 'rt1', type: 'Rapport mensuel', titre: 'Rapport mensuel - ' + lab(pm2), date: lab(pm2), valideLe: frS(new Date(pm.getFullYear(), pm.getMonth(), 3, 12)), valideParr: past, transmisLe: frS(new Date(pm.getFullYear(), pm.getMonth(), 3, 12)) }];

  // utilisateurs et journal de la branche
  const users = [{ id: 'u1', nom: past, fn: 'Pasteur de la branche', email: br.pastor.email, role: 'Administrateur', statut: 'actif', derniereConnexion: 'Aujourd\'hui, 08h12' }, { id: 'u2', nom: cfg.sec[0], fn: 'Secrétaire', email: cfg.sec[1], role: 'Utilisateur', statut: 'actif', derniereConnexion: 'Hier, 19h40' }, { id: 'u3', nom: cfg.tres[0], fn: 'Trésorier', email: cfg.tres[1], role: 'Utilisateur', statut: 'actif', derniereConnexion: frS(addDays(T, -9)) }];
  const lastT = acts.filter(a => a.type === 'Culte' && a._report && a._report.status === 'transmis')[0];
  const audit = [];
  if (lastT) audit.push({ user: past, action: 'Validation du rapport de culte du ' + lastT.date, date: lastT._report.valideLe });
  audit.push({ user: cfg.sec[0], action: 'Ajout du membre ' + members[members.length - 1].nom + ' (' + members[members.length - 1].mat + ')', date: stamp(addDays(T, -12), 10, 15) });
  audit.push({ user: cfg.tres[0], action: 'Enregistrement d\'une dépense : ' + ops.filter(o => o.type === 'depense')[0].description, date: stamp(addDays(T, -7), 9, 30) });
  audit.push({ user: past, action: 'Transmission du rapport mensuel de ' + lab(pm2).toLowerCase(), date: gen[2].transmisLe + ', 11h20' });
  return { members, acts, ops, gen, transmitted, users, audit, S0 };
}

/* ---------- ensemble du jeu de données ---------- */
function buildDataset(refDate) {
  const ref = noon(refDate || new Date()), T = ref, writes = [];
  const O = 'orgs/' + ORG;
  const put = (path, data) => writes.push({ path, data: clean(data) });
  const per = {};
  base.branches.forEach(b => { per[b.id] = genBranch(ref, b); });
  // branches
  base.branches.forEach(b => {
    const g = per[b.id];
    put(O + '/branches/' + b.id, Object.assign({}, b, { baptises: CFG[b.id].baptises, logoInitials: 'EG', orgName: base.org.name, pastorFn: 'Pasteur de la branche' }));
    g.members.forEach(m => put(O + '/branches/' + b.id + '/members/' + m.mat, m));
    g.acts.forEach(a => put(O + '/branches/' + b.id + '/activities/' + a.id, a));
    g.ops.forEach(o => put(O + '/branches/' + b.id + '/finOps/' + o.id, o));
    g.gen.forEach(r => put(O + '/branches/' + b.id + '/genReports/' + r.id, r));
    g.transmitted.forEach(r => put(O + '/branches/' + b.id + '/transmitted/' + r.id, r));
    g.users.forEach(u => put(O + '/branches/' + b.id + '/branchUsers/' + u.id, u));
    g.audit.forEach((a, i) => put(O + '/branches/' + b.id + '/audit/au' + (100 - i), Object.assign({ seq: 100 - i }, a)));
  });
  // pasteurs
  base.pastors.forEach(p => put(O + '/pastors/' + p.id, p));
  // utilisateurs de l'organisation
  base.orgUsers.forEach(u => put(O + '/orgUsers/' + u.id, u));
  // événements
  base.events.forEach(e => {
    const d = addDays(T, e.off);
    put(O + '/events/' + e.id, { id: e.id, title: e.title, type: e.type, date: frL(d), dateISO: isoOf(d), dateShort: { d: String(d.getDate()), m: cap(MOIS[d.getMonth()].replace('.', '')) }, time: e.time, place: e.place, description: e.description, responsable: e.responsable, intervenants: e.intervenants, target: e.target, branchesConcernees: e.branchesConcernees, status: e.status, tasks: e.tasks.map(t => ({ t: t.t, resp: t.resp, echeance: frS(addDays(T, t.off)), done: t.done })) });
  });
  // journal de l'organisation
  const oa = [
    { user: 'Emmanuel Houngbédji', action: 'Création de la branche Abomey-Calavi', date: '10 févr. 2024 · 10h15' },
    { user: 'David Zinsou', action: 'Modification de l\'affectation de Jonas Kpatchavi (Cotonou → Parakou)', date: '20 sept. 2022 · 14h02' },
    { user: 'Emmanuel Houngbédji', action: 'Planification : Convention Nationale des Pasteurs 2026', date: frS(addDays(T, -6)) + ' · 09h30' },
    { user: 'David Zinsou', action: 'Relance envoyée à Jonas Kpatchavi (rapport manquant)', date: frS(addDays(T, -2)) + ' · 11h20' }
  ];
  oa.forEach((a, i) => put(O + '/audit/au' + (200 + i), Object.assign({ seq: 200 + (i === 0 ? 0 : i === 1 ? -1 : i) }, a)));
  // méta : graphiques et droits
  const tot = base.branches.reduce((a, b) => a + b.members.total, 0);
  const mg = [], pe = [];
  const growth = [.906, .923, .939, .957, .978, 1], part = [398, 410, 405, 421, 436, 447];
  for (let i = 5; i >= 0; i--) { const d = new Date(T.getFullYear(), T.getMonth() - i, 1, 12), lbl = cap(MOIS[d.getMonth()].replace('.', '')); mg.push({ m: lbl, v: Math.round(tot * growth[5 - i]) }); pe.push({ m: lbl, v: part[5 - i] }); }
  const win = isoOf(addDays(T, -60)), cnt = { Culte: 0, 'Réunion de prière': 0, 'Étude biblique': 0, Autres: 0 };
  Object.values(per).forEach(g => g.acts.forEach(a => { if (a.statut === 'terminee' && a.dateISO >= win) cnt[a.type]++; }));
  put(O, Object.assign({}, base.org, { meta: { rights: base.rights, memberGrowth: mg, participationEvolution: pe, activitiesByType: [{ type: 'Cultes', total: cnt['Culte'] }, { type: 'Réunions de prière', total: cnt['Réunion de prière'] }, { type: 'Études bibliques', total: cnt['Étude biblique'] }, { type: 'Autres', total: cnt['Autres'] }] }, seededAt: new Date().toISOString() }));
  return { orgId: ORG, writes, summary: base.branches.map(b => ({ branche: b.id, membres: per[b.id].members.length, activites: per[b.id].acts.length, operations: per[b.id].ops.length })) };
}

module.exports = { buildDataset, ORG, CFG };
