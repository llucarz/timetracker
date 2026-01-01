# Contributing to TimeTracker

Merci de contribuer ! Ce guide vous aidera à comprendre le workflow et les conventions du projet.

---

## 🚀 Quick Start pour contributeurs

### 1. Setup

```bash
# Fork & clone
git clone https://github.com/[your-username]/timetracker.git
cd timetracker

# Install
npm install

# Start dev server
npm run dev
```

### 2. Créer une branche

```bash
git checkout -b feature/ma-nouvelle-feature
# ou
git checkout -b fix/mon-bug-fix
```

### 3. Développer

Suivre les conventions ci-dessous ⬇️

### 4. Commit

```bash
git add .
git commit -m "feat: description de ma feature"
```

### 5. Push & Pull Request

```bash
git push origin feature/ma-nouvelle-feature
```

Puis créer une PR sur GitHub.

---

## 📝 Commit Messages

### Format : Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` : Nouvelle feature
- `fix` : Bug fix
- `docs` : Documentation uniquement
- `style` : Formatting, missing semi-colons, etc.
- `refactor` : Code change sans fix ni feature
- `perf` : Performance improvement
- `test` : Adding tests
- `chore` : Build, CI, dependencies, etc.

### Exemples

```bash
feat(history): add week/month/year filters
fix(overtime): correct balance calculation
docs(readme): update installation steps
refactor(profile): extract validation hook
perf(table): add virtualization for long lists
test(domain): add OvertimeCalculator tests
chore(deps): upgrade Tailwind to v4.1
```

### Scope (optionnel)

Utiliser le nom de la feature ou du module :
- `history`
- `overtime`
- `profile`
- `design-system`
- `domain`
- `app`

---

## 🏗 Architecture Guidelines

### Règle #1 : Separation of Concerns

```typescript
// ✅ GOOD - Business logic in domain
// domain/services/Calculator.ts
export class Calculator {
  static compute(a: number, b: number): number {
    return a + b;
  }
}

// ❌ BAD - Business logic in component
function MyComponent() {
  const result = data.reduce((acc, val) => acc + val.amount, 0);
}
```

### Règle #2 : Feature-based Organization

```
// ✅ GOOD - Tout regroupé par feature
features/
  overtime/
    hooks/
    components/
    utils/
    OvertimePanel.tsx

// ❌ BAD - Organisation par type
hooks/
  useOvertimeBalance.ts
  useOvertimeHistory.ts
components/
  OvertimeStats.tsx
  RecoveryModal.tsx
```

### Règle #3 : Design System First

```typescript
// ✅ GOOD - Use design system
import { StatCard } from '@/ui/design-system/patterns';
<StatCard variant="primary" value="35h" />

// ❌ BAD - Custom one-off component
<div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl">
  <p className="text-2xl font-bold">35h</p>
</div>
```

### Règle #4 : Pure Functions in Domain

```typescript
// ✅ GOOD - Pure function
export function calculateTotal(entries: Entry[]): number {
  return entries.reduce((sum, e) => sum + e.minutes, 0);
}

// ❌ BAD - Side effects in domain
export function calculateTotal(entries: Entry[]): number {
  localStorage.setItem('total', total); // ❌ Side effect!
  return total;
}
```

---

## 🎨 Code Style

### TypeScript

```typescript
// ✅ Use explicit types
function addEntry(entry: Omit<Entry, 'id'>): Entry {
  return EntryDomain.createEntry(entry);
}

// ❌ Avoid 'any'
function addEntry(entry: any): any { ... }

// ✅ Use interfaces for objects
interface UserSettings {
  weeklyTarget: number;
  workDays: number;
}

// ✅ Use type for unions/primitives
type Status = 'work' | 'leave' | 'sick' | 'holiday';
```

### React Hooks

```typescript
// ✅ GOOD - Stable dependencies
const addEntry = useCallback((entry: Omit<Entry, 'id'>) => {
  setEntries(prev => EntryDomain.upsertEntry(prev, entry));
}, []); // Empty deps OK (uses prev)

// ✅ GOOD - useMemo for expensive calcs
const stats = useMemo(() => {
  return calculateStats(entries, settings);
}, [entries, settings]);

// ❌ BAD - Missing dependencies
useEffect(() => {
  doSomething(entries);
}, []); // ❌ entries should be in deps!
```

### Components

```typescript
// ✅ GOOD - Props interface above component
interface MyComponentProps {
  entries: Entry[];
  onAdd: (entry: Entry) => void;
}

export function MyComponent({ entries, onAdd }: MyComponentProps) {
  // ...
}

// ✅ GOOD - Destructure props
export function MyComponent({ entries, onAdd }: MyComponentProps) {
  
// ❌ BAD - Use props object
export function MyComponent(props: MyComponentProps) {
  return <div>{props.entries.length}</div>;
}
```

### CSS / Tailwind

```typescript
// ✅ GOOD - Semantic, readable
<div className="flex items-center gap-4 p-6 bg-surface rounded-card">

// ✅ GOOD - Use cn() for conditional classes
import { cn } from '@/lib/utils';
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === 'primary' && "primary-classes"
)}>

// ❌ BAD - Inline styles (avoid)
<div style={{ display: 'flex', padding: '24px' }}>

// ❌ BAD - Overly long className
<div className="flex items-center justify-between gap-4 p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
```

---

## 🧪 Testing

### Tests requis

- **Domain functions** : 100% coverage
- **Application hooks** : Core logic
- **Components** : Critical user flows

### Example : Domain Test

```typescript
// domain/services/OvertimeCalculator.test.ts
import { describe, it, expect } from 'vitest';
import { OvertimeCalculator } from './OvertimeCalculator';

describe('OvertimeCalculator', () => {
  it('should calculate balance correctly', () => {
    const state = { earnedMinutes: 120, usedMinutes: 60, ... };
    const result = OvertimeCalculator.recalculateState(state, [], settings);
    
    expect(result.balanceMinutes).toBe(60);
  });
});
```

### Example : Hook Test

```typescript
// application/useEntries.test.ts
import { renderHook, act } from '@testing-library/react';
import { useEntries } from './useEntries';

describe('useEntries', () => {
  it('should add entry', () => {
    const { result } = renderHook(() => useEntries());
    
    act(() => {
      result.current.addEntry({ date: '2025-01-01', ... });
    });
    
    expect(result.current.entries).toHaveLength(1);
  });
});
```

---

## 📁 Où ajouter du code ?

### Nouvelle feature

```
1. Créer features/[feature-name]/
2. Ajouter hooks/, components/, utils/ si besoin
3. Créer [FeatureName].tsx comme entry point
4. Export via index.ts
```

### Nouveau composant réutilisable

```
1. Design system primitive ?
   → ui/design-system/primitives/

2. Design system pattern ?
   → ui/design-system/patterns/

3. Shared component ?
   → components/
```

### Nouvelle business rule

```
1. Pure function ?
   → domain/models/ ou domain/services/

2. React hook with state ?
   → application/

3. Feature-specific ?
   → features/[feature]/hooks/
```

---

## ✅ Pull Request Checklist

Avant de soumettre une PR, vérifier :

- [ ] Code compile sans erreurs (`npm run build`)
- [ ] Pas d'erreurs TypeScript (`npm run type-check`)
- [ ] Code formaté (Prettier)
- [ ] Commits suivent Conventional Commits
- [ ] Tests passent (si applicable)
- [ ] Documentation mise à jour (si nécessaire)
- [ ] Pas de `console.log` ou `debugger` restants
- [ ] Architecture guidelines respectées
- [ ] Design system utilisé (pas de one-off components)

---

## 🔍 Code Review Process

### Ce qu'on check

1. **Architecture** : Respecte les layers ?
2. **Separation of concerns** : Logic isolée ?
3. **Performance** : useMemo/useCallback appropriés ?
4. **Types** : TypeScript strict ?
5. **Tests** : Coverage suffisant ?
6. **Design** : Utilise design system ?
7. **Accessibility** : Sémantique HTML, ARIA labels ?

### Timeline

- Initial review : < 48h
- Feedback iterations : autant que nécessaire
- Merge : quand 2+ approvals

---

## 🐛 Reporting Bugs

### Template

```markdown
**Description**
Clear description du bug

**To Reproduce**
Steps pour reproduire:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
Ce qui devrait se passer

**Screenshots**
Si applicable

**Environment**
- OS: [e.g. macOS 14.0]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.2.3]
```

---

## 💡 Feature Requests

### Template

```markdown
**Is your feature related to a problem?**
Description du problème

**Describe the solution**
Solution proposée

**Describe alternatives**
Alternatives considérées

**Additional context**
Mockups, screenshots, etc.
```

---

## 📚 Resources

### Avant de commencer

- [ ] Lire [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ ] Lire [README.md](./README.md)
- [ ] Explorer les walkthroughs (`.gemini/antigravity/brain/`)

### Pour questions

- 💬 [GitHub Discussions](https://github.com/[repo]/discussions)
- 📧 Email: [maintainer-email]

---

## 🎉 Recognition

Les contributeurs sont listés dans :
- README.md (Contributors section)
- GitHub Contributors page

Merci pour votre contribution ! 🙏
