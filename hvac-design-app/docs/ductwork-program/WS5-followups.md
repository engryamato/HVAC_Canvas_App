# WS5 Follow-ups

## WS5-FU-001 — Wire equipment-driven sizing into the placement path

**Status:** implemented.

Equipment placement in `src/features/canvas/tools/EquipmentTool.ts` now applies
equipment-driven sizing to connected ducts immediately after placement:
`createEquipment` → `validateAndRecord` →
`applyEquipmentSizingToConnectedDucts` → `commitEntityProps`.

Implementation details:
- Uses connected duct ports from the placed equipment draft.
- Reads `engineeringLimits` from `useSettingsStore`; uses propagated duct
  airflow when available.
- Calls `applyEquipmentCapacitySizing` and commits changed props through
  `entityActions` (`commitEntityProps`). This avoids the prior ESM import
  cycle because sizing is invoked from the tool/placement path, not inside the
  store/recompute pipeline.

The engine itself was already complete and unit-tested in
`src/core/services/sizing/sizingProvenance.ts`.
