# Sentinelle – démonstration connectée (Vercel + Firebase)

Ce dossier contient tout ce qu'il faut pour mettre en ligne une démonstration **réelle** de Sentinelle :

- `/` : la page d'accueil, avec les boutons « Se connecter » (fondateur, pasteur de branche).
- `/fondateur` : connexion puis espace fondateur (toutes les Églises branches).
- `/branche` : connexion puis espace pasteur de branche (sa propre église).

Les données sont enregistrées dans **Firebase** (connexions et base de données). Le site est hébergé sur **Vercel**.
Quand un pasteur valide et transmet un rapport, le fondateur le voit apparaître **en direct**, sans recharger la page.

## Ce que contient la base de démonstration

- 1 compte **fondateur** et 4 comptes **pasteur de branche** : Cotonou, Porto-Novo, Parakou, Abomey-Calavi.
- 585 membres au total (248, 180, 95 et 62), avec leurs fiches complètes.
- Environ 25 activités par branche (cultes, prières, études, autres), des finances sur trois mois, des rapports à différents statuts, des événements nationaux, des journaux d'actions.
- Les dates sont calculées à partir du jour de remplissage : la démo paraît toujours à jour.

## Ce qu'il vous faut avant de commencer

- Un compte Google (pour Firebase) et un compte Vercel.
- **Node.js 18 ou plus récent** : https://nodejs.org (installez la version « LTS »).
- Un compte GitHub est conseillé pour le déploiement (la méthode sans GitHub est aussi décrite plus bas).

---

## Étape 1 – Créer le projet Firebase

1. Allez sur https://console.firebase.google.com et cliquez sur **Ajouter un projet**. Nom : `sentinelle-demo`. Désactivez Google Analytics, puis **Créer le projet**.
2. **Authentication** : cliquez sur **Commencer**, choisissez **E-mail/Mot de passe**, activez le premier interrupteur, puis **Enregistrer**.
3. **Firestore Database** : cliquez sur **Créer une base de données**. Choisissez le **mode production** et l'emplacement **eur3 (Europe)**. Cliquez sur **Activer**.
4. Dans Firestore, ouvrez l'onglet **Règles**. Effacez le contenu, collez tout le contenu du fichier `firestore.rules` de ce dossier, puis cliquez sur **Publier**.
5. Cliquez sur la roue dentée à côté de « Vue d'ensemble du projet », puis **Paramètres du projet**. Dans **Vos applications**, cliquez sur l'icône **</>** (Web). Nom : `Sentinelle`. Cliquez sur **Enregistrer l'application**. Copiez les valeurs de `firebaseConfig`.
6. Ouvrez le fichier `public/js/firebase-config.js` et remplacez chaque valeur par la vôtre (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId). Ces valeurs ne sont pas secrètes.
7. Toujours dans **Paramètres du projet**, onglet **Comptes de service**, cliquez sur **Générer une nouvelle clé privée**. Un fichier JSON se télécharge. Renommez-le **`service-account.json`** et placez-le à la racine de ce dossier.
   **Cette clé est secrète : ne l'envoyez à personne, ni par message, ni par e-mail, ni sur GitHub.** (Le fichier `.gitignore` l'exclut déjà de GitHub.)

## Étape 2 – Choisir les comptes et les mots de passe

1. Copiez `comptes.example.json` et nommez la copie **`comptes.json`**.
2. Ouvrez-le et remplacez les adresses e-mail (elles peuvent être fictives, par exemple `fondateur@sentinelle-demo.com`) et **choisissez vos mots de passe** (8 caractères minimum). Ne réutilisez pas un mot de passe que vous utilisez ailleurs.

## Étape 3 – Remplir la base

Ouvrez un terminal dans ce dossier et tapez :

```
npm install
node scripts/seed.js
```

Le script crée les 5 comptes, leur donne leurs rôles, puis écrit toutes les données. Il affiche la liste des comptes à la fin.
Vous pouvez le relancer à tout moment : il remet la démo à zéro.

## Étape 4 – Déployer sur Vercel

**Méthode conseillée, avec GitHub**

1. Créez un dépôt GitHub **privé** et envoyez-y ce dossier. Les fichiers `comptes.json` et `service-account.json` ne sont pas envoyés (ils sont dans `.gitignore`). Vérifiez-le.
2. Sur https://vercel.com, cliquez sur **Add New… > Project**, importez le dépôt, puis **Deploy** (laissez les réglages par défaut : « Other », la racine du dépôt).
3. Dans le projet Vercel : **Settings > Environment Variables**. Ajoutez la variable **`FIREBASE_SERVICE_ACCOUNT`** : collez **tout le contenu** du fichier `service-account.json`. Cochez Production, Preview et Development. Enregistrez.
4. Allez dans **Deployments**, ouvrez le menu du dernier déploiement et choisissez **Redeploy**, pour que la variable soit prise en compte.

**Méthode sans GitHub, avec la ligne de commande**

```
npm install -g vercel
vercel login
vercel
vercel env add FIREBASE_SERVICE_ACCOUNT      (collez le contenu complet de service-account.json)
vercel --prod
```

**Ensuite, dans Firebase** : **Authentication > Paramètres > Domaines autorisés > Ajouter un domaine**. Ajoutez votre adresse Vercel (par exemple `sentinelle-demo.vercel.app`).

## Étape 5 – Vérifier

1. Ouvrez votre lien Vercel : vous voyez la page d'accueil.
2. Cliquez sur **Se connecter > Espace fondateur** : la page de connexion s'affiche. Connectez-vous avec le compte fondateur : vous voyez les 4 Églises branches.
3. Déconnectez-vous, puis connectez-vous en tant que pasteur de branche : vous voyez uniquement votre église.

---

## Faire une démonstration

Un navigateur ne garde qu'**une seule connexion à la fois**. Pour montrer le fondateur et un pasteur en même temps :

- soit **deux appareils** (par exemple votre ordinateur pour le fondateur et votre téléphone pour la branche) ;
- soit **un navigateur normal et une fenêtre de navigation privée**.

Déroulé conseillé :

1. Avant la présentation : connectez-vous en fondateur, **Paramètres & Administration > Sauvegarde > Réinitialiser les données**.
2. Fondateur : montrez le tableau de bord. « Dernier dimanche » indique que seuls 2 rapports sur 4 sont reçus. Cotonou et Parakou sont en retard.
3. Fondateur : ouvrez **Rapports** et cliquez sur **Relancer** pour Parakou.
4. Sur l'autre appareil, connectez-vous en pasteur de **Parakou** : la relance apparaît tout de suite dans les notifications (la cloche).
5. Sur l'autre appareil, connectez-vous en pasteur de **Cotonou**, ouvrez **Rapports**, validez puis transmettez le rapport du dernier culte.
6. Sur l'écran du fondateur, sans recharger : le rapport de Cotonou passe de « manquant » à « reçu ».

## Réinitialiser la démo

- Depuis l'application : compte fondateur, **Paramètres & Administration > Sauvegarde > Réinitialiser les données** (environ 20 secondes).
- Depuis votre ordinateur : `node scripts/seed.js`.

## Si quelque chose ne marche pas

| Message ou symptôme | Cause probable et solution |
|---|---|
| « Impossible de joindre Firebase » | `public/js/firebase-config.js` contient encore les valeurs d'exemple. Remplacez-les. |
| « Missing or insufficient permissions » dans la console du navigateur | Les règles ne sont pas publiées (étape 1.4), ou les comptes ont été créés sans leurs rôles. Publiez les règles, puis relancez `node scripts/seed.js`. |
| « E-mail ou mot de passe incorrect » | Utilisez les valeurs de `comptes.json`. Après une modification, relancez `node scripts/seed.js`. |
| « Ce compte n'est pas un compte fondateur » | Vous êtes dans le mauvais espace : un compte de branche ouvre `/branche`, le compte fondateur ouvre `/fondateur`. |
| Le bouton « Réinitialiser » échoue | La variable `FIREBASE_SERVICE_ACCOUNT` manque sur Vercel, ou le projet n'a pas été redéployé après son ajout. |
| `node scripts/seed.js` : fichier introuvable | `service-account.json` ou `comptes.json` n'est pas à la racine du dossier. |

## Structure du dossier

```
public/                 le site (ce que Vercel publie)
  index.html            page d'accueil
  fondateur/index.html  espace fondateur
  branche/index.html    espace pasteur de branche
  js/firebase-config.js VOS identifiants Firebase publics (à remplir)
  js/sentinelle-core.js connexion, accès à la base, synchronisation en direct
  js/app-fondateur.js   chargement et enregistrement côté fondateur
  js/app-branche.js     chargement et enregistrement côté branche
api/reset-demo.js       réinitialisation depuis l'application (fonction Vercel)
lib/dataset.js          génération des données de démonstration
scripts/seed.js         création des comptes et remplissage de la base
firestore.rules         règles de sécurité de la base
comptes.example.json    modèle du fichier de comptes
```

## Organisation de la base (Firestore)

```
orgs/egdlg                              l'organisation (informations, droits d'accès, données des graphiques)
orgs/egdlg/branches/{branche}           une Église branche (identité, effectifs)
   .../members  .../activities  .../finOps  .../genReports  .../transmitted  .../branchUsers  .../audit
orgs/egdlg/pastors  orgUsers  events  audit  monthly  relances
users/{uid}                             profil de chaque compte
```

Sécurité (fichier `firestore.rules`) : un pasteur ne lit et n'écrit que dans **sa** branche. Le fondateur lit tout et gère l'organisation. Les rôles sont posés par le script de remplissage (« custom claims »).

## Limites actuelles de ce prototype

- Les fonctions d'administration des comptes (changer son mot de passe depuis l'application, créer un vrai accès pour un secrétaire ou un trésorier) restent des **fiches** sans connexion réelle. Les 5 comptes se créent avec `scripts/seed.js`.
- L'export PDF des rapports demande une connexion Internet (la bibliothèque PDF est chargée depuis un service externe).
- Les noms, chiffres et dates sont des données de démonstration.
