# Time Tracker – 35h + Heures Sup (HTML/CSS/JS)

- 100% Front (LocalStorage), export/import **JSON/CSV/YAML**.
- Filtrage **Semaine / Mois / Année** avec pickers natifs + navigation ◀ ▶.
- Option **cloud** (facultative) via **Vercel KV** avec 3 boutons.

## Démarrage local
Ouvrir `index.html` dans le navigateur. Tout fonctionne hors-ligne.

## Déploiement sur Vercel (statique)
- Créer un repo GitHub, y mettre `index.html`, `styles.css`, `app.js`.
- Importer sur Vercel → Deploy.

## Activer la synchro cloud (Vercel KV) – option
1. Dans Vercel : **Storage → KV → Create Database**, puis **Link** à votre projet.
2. Ajouter dans le repo :
   - dossier `api/` avec `api/data.js`
   - `package.json` (pour `@vercel/kv`)
3. Déployer. Dans l’app, utiliser les boutons **Cloud : clé / charger / sauver**.

La **clé cloud** est un identifiant libre (ex. `mon-email-35h-xyz`). Choisissez une clé imprévisible si vous voulez éviter que quelqu’un la devine. Il n’y a pas d’authentification avancée dans cet exemple.
