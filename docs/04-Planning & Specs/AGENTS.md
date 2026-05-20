# DOCS MAP

**Generated:** 2026-02-05 16:34 ET
**Commit:** 58192dd
**Branch:** feat/resizable-inspector

## OVERVIEW
Product and technical documentation for the HVAC Canvas app.
Use when updating features, workflows, or architecture.

## STRUCTURE
```
docs/
├── elements/        # per-component/store/schema docs
├── architecture/    # platform adapters + risks
├── user-journeys/   # end-to-end workflows
├── offline-storage/ # persistence docs
├── guides/          # how-to guides
└── archive/         # historical plans
```

## WHERE TO LOOK
| Task | Location | Notes |
| --- | --- | --- |
| Element references | `elements/INDEX.md` | index of documented elements |
| Architecture | `architecture/INDEX.md` | platform adapters, risks |
| User journeys | `user-journeys/README.md` | workflow catalog |
| Persistence docs | `offline-storage/` | file system + adapters |

## CONVENTIONS
- Update element docs when behavior or APIs change.
- Use user-journeys to align UX changes with tests.

## ANTI-PATTERNS
- Editing `archive/` for current guidance.
- Changing behavior without updating relevant docs.
