# ⏱️ TimeTracker

> Application web moderne de suivi du temps de travail avec calcul automatique des heures supplémentaires et synchronisation cloud.

[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Fonctionnalités

### 📊 Gestion du temps
- **Saisie rapide** : Enregistrez vos horaires (arrivée, pause déjeuner, départ) en quelques clics
- **Statuts multiples** : Travail, école, vacances, maladie, jour férié
- **Historique complet** : Vue par semaine, mois ou année avec filtrage par statut
- **Validation intelligente** : Détection des conflits avec les récupérations

### 🎯 Heures supplémentaires
- **Calcul automatique** : Basé sur votre objectif hebdomadaire (ex: 35h) et jours travaillés
- **Suivi du solde** : Balance entre heures gagnées et récupérées
- **Gestion des récupérations** : Enregistrez vos RTT avec blocage temporel optionnel
- **Récupération journée complète** : Checkbox pour récupérer automatiquement une journée entière basée sur votre horaire habituel
- **Historique détaillé** : Toutes vos transactions d'heures supplémentaires

### ⚙️ Personnalisation
- **Profil flexible** : 
  - Mode "Horaires identiques" : Même emploi du temps tous les jours
  - Mode "Horaires différenciés" : Schedule spécifique par jour de la semaine
- **Objectifs ajustables** : Définissez votre cible hebdomadaire et nombre de jours travaillés
- **Validation stricte** : Garantit que la somme hebdomadaire correspond à votre objectif

### ☁️ Synchronisation Cloud
- **Compte utilisateur** : Login avec nom + entreprise
- **Sync automatique** : Données sauvegardées toutes les 2 secondes (debounced)
- **Mode hors ligne** : Fonctionne sans connexion, sync au retour en ligne
- **Backend Vercel** : API serverless + Upstash Redis pour le stockage

### 💾 Stockage Hybride
- **Mode invité** : localStorage (simple, <100 entrées)
- **Mode connecté** : IndexedDB (performant, illimité)
- **Migration automatique** : Bascule transparente selon le nombre d'entrées et le statut de connexion

## 🚀 Installation

```bash
# Clone le projet
git clone https://github.com/llucarz/timetracker.git
cd timetracker

# Installe les dépendances
npm install

# Lance le serveur de développement
npm run dev

# Ouvre http://localhost:3000
```

## 🛠️ Stack Technique

### Frontend
- **React 18.3** avec TypeScript
- **Vite** pour le build ultra-rapide
- **Tailwind CSS** pour le styling
- **shadcn/ui** composants (Radix UI + Tailwind)
- **Framer Motion** pour les animations
- **Lucide React** pour les icônes

### Backend
- **Vercel Functions** (serverless)
- **Upstash Redis** pour le stockage cloud

### Storage
- **localStorage** : Mode invité, petits datasets
- **IndexedDB** : Mode connecté, gros volumes

## 📂 Structure du Projet

```
timetracker/
├── api/
│   └── data.js              # API Vercel pour cloud sync
├── src/
│   ├── components/          # Composants React
│   │   ├── Dashboard.tsx    # Vue tableau de bord
│   │   ├── WeeklyView.tsx   # Vue historique
│   │   ├── OvertimePanel.tsx # Gestion heures sup
│   │   ├── ProfileModal.tsx  # Configuration profil
│   │   └── ui/              # Composants shadcn (read-only)
│   ├── context/
│   │   └── TimeTrackerContext.tsx # State global
│   ├── lib/
│   │   ├── types.ts         # Types TypeScript
│   │   ├── utils.ts         # Fonctions métier
│   │   └── storage.ts       # Système de stockage
│   ├── App.tsx              # Shell principal
│   ├── main.tsx             # Point d'entrée
│   └── index.css            # Styles globaux
├── .github/
│   └── copilot-instructions.md # Guide pour IA
├── package.json
├── vite.config.ts
└── README.md
```

## 🎨 Design

Interface moderne avec :
- **Glassmorphism** : Effets de verre dépoli
- **Gradients** : Purple → Pink → Rose
- **Responsive** : Mobile-first (sm:, md:, lg: breakpoints)
- **Animations fluides** : Transitions de vues, layout animations
- **Mode clair** : Palette gris neutre avec accents colorés

Design original : [Figma](https://www.figma.com/design/6FlOjKpHTmcMsAG0IEnzDZ/UI-UX-Design-for-Time-Tracking-App)

## ⚙️ Configuration

### Variables d'environnement (Vercel)

Pour activer la sync cloud, configurez dans Vercel :

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Développement local avec cloud sync

```bash
# Option 1: Vercel Dev (recommandé)
npm install -g vercel
vercel dev

# Option 2: Sans backend (mode invité uniquement)
npm run dev
```

## 📖 Utilisation

### Premier lancement
1. **Onboarding** : Définissez votre objectif hebdo et horaires habituels
2. **Saisie** : Cliquez sur "Nouvelle journée" pour enregistrer vos horaires
3. **Consultation** : Naviguez entre Dashboard, Historique et Heures sup.

### Se connecter
1. Cliquez sur l'avatar utilisateur
2. "Se connecter"
3. Entrez nom + entreprise
4. Vos données se synchronisent automatiquement

### Récupérer des heures sup
1. Onglet "Heures sup."
2. "Enregistrer une récupération"
3. Choisissez date, durée et horaires (optionnel)
4. Cochez "Récupération journée complète" pour automatiquement récupérer une journée entière
5. Le système bloque automatiquement le créneau dans votre planning

## 🧠 Logique Métier

### Calcul des heures supplémentaires

**Algorithme** (voir `src/lib/utils.ts:computeOvertimeEarned`) :

1. **Regroupement par semaine ISO** (lundi-dimanche)
2. Pour chaque semaine :
   - **Semaine en cours** : `jours_saisis × cible_journalière - jours_absence × cible_journalière`
   - **Semaines passées** : `objectif_hebdo - jours_absence × cible_journalière`
3. **Ajout des récupérations** : Les événements de récup ajoutent des minutes à la balance
4. **Total** : Somme des deltas (minutes travaillées - minutes attendues)

**Statuts impactant l'objectif** :
- `school`, `vacation`, `sick`, `holiday` → réduisent la cible hebdomadaire
- `work` (ou vide) → comptabilisé normalement

### Stockage

**Migration automatique** :
- **Connexion** : localStorage → IndexedDB (si >100 entrées)
- **Déconnexion** : IndexedDB → localStorage + nettoyage IndexedDB
- **Threshold** : 100 entrées (configurable dans `storage.ts`)

## 🤝 Contribution

Le projet utilise :
- **ESLint** pour le linting
- **TypeScript strict mode**
- **shadcn/ui** pour les composants (ne pas éditer `src/components/ui/` directement)

## 📄 Licence

MIT

## 🙏 Crédits

- Design UI/UX : [Figma Community](https://www.figma.com/design/6FlOjKpHTmcMsAG0IEnzDZ)
- Composants : [shadcn/ui](https://ui.shadcn.com/)
- Icônes : [Lucide](https://lucide.dev/)

---

Développé avec ❤️ par [llucarz](https://github.com/llucarz)
