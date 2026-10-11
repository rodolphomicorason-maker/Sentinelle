'use strict';
/* Efface puis réécrit toutes les données de l'organisation (utilisé par le script de remplissage et par /api/reset-demo). */
const { buildDataset, ORG } = require('./dataset');

async function resetOrg(db, refDate) {
  const orgRef = db.doc('orgs/' + ORG);
  // suppression récursive de l'organisation (branches, sous-collections, événements...)
  await db.recursiveDelete(orgRef);
  const { writes, summary } = buildDataset(refDate || new Date());
  let batch = db.batch(), n = 0, total = 0;
  for (const w of writes) {
    batch.set(db.doc(w.path), w.data);
    if (++n === 400) { await batch.commit(); total += n; batch = db.batch(); n = 0; }
  }
  if (n) { await batch.commit(); total += n; }
  return { documents: total, summary };
}
module.exports = { resetOrg };
