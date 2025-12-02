# TimeTracker AI Coding Instructions

## Project Overview
React-based time tracking SPA with hybrid storage (localStorage/IndexedDB), overtime calculation, and optional cloud sync via Vercel + Upstash Redis. Built with Vite, TypeScript, and shadcn/ui components.

## Architecture & Data Flow

### State Management
- **Context**: `src/context/TimeTrackerContext.tsx` - single source of truth via React Context API
- **Hybrid Storage** (`src/lib/storage.ts`): Automatic migration between localStorage (guest mode) and IndexedDB (logged-in mode, >100 entries)
  - Storage keys: `tt_entries_v2`, `tt_settings_v1`, `tt_overtime_v1`, `tt_stats_cache_v1`
  - `StorageManager` class handles automatic migration in `migrateIfNeeded()`
- **State shape**: `entries[]`, `settings`, `otState` with automatic persistence via useEffect hooks
- **Entry uniqueness**: One entry per date; new entries replace existing ones for same date (enforced in `addEntry` via `findIndex`)
- **Overtime auto-calculation**: Triggered on entry/settings changes via `computeOvertimeEarned()` in context effects
- **Cloud sync**: Auto-syncs with 2s debounce when `settings.account.key` exists (see `useEffect` at end of context)

### Key Components
- `App.tsx`: Navigation shell with 3 views (dashboard/history/overtime), responsive mobile menu, scroll-based header
- `Dashboard.tsx`: Hero section + stats cards + recent entries list
- `WeeklyView.tsx`: Period-based time table (week/month/year) with filtering
- `OvertimePanel.tsx`: Balance tracking + event management with time-blocking
- `ErrorBoundary.tsx`: Catches errors with "clear data and reload" recovery button
- Modal pattern: `*Modal.tsx` components for CRUD operations (entry, profile, login, export)

## Critical Business Logic

### Overtime Calculation (`src/lib/utils.ts:computeOvertimeEarned`)
```typescript
computeOvertimeEarned(entries, weeklyTarget, workDays, events)
```
**Algorithm**:
1. Groups entries by ISO week (Monday-Sunday) using `weekRangeOf()`
2. For each week:
   - **Current week**: `daysLogged * dailyTarget - absenceDays * dailyTarget` (only counts entered days)
   - **Past weeks**: `weeklyTarget - absenceDays * dailyTarget` (assumes full week)
3. Adds recovery minutes from overtime events via `getRecoveryMinutesForDay()`
4. Status types: `work` (tracked), `school|vacation|sick|holiday` (reduce target)
5. Returns total delta in minutes across all weeks

**Important**: Recovery events can lock time slots in `getRecoveryState()` - morning events (<12:00) lock arrival/pauseStart, afternoon events lock pauseEnd/departure.

### Time Calculation
- `computeMinutes(entry)`: Returns 0 for non-work status, handles lunch breaks
  - With lunch: `(lunchStart - start) + (end - lunchEnd)`
  - Without lunch: `end - start`
- `checkOverlap(date, start, end, events)`: Prevents work/recovery time conflicts

## UI Component System

### shadcn/ui Integration
- Components in `src/components/ui/` - **DO NOT directly edit** (generated via shadcn CLI)
- Based on Radix UI primitives (`@radix-ui/react-*`) + Tailwind variants
- Import path alias: `@/components/ui/*` (configured in `vite.config.ts`)
- Utilities: `cn()` from `@/lib/utils` for className merging via `twMerge(clsx())`

### Styling Conventions
- **Tailwind-only** (no CSS modules) - main styles in `src/index.css`
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints
- Design system: purple/pink/rose gradient accents (`from-purple-500 via-pink-500 to-rose-500`), gray neutral scale
- Animations: Framer Motion (`motion` package) for view transitions, layout animations with `layoutId`
- Pattern: gradient backgrounds with `backdrop-blur-xl` overlays for glassmorphism

## Development Workflow

### Commands
```bash
npm run dev          # Vite dev server on port 3000 (auto-opens)
npm run build        # Production build to dist/ with code splitting
vercel dev           # Local dev with API endpoints (required for cloud sync)
```

### Project Structure
- `src/components/` - React components (pages, modals, layout)
- `src/components/ui/` - shadcn primitives (**READ-ONLY**)
- `src/context/` - React Context providers
- `src/lib/` - Business logic
  - `types.ts` - TypeScript interfaces (Entry, Settings, OvertimeState, OvertimeEvent)
  - `utils.ts` - Pure functions (time calc, overtime logic, date utils)
  - `storage.ts` - Hybrid storage engine with auto-migration
- `api/` - Vercel serverless functions (Node.js)
- `legacy/` - Old version; **ignore for new work**

### Key Files for Modification
- **Business logic**: `src/lib/utils.ts` (time/overtime calculations)
- **Types**: `src/lib/types.ts` (add `updatedAt?: number` to new entities)
- **State**: `src/context/TimeTrackerContext.tsx` (actions + persistence + sync)
- **Storage**: `src/lib/storage.ts` (modify threshold in `INDEXEDDB_THRESHOLD` constant)
- **Feature components**: `src/components/*.tsx` (not ui/ subdirectory)

## Data Model Reference

```typescript
Entry: {
  id: string;           // crypto.randomUUID()
  date: string;         // YYYY-MM-DD (ISO)
  start: string;        // HH:MM
  lunchStart: string;
  lunchEnd: string;
  end: string;
  notes: string;
  status: "work" | "school" | "vacation" | "sick" | "holiday";
  updatedAt?: number;   // Date.now() for sync conflict resolution
}

Settings: {
  isOnboarded?: boolean;
  weeklyTarget: number;     // hours (default: 35)
  workDays: number;         // (default: 5)
  baseHours: {...};         // template schedule (mode: "same" | "per-day")
  account?: {               // cloud sync credentials
    name: string;
    company: string;
    key: string;            // format: "acct:<company>:<name>" (normalized)
    isOffline?: boolean;
  } | null;
}

OvertimeState: {
  balanceMinutes: number;  // earnedMinutes - usedMinutes
  earnedMinutes: number;   // auto-calculated from entries + recovery events
  usedMinutes: number;     // sum of negative overtime events
  events: OvertimeEvent[]; // consumption + recovery log
}

OvertimeEvent: {
  id: string;              // crypto.randomUUID()
  date: string;            // YYYY-MM-DD
  minutes: number;         // positive = recovery, negative = consumption
  start?: string;          // HH:MM (for time-blocking recovery)
  end?: string;            // HH:MM (for time-blocking recovery)
  note: string;
}
```

## Common Patterns

### Adding Features
1. Define types in `src/lib/types.ts` (add `updatedAt?: number` for sync)
2. Add context actions in `TimeTrackerContext.tsx` (remember to persist via storage)
3. Create/modify component in `src/components/` (use shadcn components from ui/)
4. Access state via `useTimeTracker()` hook (destructure needed values)

### UI Changes
- For new shadcn primitives: add via shadcn CLI externally (e.g., `npx shadcn@latest add badge`)
- For component styling: modify in `src/components/*.tsx`
- For layout: check responsive breakpoints (`md:flex`, `hidden md:block`) and mobile menu state

### Date Handling
- **Always use UTC** for week calculations (see `mondayOf()`, `weekRangeOf()`)
- Display format: localized French (`fr-FR`) via `toLocaleDateString()`
- Storage format: ISO strings (`YYYY-MM-DD` for dates, `HH:MM` for times)
- Week starts Monday: `(d.getUTCDay() + 6) % 7` formula

## Cloud Sync Architecture

### API Endpoint (`api/data.js`)
- **GET** `/api/data?key=<accountKey>`: Load user data from Upstash Redis
- **POST** `/api/data?key=<accountKey>`: Sync user data to Redis
- Payload: `{ entries: Entry[], settings: Settings, overtime: OvertimeState }`
- Redis key format: `tt:<accountKey>` (where accountKey = `acct:<company>:<name>`)
- Handles legacy format migration (array → object with entries/settings/overtime)

### Account Key Generation
```typescript
generateAccountKey(company, name) // normalizes via normalizeString()
// Example: "Acme Corp", "John Doe" → "acct:acme-corp:john-doe"
```

### Local Development Setup
**Cloud sync requires a backend**. Choose one:
1. **Vercel Dev**: `vercel dev` (serves `api/data.js` locally at `http://localhost:3000/api/data`)
2. **Proxy**: Configure `server.proxy` in `vite.config.ts` to point to deployed instance
3. **Offline fallback**: Without backend, app detects 404 and disables sync gracefully

### Troubleshooting Cloud Sync
- **500 Internal Server Error**: Missing environment variables in Vercel
  - Required: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Check Vercel Project Settings → Environment Variables
  - View Vercel Function Logs for detailed error traces
- **404 Not Found**: API not accessible
  - **Local**: Run `vercel dev` or check proxy config in `vite.config.ts`
  - **Production**: Verify `api/data.js` deployed (check Vercel Functions tab)
- **Sync conflicts**: `updatedAt` timestamp on entries for last-write-wins

## Storage Migration Details

### Hybrid Storage Logic (`src/lib/storage.ts`)
- **Threshold**: Auto-migrates to IndexedDB when entries count > `INDEXEDDB_THRESHOLD` (100)
- **Guest mode**: localStorage (synchronous, simple)
- **Logged-in mode**: IndexedDB (async, indexed by date/status/updatedAt)
- **Migration triggers**:
  - Login: localStorage → IndexedDB (when entries exceed threshold)
  - Logout: IndexedDB → localStorage + clear IndexedDB
- **Stores**: `entries`, `settings`, `overtime`, `statsCache`

### Adding New Storage Fields
1. Update interface in `src/lib/types.ts`
2. Add getters/setters to both `LocalStorageEngine` and `IndexedDBEngine`
3. Proxy methods in `StorageManager` class
4. Handle migration in `migrateIfNeeded()` if needed

## Testing & Debugging
- **No test suite configured** (manual testing only)
- **Browser DevTools**:
  - Application → localStorage (guest mode data)
  - Application → IndexedDB → `TimeTrackerDB` (logged-in mode)
  - Console for sync errors (non-blocking, sets `lastSyncError`)
- **ErrorBoundary**: Wraps app with clear data recovery option (localStorage.clear() + reload)
- **Sync debugging**: Check Network tab for `/api/data` requests, inspect `isSyncing` state

## Dependencies & Build
- **Framework**: React 18.3, TypeScript, Vite (SWC plugin for fast refresh)
- **UI**: Radix UI primitives, Tailwind CSS, Lucide icons, Framer Motion
- **Cloud**: Upstash Redis SDK (`@upstash/redis`)
- **Forms**: React Hook Form (`react-hook-form`)
- **Charts**: Recharts (`recharts`)
- **Build**: Code splitting via `manualChunks` (react-vendor, ui-vendor)
