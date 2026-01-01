# Architecture - TimeTracker

Documentation complète de l'architecture du projet.

---

## 🎯 Principes architecturaux

### 1. Clean Architecture

L'application suit les principes de **Clean Architecture** avec séparation claire des responsabilités :

```
┌─────────────────────────────────────────┐
│            UI Layer (React)             │  ← features/, components/
├─────────────────────────────────────────┤
│       Application Layer (Hooks)         │  ← application/
├─────────────────────────────────────────┤
│      Domain Layer (Business Logic)      │  ← domain/
├─────────────────────────────────────────┤
│   Infrastructure (Storage, API, etc.)   │  ← lib/ (storage.ts)
└─────────────────────────────────────────┘
```

**Règle de dépendance** : Les couches internes ne dépendent JAMAIS des couches externes.

### 2. Domain-Driven Design (DDD)

#### Domain Layer (`src/domain/`)

**Pure business logic**, 0 dépendance React/UI.

```typescript
// domain/models/Entry.ts
export class EntryDomain {
  static createEntry(data: Omit<Entry, 'id' | 'updatedAt'>): Entry {
    return {
      ...data,
      id: crypto.randomUUID(),
      updatedAt: Date.now()
    };
  }
  
  // Pure functions, fully testable
  static upsertEntry(entries: Entry[], newEntry: Entry): Entry[] { ... }
}
```

**Avantages** :
- ✅ Testable sans React
- ✅ Réutilisable (backend, workers, scripts)
- ✅ Business rules centralisées

#### Application Layer (`src/application/`)

**React hooks** qui utilisent le domain layer.

```typescript
// application/useEntries.ts
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  
  const addEntry = useCallback((entry: Omit<Entry, 'id'>) => {
    const newEntry = EntryDomain.createEntry(entry); // Use domain
    setEntries(prev => EntryDomain.upsertEntry(prev, newEntry));
  }, []);
  
  // Persistence, side effects
  useEffect(() => { storage.importEntries(entries); }, [entries]);
  
  return { entries, addEntry, ... };
}
```

**Avantages** :
- ✅ Séparation state management / business logic
- ✅ Hooks réutilisables
- ✅ Side effects isolés

### 3. Feature-based Organization

Inspiration : [Feature-Sliced Design](https://feature-sliced.design/)

```
features/
├── history/              # TOUT ce qui concerne l'historique
│   ├── hooks/           # Hooks métier
│   ├── components/      # UI components
│   ├── utils/           # Utilities spécifiques
│   └── WeeklyView.tsx   # Feature entry point
├── overtime/
└── profile/
```

**Avantages** :
- ✅ Cohésion forte (tout au même endroit)
- ✅ Couplage faible (features indépendantes)
- ✅ Scalabilité (ajout de features facile)
- ✅ Code splitting naturel

---

## 🏗 Layers détaillées

### Layer 1 : Domain (Business Logic)

**Localisation** : `src/domain/`

**Responsabilité** : Business rules, calculs, validations

**Règles** :
- ❌ JAMAIS importer React
- ❌ JAMAIS importer de UI components
- ✅ Pure functions uniquement
- ✅ Fully testable

**Exemples** :
- `domain/models/Entry.ts` - CRUD operations sur Entry
- `domain/models/Overtime.ts` - Operations sur OvertimeState
- `domain/services/OvertimeCalculator.ts` - Calculs overtime

**Pattern utilisé** : Domain Models (DDD)

### Layer 2 : Application (React Hooks)

**Localisation** : `src/application/`

**Responsabilité** : State management, persistence, side effects

**Règles** :
- ✅ Peut utiliser domain layer
- ✅ Gère state avec useState/useReducer
- ✅ Gère side effects avec useEffect
- ❌ PAS de UI/JSX

**Exemples** :
- `application/useEntries.ts` - Entry state + CRUD
- `application/useOvertime.ts` - Overtime state + auto-recalc
- `application/useCloudSync.ts` - Cloud sync logic

**Pattern utilisé** : Custom Hooks

### Layer 3 : Features (UI per domain)

**Localisation** : `src/features/`

**Responsabilité** : Feature-specific UI + logic

**Structure** :
```
features/[feature-name]/
├── hooks/              # Feature-specific hooks
├── components/         # Feature UI components
├── utils/              # Feature utilities
└── [FeatureName].tsx   # Main component
```

**Règles** :
- ✅ Peut utiliser application hooks
- ✅ Peut utiliser design system
- ✅ Contient toute la UI de la feature
- ⚠️ Minimal coupling entre features

**Pattern utilisé** : Feature Modules

### Layer 4 : Design System

**Localisation** : `src/components/ui/` (shadcn/ui) et `src/ui/primitives` (custom)

**Responsabilité** : Reusable UI components

**Structure** :
```
components/ui/     # Composants standards (Button, Input, etc.)
ui/primitives/     # Primitives custom (GradientCard)
```

**Règles** :
- ✅ Generic, pas de business logic
- ✅ Reusable across features
- ✅ Props-driven (configurable)

**Pattern utilisé** : Atomic Design

### Layer 5 : Contexts (Orchestration)

**Localisation** : `src/context/`

**Responsabilité** : Lightweight orchestration

**Exemple** :
```typescript
// TimeTrackerContext.tsx
export function TimeTrackerProvider({ children }) {
  // Compose application hooks
  const entriesHook = useEntries();
  const settingsHook = useSettings();
  const overtimeHook = useOvertime(entriesHook.entries, settingsHook.settings);
  
  // Memoize value (CRITICAL!)
  const value = useMemo(() => ({
    entries: entriesHook.entries,
    addEntry: entriesHook.addEntry,
    settings: settingsHook.settings,
    otState: overtimeHook.otState,
    storageType: storage.getStorageType(), // Hybrid storage info
    clearData: async () => { ... } // Reset logic
    // ...
  }), [/* deps */]);
  
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
```

**Règles** :
- ✅ Minimal logic (juste composition)
- ✅ useMemo sur value (performance)
- ❌ PAS de business logic

---

## 📦 Data Flow

### Write Operation (ex: Add Entry)

```
UI Component
    ↓
TimeTrackerContext.addEntry()
    ↓
useEntries.addEntry()
    ↓
EntryDomain.createEntry() → Pure function
    ↓
setEntries() → React state update
    ↓
useEffect → storage.importEntries() → Persistence
    ↓
useOvertime detects change
    ↓
OvertimeCalculator.recalculate() → Pure function
    ↓
setOtState() → Update overtime state
    ↓
UI re-renders
```

### Read Operation (ex: Display Stats)

```
UI Component
    ↓
useTimeTracker()
    ↓
TimeTrackerContext value
    ↓
{ entries, otState, ... }
    ↓
Component renders
```

**Clé** : **Unidirectional data flow** (React standard)

---

## 🎨 Design System Architecture

### Atomic Design Hierarchy

```
Primitives (Atoms)
    ↓
Patterns (Molecules)
    ↓
Feature Components (Organisms)
    ↓
Pages (Templates)
```

### Exemple concret

```typescript
// Primitive (Atom)
<GradientCard variant="primary">...</GradientCard>

// Pattern (Molecule)
<StatCard 
  variant="primary"
  value="35h"
  label="Cette semaine"
  icon={<Clock />}
/>

// Feature Component (Organism)
<WeeklyStats entries={entries} settings={settings} />
    ↓ uses 4x StatCard
    
// Page (Template)
<WeeklyView />
    ↓ uses WeeklyStats + PeriodNavigator + EntryTable
```

**Avantage** : Change once (Primitive), apply everywhere !

---

## 🔄 State Management Strategy

### Global State (Context)

**Quoi** : State partagé app-wide
- Entries
- Settings
- Overtime state
- Sync status

**Comment** : TimeTrackerContext + Application hooks

### Local State (useState)

**Quoi** : Component-specific state
- Form inputs
- Modal open/close
- UI toggles (fullscreen, etc.)

**Où** : Dans les composants directement

### Derived State (useMemo)

**Quoi** : Calculated from existing state
- Filtered entries
- Stats calculations
- Formatted dates

**Comment** : useMemo dans hooks custom

**Règle** : **Pas de duplication de state** (single source of truth)

---

## 🧪 Testing Strategy

### Unit Tests (Domain Layer)

```typescript
// domain/services/OvertimeCalculator.test.ts
describe('OvertimeCalculator', () => {
  it('should recalculate balance correctly', () => {
    const result = OvertimeCalculator.recalculateState(
      mockState,
      mockEntries,
      mockSettings
    );
    
    expect(result.balanceMinutes).toBe(120);
  });
});
```

**Facile** : Pure functions, 0 mock needed !

### Integration Tests (Application Hooks)

```typescript
// application/useEntries.test.ts
import { renderHook, act } from '@testing-library/react';

describe('useEntries', () => {
  it('should add entry and persist', () => {
    const { result } = renderHook(() => useEntries());
    
    act(() => {
      result.current.addEntry({ date: '2025-01-01', ... });
    });
    
    expect(result.current.entries).toHaveLength(1);
  });
});
```

### Component Tests

```typescript
// features/history/components/WeeklyStats.test.tsx
describe('WeeklyStats', () => {
  it('should display correct stats', () => {
    render(<WeeklyStats entries={mockEntries} settings={mockSettings} />);
    
    expect(screen.getByText('35h')).toBeInTheDocument();
  });
});
```

---

## 🚀 Performance Optimizations

### 1. useMemo / useCallback

**Où** : Context values, expensive calculations

```typescript
const contextValue = useMemo(() => ({
  entries,
  addEntry,
  // ...
}), [entries, addEntry, ...]);
```

### 2. Code Splitting

**Comment** : Dynamic imports per feature

```typescript
const WeeklyView = lazy(() => import('./features/history/WeeklyView'));
```

### 3. Virtualization

**Où** : Long lists (entry table)

**Library** : `@tanstack/react-virtual` (si needed)

### 4. Debouncing

**Où** : Cloud sync, search

```typescript
useEffect(() => {
  const timeout = setTimeout(() => syncWithCloud(), 2000);
  return () => clearTimeout(timeout);
}, [entries, settings]);
```

---

## 📋 Conventions de code

### Naming

- **Components** : PascalCase (`WeeklyView.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useEntries.ts`)
- **Utils** : camelCase (`formatDuration.ts`)
- **Types** : PascalCase (`Entry`, `Settings`)
- **CSS classes** : kebab-case via Tailwind

### File Organization

```
FeatureName/
├── hooks/
│   ├── useFeatureLogic.ts
│   └── index.ts              # Barrel export
├── components/
│   ├── FeatureComponent.tsx
│   └── index.ts              # Barrel export
├── utils/
│   ├── featureHelper.ts
│   └── index.ts              # Barrel export
├── FeatureName.tsx           # Main component
└── index.ts                  # Barrel export
```

### Import Order

```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. External libraries
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// 3. Internal - Absolute imports
import { useTimeTracker } from '@/contexts/TimeTrackerContext';
import { EntryDomain } from '@/domain';

// 4. Relative imports
import { useFeatureLogic } from './hooks';
import { FeatureComponent } from './components';

// 5. Types
import type { Entry, Settings } from '@/lib/types';

// 6. Styles (if any)
import './styles.css';
```

---

## 🛠 Tools & Configuration

### TypeScript

**tsconfig.json** :
- Strict mode enabled
- Path aliases (`@/*`)
- No implicit any

### Tailwind CSS

**Mode** : JIT (Just-In-Time)
**Version** : 4.0 (latest)
**Config** : `@theme` in CSS

### Vite

**Plugins** :
- `@vitejs/plugin-react-swc` (Fast Refresh)
- `@tailwindcss/vite` (Tailwind v4)

---

## 📚 Resources

### Architecture Inspiration

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

### React Patterns

- [React Patterns](https://reactpatterns.com/)
- [Kent C. Dodds Blog](https://kentcdodds.com/blog)
- [Patterns.dev](https://www.patterns.dev/)

---

**Questions ?** Ouvrir une discussion ou consulter [CONTRIBUTING.md](./CONTRIBUTING.md)
