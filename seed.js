'use strict';
/*  Remplissage de la démonstration Sentinelle
    --------------------------------------------------------------
    1. crée (ou met à jour) les 5 comptes : 1 fondateur + 4 pasteurs de branche
    2. pose leurs rôles (custom claims)
    3. efface puis réécrit toutes les données dans Firestore

    Utilisation :  node scripts/seed.js
    Prérequis    :  service-account.json (clé de service Firebase) et comptes.json à la racine
*/
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { resetOrg } = require('../lib/reset');
const { ORG } = require('../lib/dataset');

const root = path.join(__dirname, '..');
function lire(nom, aide) {
  const f = path.join(root, nom);
  if (!fs.existsSync(f)) { console.error('\n✖ Fichier introuvable : ' + nom + '\n  ' + aide + '\n'); process.exit(1); }
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

(async () => {
  const sa = lire('service-account.json', 'Téléchargez la clé de service dans la console Firebase (Paramètres du projet > Comptes de service) et enregistrez-la sous ce nom.');
  const comptes = lire('comptes.json', 'Copiez comptes.example.json en comptes.json et choisissez vos mots de passe.');
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  const auth = admin.auth(), db = admin.firestore();

  const liste = [{ cle: 'fondateur', role: 'fondateur', branchId: null, ...comptes.fondateur }]
    .concat(Object.entries(comptes.branches).map(([branchId, c]) => ({ cle: branchId, role: 'pasteur', branchId, ...c })));

  for (const c of liste) {
    if (!c.email || !c.motDePasse || c.motDePasse.startsWith('CHANGEZ')) { console.error('✖ Renseignez un vrai mot de passe pour : ' + c.cle); process.exit(1); }
    if (c.motDePasse.length < 8) { console.error('✖ Mot de passe trop court (8 caractères minimum) pour : ' + c.cle); process.exit(1); }
  }

  console.log('→ Création des comptes...');
  for (const c of liste) {
    let user;
    try { user = await auth.getUserByEmail(c.email); user = await auth.updateUser(user.uid, { password: c.motDePasse, displayName: c.nom, disabled: false }); }
    catch (e) { if (e.code === 'auth/user-not-found') user = await auth.createUser({ email: c.email, password: c.motDePasse, displayName: c.nom, emailVerified: true }); else throw e; }
    const claims = { role: c.role, orgId: ORG }; if (c.branchId) claims.branchId = c.branchId;
    await auth.setCustomUserClaims(user.uid, claims);
    await db.doc('users/' + user.uid).set({ email: c.email, nom: c.nom, role: c.role, orgId: ORG, branchId: c.branchId || null });
    console.log('   ✔ ' + c.cle.padEnd(14) + c.email + '  (' + c.role + (c.branchId ? ', ' + c.branchId : '') + ')');
  }

  console.log('→ Écriture des données...');
  const r = await resetOrg(db);
  console.log('   ✔ ' + r.documents + ' documents écrits');
  r.summary.forEach(s => console.log('     - ' + s.branche.padEnd(14) + s.membres + ' membres, ' + s.activites + ' activités, ' + s.operations + ' opérations'));
  console.log('\n✔ Terminé. Vous pouvez vous connecter avec les comptes ci-dessus.\n');
  process.exit(0);
})().catch(e => { console.error('\n✖ Erreur : ' + (e.message || e) + '\n'); process.exit(1); });
