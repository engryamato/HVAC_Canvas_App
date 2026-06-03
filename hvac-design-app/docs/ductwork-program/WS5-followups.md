# WS5 Follow-ups

## WS5-FU-001 — Wire equipment-driven sizing into the placement path

**Status:** deferred (engine complete + unit-tested; call-site pending)

WS5 STEP 5 (equipment-driven sizing) ships as a complete, tested pure engine:
`applyEquipmentCapacitySizing(props, airflow, limits, targetVelocity)` in
`src/core/services/sizing/sizingProvenance.ts`. It sizes a duct's
`computed`/`default` size fields from airflow demand at a target velocity and
never overwrites `specified` fields.

**Why deferred:** the first integration called it from the entityStore flow
recompute (`recalculateFlows` / `runCommittedPipeline`). That created an ESM
import cycle:

```
entityStore → sizingProvenance → autoSizingService → parametricUpdateService
→ fittingGeneration → entityCommands → entityStore
```

plus a second cycle because `entityStore` then imported `settingsStore`, and
`settingsStore` already imports `useEntityStore`. The result crashed ~32 test
files with `Cannot read properties of undefined (reading 'getState')` at
`entityCommands.ts:1003` (module-init order). The store must not import the
sizing/settings layer.

**Correct call-site:** the equipment placement/connection handler (a leaf module
that imports the store and the sizing engine, and is NOT imported back by the
store). Apply `applyEquipmentCapacitySizing` to the connected duct(s) when
equipment is placed/connected, threading `engineeringLimits` from settings, and
commit via `entityActions` so it shares one undo group. Likely lands alongside
WS6/WS8 equipment work.

Everything else in WS5 (per-field `provenance`, constrained equivalent-diameter
recompute, the auto-overwrite guard, `entityActions.setSize`, manual-entry UX
with standard-size snapping + provenance styling) is implemented, wired, and
green.
