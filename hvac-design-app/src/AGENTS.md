# FRONTEND SOURCE MAP

**Generated:** 2026-02-05 16:34 ET
**Commit:** 58192dd
**Branch:** feat/resizable-inspector

## OVERVIEW
Frontend source for the Next.js app. Organized by feature slices and shared UI.

## STRUCTURE
```
src/
├── features/     # Feature modules (canvas, dashboard, export, onboarding)
├── core/         # schema, persistence, stores, commands
├── components/   # shared UI, layout, dialogs
├── hooks/        # shared hooks
├── utils/        # utilities + analytics
├── stores/       # legacy/global stores (small)
└── types/        # shared types
```

## CONVENTIONS
- Feature-slice architecture: keep feature logic inside `features/*`.
- Tests live next to code in `__tests__` folders.
- Barrel exports exist (`index.ts`) but are excluded from coverage.

## ANTI-PATTERNS
- Introducing new global state outside `core/store` or feature `store/`.
- Duplicating feature UI inside `components/` (use feature-owned components).
- Mixing Tauri-only APIs into shared modules without guards.
