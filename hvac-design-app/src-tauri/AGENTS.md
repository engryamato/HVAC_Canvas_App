# TAURI BACKEND MAP

**Generated:** 2026-02-05 16:34 ET
**Commit:** 58192dd
**Branch:** feat/resizable-inspector

## 🔴 CORE RULE: TAURI IS A WEB WRAPPER — WEB IS CANON

> **HARDWIRED — NO EXCEPTIONS**

The Tauri desktop app is a **pure shell** that wraps and displays the web app in a native window.

- ✅ The **web app** (`src/`) is the **single source of truth** for all features and UI.
- ✅ Tauri's only job is to provide: a **native window**, **OS file system access**, **dialogs**, and **clipboard**.
- ❌ **Never** implement a feature in Tauri that doesn't exist in the web version.
- ❌ **Never** add Tauri-specific UI, routing, or business logic.
- ❌ **Never** use `@tauri-apps/*` APIs in `src/` without an `isTauri()` guard so the web build still works.
- ✅ All `@tauri-apps/*` calls must be guarded: `if (isTauri()) { ... }`
- ✅ Run `pnpm parity:check` before every commit to enforce this.

### Allowed Tauri-only additions (native OS delegation only)
| Tauri Command | Purpose | Web fallback |
|---|---|---|
| `resolve_storage_root` | Get OS Documents/AppData paths | IndexedDB |
| `validate_storage_root` | Check disk space & write permission | Not needed |
| `get_disk_space` | Disk usage info | Not needed |
| `create_directory` | Native mkdir | File System Access API |
| `list_directory_files` | Native readdir | File System Access API |
| `get_app_data_dir` | App data path | localStorage |

## OVERVIEW
Rust backend for the desktop build using Tauri v2.
Owns native filesystem and OS integrations only.

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
- `devUrl` in `tauri.conf.json` must point to the running Next.js dev server port.

## ANTI-PATTERNS
- Editing `src-tauri/target/` artifacts.
- Bypassing permissions/capabilities definitions.
- Adding Tauri-only features not present in web version.
- Calling `@tauri-apps/*` APIs without `isTauri()` guard.
