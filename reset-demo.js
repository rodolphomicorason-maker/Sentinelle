'use strict';
/*  Réinitialisation de la démo, appelée depuis Paramètres > Sauvegarde et données (compte fondateur uniquement).
    Variable d'environnement requise sur Vercel : FIREBASE_SERVICE_ACCOUNT (contenu complet du fichier JSON de la clé de service). */
const admin = require('firebase-admin');
const { resetOrg } = require('../lib/reset');
const { ORG } = require('../lib/dataset');

function app() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT manquante');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return admin;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, erreur: 'Méthode non autorisée' });
  try {
    const a = app();
    const m = (req.headers.authorization || '').match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ ok: false, erreur: 'Non connecté' });
    const tok = await a.auth().verifyIdToken(m[1]);
    if (tok.role !== 'fondateur' || tok.orgId !== ORG) return res.status(403).json({ ok: false, erreur: 'Réservé au compte fondateur' });
    const r = await resetOrg(a.firestore());
    return res.status(200).json({ ok: true, documents: r.documents });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, erreur: 'Échec de la réinitialisation : ' + (e.message || e) });
  }
};
