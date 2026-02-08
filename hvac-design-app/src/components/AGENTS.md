# SHARED COMPONENTS MAP

**Generated:** 2026-02-05 16:34 ET
**Commit:** 58192dd
**Branch:** feat/resizable-inspector

## OVERVIEW
Shared UI and layout components used across features.
Canvas-specific UI lives in `features/canvas/components`.

## STRUCTURE
```
components/
├── layout/       # App shell + menus
├── dialogs/      # shared dialogs
├── onboarding/   # onboarding screens
├── ui/           # UI primitives (Radix + custom)
├── common/       # small shared screens
└── error/        # error pages
```

## WHERE TO LOOK
| Task | Location | Notes |
| --- | --- | --- |
| App shell | `layout/` | header + menus |
| Dialogs | `dialogs/` | settings, errors |
| UI primitives | `ui/` | buttons, inputs, tabs |
| Onboarding | `onboarding/` | welcome + project creation |

## CONVENTIONS
- UI primitives live in `components/ui` and are reused by features.
- Layout components should remain global (not feature-specific).
- Component tests live under `__tests__` next to components.

## ANTI-PATTERNS
- Rebuilding feature UI here (use `features/*` instead).
- Introducing Tauri-only behavior without guards.
- Mixing layout shell responsibilities into feature components.
