# TimeTracker 🕐

Application de gestion du temps de travail moderne, locale et respectueuse de la vie privée.

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)

---

## 🚀 Démarrage Rapide

```bash
# Installation
npm install

# Développement
npm run dev

# Build
npm run build

# Preview production
npm run preview
```

**URL locale** : http://localhost:3000

---

## 🎯 Fonctionnalités

### ✅ Gestion des entrées
- Saisie quotidienne des heures (arrivée, pause, départ)
- Gestion des types de journée (Travail, Télétravail, Congés, Maladie, Férié)
- Historique complet avec filtres (semaine, mois, année)
- Édition et suppression des entrées
- Import/Export CSV

### ✅ Heures Supplémentaires (Overtime)
- Calcul automatique du solde en temps réel
- Tracking des heures gagnées vs récupérées
- Formulaire de récupération (partielle ou journée complète)
- Historique détaillé des ajustements
- Conversion heures ↔ jours

### ✅ Profil & Configuration
- Horaires de base flexibles (identiques ou différents par jour)
- Objectif hebdomadaire personnalisable (ex: 35h, 39h)
- Jours travaillés configurables
- **Zone de danger** : Réinitialisation complète des données

### ✅ Architecture Technique
- **100% Local First** : Vos données restent sur votre machine
- **Stockage Hybride** : localStorage (Invité) ↔ IndexedDB (Utilisateur avancé/Loggué)
- **Synchronisation** : Support pour synchronisation cloud (architecture prête)
- **Offline-ready** : Fonctionne sans connexion internet

---

## 📁 Structure du Projet

```
src/
├── domain/              # 🎯 Logique métier pure (sans React)
│   ├── models/          # Modèles de domaine (Entry, Overtime)
│   └── services/        # Services métier (OvertimeCalculator)
│
├── application/         # 🔗 Hooks d'application (Lien React <-> Domain)
│   ├── useEntries.ts    # Gestion des entrées + persistance
│   ├── useSettings.ts   # Gestion des paramètres
│   ├── useOvertime.ts   # Calculs d'heures sup
│   └── useCloudSync.ts  # Synchro cloud
│
├── features/            # 📦 Modules fonctionnels (UI + Logique spécifique)
│   ├── history/         # Vue historique et statistiques
│   ├── overtime/        # Panel heures supplémentaires
│   └── profile/         # Configuration utilisateur
│
├── components/          # 🧩 Composants UI partagés
│   ├── ui/              # Design System (shadcn/ui + Tailwind)
│   └── [modals, menus]  # Composants globaux
│
├── context/             # ⚡ État global (léger)
│   ├── TimeTrackerContext.tsx
│   └── NotificationContext.tsx
│
└── lib/                 # 🛠 Utilitaires & Infrastructure
    ├── types.ts         # Types TypeScript
    ├── utils.ts         # Fonctions utilitaires
    └── storage.ts       # Moteur de stockage (Local/IndexedDB)
```

---

## 📖 Documentation

### Pour développeurs

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture détaillée
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guide de contribution
- **Walkthrough documents** (dans `.gemini/antigravity/brain/`)
  - `phase1_walkthrough.md` - Component decomposition
  - `phase2_walkthrough.md` - Design System
  - `phase3_walkthrough.md` - Domain/UI Separation
  - `final_walkthrough_100_percent.md` - Vue d'ensemble complète

### Pour designers

- **[figma_integration_guide.md](./.gemini/antigravity/brain/.../figma_integration_guide.md)** - Guide d'intégration Figma

---

## 🧪 Tests

```bash
# Unit tests (à venir)
npm run test

# E2E tests (à venir)
npm run test:e2e

# Type checking
npm run type-check
```

---

## 🚢 Deployment

### Vercel (recommandé)

```bash
# Via Vercel CLI
vercel

# Ou via Git (automatic)
git push origin main
```

### Autres plateformes

L'app est une SPA statique, compatible avec :
- Netlify
- Cloudflare Pages
- GitHub Pages
- Tout hébergeur de fichiers statiques

---

## 🤝 Contributing

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour :
- Conventions de code
- Architecture guidelines
- Pull request process
- Testing guidelines

---

## 📊 Performance

- ⚡ **First Load** : < 100kb JS (gzipped)
- ⚡ **Lighthouse Score** : 95+ (Performance)
- ⚡ **Bundle size** : Optimized avec code splitting
- ⚡ **Offline-ready** : localStorage/IndexedDB

---

## 🔒 Privacy

- ✅ **100% local-first** : Données stockées localement par défaut
- ✅ **Cloud opt-in** : Sync cloud uniquement si activé
- ✅ **No analytics** : 0 tracking
- ✅ **Open source** : Code auditable

---

## 📝 License

MIT License - voir [LICENSE](./LICENSE)

---

## 🙏 Credits

Built with ❤️ using:
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)

---

## 📞 Support

Pour questions ou bugs :
- 📧 Email: [your-email]
- 🐛 Issues: [GitHub Issues](https://github.com/[your-repo]/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/[your-repo]/discussions)

---

**Happy time tracking!** ⏰✨
