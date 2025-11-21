# TimeTracker AI Coding Instructions

## Project Overview
React-based time tracking SPA with local-first storage, overtime calculation, and optional cloud sync. Built with Vite, TypeScript, and shadcn/ui components.

## Architecture & Data Flow

### State Management
- **Context**: `src/context/TimeTrackerContext.tsx` - single source of truth
- **Storage**: localStorage with versioned keys (`tt_entries_v2`, `tt_settings_v1`, `tt_overtime_v1`)
- **State shape**: `entries[]`, `settings`, `otState` with automatic persistence via useEffect
- Entry uniqueness: One entry per date; new entries replace existing ones for same date
- Overtime auto-recalculates on entry/settings changes via `computeOvertimeEarned()`

### Key Components
- `App.tsx`: Navigation shell with 3 views (dashboard/history/overtime)
- `Dashboard.tsx`: Hero + stats cards + recent entries list
- `WeeklyView.tsx`: Period-based time table with filtering
- `OvertimePanel.tsx`: Balance tracking + event management
- Modal pattern: `*Modal.tsx` components for data entry/editing

## Critical Business Logic

### Overtime Calculation (`src/lib/utils.ts`)
```typescript
computeOvertimeEarned(entries, weeklyTarget, workDays)
```
- Groups entries by ISO week (Monday-Sunday)
- **Current week**: counts only logged work days + absence days
- **Past weeks**: applies full weekly target minus absences
- Status types: `work` (tracked), `school|vacation|sick|holiday` (reduce target)
- Returns total delta in minutes across all weeks

### Time Calculation
- `computeMinutes(entry)`: Returns 0 for non-work status
- Formula: `(lunchStart - start) + (end - lunchEnd)` 
- Handles missing lunch breaks: `end - start`

## UI Component System

### shadcn/ui Integration
- Components in `src/components/ui/` - DO NOT directly edit these files
- Based on Radix UI primitives + Tailwind variants
- Import path alias: `@/components/ui/*`
- Utilities: `cn()` from `@/lib/utils` for className merging

### Styling Conventions
- Tailwind-only (no CSS modules)
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints
- Design system: purple/pink/rose gradient accents, gray neutral scale
- Animations: Framer Motion (`motion` package) for view transitions
- Pattern: gradient backgrounds with backdrop-blur overlays

## Development Workflow

### Commands
```bash
npm run dev    # Vite dev server on port 3000
npm run build  # Production build to dist/
```

### Project Structure
- `src/components/` - React components (modals, pages, layout)
- `src/components/ui/` - shadcn primitives (READ-ONLY)
- `src/context/` - React Context providers
- `src/lib/` - Types (`types.ts`) and utilities (`utils.ts`)
- `legacy/` - Old version; ignore for new work

### Key Files for Modification
- Business logic: `src/lib/utils.ts`
- Types: `src/lib/types.ts` (Entry, Settings, OvertimeState, OvertimeEvent)
- State: `src/context/TimeTrackerContext.tsx`
- Feature components: `src/components/*.tsx` (not ui/ subdirectory)

## Data Model Reference

```typescript
Entry: {
  id: string;           // UUID
  date: string;         // YYYY-MM-DD
  start: string;        // HH:MM
  lunchStart: string;
  lunchEnd: string;
  end: string;
  notes: string;
  status: "work" | "school" | "vacation" | "sick" | "holiday";
}

Settings: {
  weeklyTarget: number;  // hours (default: 35)
  workDays: number;      // (default: 5)
  baseHours: {...};      // template schedule
  account: {...} | null; // cloud sync credentials
}

OvertimeState: {
  balanceMinutes: number;  // earned - used
  earnedMinutes: number;   // auto-calculated
  usedMinutes: number;     // manual events
  events: OvertimeEvent[]; // consumption log
}
```

## Common Patterns

### Adding Features
1. Define types in `src/lib/types.ts`
2. Add context actions in `TimeTrackerContext.tsx`
3. Create/modify component in `src/components/`
4. Use `useTimeTracker()` hook for state access

### UI Changes
- For new primitives: add via shadcn CLI (external step)
- For component styling: modify in `src/components/*.tsx`
- For layout: check responsive breakpoints and mobile menu behavior

### Date Handling
- Always use UTC for week calculations (see `mondayOf()`, `weekRangeOf()`)
- Display format: localized French (`fr-FR`)
- Storage format: ISO strings (`YYYY-MM-DD` or `HH:MM`)

## Cloud Sync (Optional)
- Endpoint: `/api/data?key=<accountKey>`
- Methods: POST (sync), GET (load)
- Auto-syncs with 2s debounce after state changes
- Account key format: `acct:<company>:<name>` (normalized)

## Testing & Debugging
- No test suite configured yet
- Use browser DevTools → Application → localStorage for data inspection
- ErrorBoundary wraps app with clear data recovery option
- Check console for sync errors (non-blocking)
