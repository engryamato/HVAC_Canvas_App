# TAURI BACKEND MAP

**Generated:** 2026-02-05 16:34 ET
**Commit:** 58192dd
**Branch:** feat/resizable-inspector

## OVERVIEW
Rust backend for the desktop build using Tauri v2.
Owns native filesystem and OS integrations.

## STRUCTURE
```
src-tauri/
├── src/          # Rust entry points
├── tauri.conf.json
├── icons/
├── capabilities/
└── target/       # build output
```

## WHERE TO LOOK
| Task | Location | Notes |
| --- | --- | --- |
| Entry points | `src/main.rs`, `src/lib.rs` | app startup |
| App config | `tauri.conf.json` | window + bundle config |
| Capabilities | `capabilities/` | permissions |

## CONVENTIONS
- Use Tauri v2 plugins declared in `Cargo.toml`.
- Keep web/Tauri parity with `scripts/check-tauri-web-parity.js`.

## ANTI-PATTERNS
- Editing `src-tauri/target/` artifacts.
- Bypassing permissions/capabilities definitions.
