# Core Flows — Magnetic Link Calculation Propagation

## Flow 1 — Connection-Triggered Calculation

**Description:** Every time the engineer draws a duct run that snaps to another duct, fitting, or equipment endpoint, the system automatically recalculates CFM and pressure across the entire connected network. No manual action is required.

**Trigger:** Engineer completes a magnetic snap — either placing a new duct run endpoint onto an existing endpoint, or moving an existing duct run so its endpoint snaps to another entity.

**Steps:**

1. Engineer draws a duct run on the canvas. As the endpoint approaches another duct, fitting, or equipment connection point, a blue snap indicator appears.
2. Engineer releases the mouse. The duct run is committed with its endpoint snapped.
3. For a valid single-source, tree-like network, the system immediately and silently recalculates the connected network:
  - CFM accumulates from terminal equipment (diffusers, hoods) upstream toward the source.
  - Static pressure propagates downstream from source equipment (AHU, RTU, fan, furnace), subtracting friction loss per duct segment and fitting loss per fitting.
  - Cumulative pressure drop and available static pressure are stored on each duct run and fitting in the network.
4. If the updated network is ambiguous or unsupported (for example: a loop, multiple sources, more than one upstream path, or malformed fitting ports), the system does **not** guess a path:
  - affected ducts render in a neutral/grey overlay state
  - calculations for affected entities show `—`
  - the Validation panel surfaces a clear warning explaining why the network could not be calculated
5. No loading indicator or toast is shown — the update is instantaneous and silent.
6. If a color overlay is active (see Flow 3), duct stroke colors update immediately to reflect the new values or neutral fallback state.
7. If the engineer opens the Calculations tab and a duct or fitting is selected, the updated values appear there (see Flow 2).

**Edge cases:**

- If no source equipment (AHU, RTU, fan, furnace) is connected to the network, pressure values display as `—` (not calculated).
- If no terminal equipment (diffusers, hoods) is connected, CFM displays as `0`.
- If the network contains a cycle, multiple sources, more than one upstream path, or malformed fitting connections, affected entities show `—`, grey overlay, and a Validation panel warning.
- Disconnecting a duct (moving it away from a snap point) triggers the same recalculation pass, clearing values for the now-isolated segment.

## Flow 2 — Selection-Aware Calculations Panel

**Description:** When the engineer selects a duct run or fitting on the canvas and switches to the Calculations tab in the right sidebar, they see the engineering values for that specific element — not just system totals.

**Trigger:** Engineer clicks a duct run or fitting on the canvas, then clicks the "Calc" tab in the right sidebar.

**Steps:**

1. Engineer clicks a duct run on the canvas. It becomes selected (blue highlight).
2. Engineer clicks the **Calc** tab in the right sidebar.
3. The Calculations panel shows two sections:
  - **Selected Segment** card (at the top, prominent):
    - Airflow (CFM)
    - Velocity (FPM)
    - Friction Rate (in.wg/100ft)
    - Cumulative Pressure Drop (in.wg — total loss from source to this point)
    - Available Static Pressure (in.wg — remaining pressure at this point)
  - **System Totals** card (below, secondary): unchanged existing content (Total CFM, Max ESP, Total Duct Length, Approx. Weight).
4. If the selected element has no calculated values — either because no source equipment is connected **or** because the network topology is unsupported for calculation — each unavailable field in the Selected Segment card shows `—`.
5. Engineer clicks a **fitting** instead — the Selected Segment card updates to show the authoritative flow ports on that fitting:
  - **Entering port** — the single upstream port for the fitting in a valid v1 network, labeled for its role (for example: `Inlet`)
  - **Exiting ports** — one or more downstream ports, labeled for their role (for example: `Outlet`, `Straight Out`, `Branch Out`)
  - **Fitting Pressure Loss** (in.wg) — the loss attributed to this fitting
  - **Cumulative Pressure Drop** (in.wg) — total loss from source to this fitting
  - **Available Static Pressure** (in.wg) — remaining pressure at this fitting
  - Friction Rate is not shown for fittings.
  - Examples by fitting type:
    - *Elbow* — shows one inlet CFM and one outlet CFM
    - *Tee* — shows one inlet CFM and two outlet CFMs (straight-through branch + side branch)
    - *Wye* — shows one inlet CFM and two outlet CFMs
    - *Reducer / Transition* — shows one inlet CFM and one outlet CFM (equal; size changes, flow does not)
  - If a fitting would imply ambiguous or malformed port direction in v1, it is treated as unsupported and the panel shows `—` plus the Validation panel warning.
6. Engineer clicks away (deselects) — the Selected Segment card disappears and only System Totals remain.
7. Engineer selects multiple elements — the Selected Segment card disappears (multi-selection not supported for this view).

**Wireframe — Calculations Panel States:**

```wireframe

<html>
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; font-size: 13px; }
  body { background: #f8fafc; display: flex; gap: 16px; padding: 16px; }
  .panel { width: 240px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .panel-title { background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 8px 12px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .card { border: 1px solid #e2e8f0; border-radius: 6px; margin: 10px; padding: 10px; }
  .card-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
  .selected-label { color: #2563eb; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; }
  .row-key { color: #64748b; font-size: 12px; }
  .row-val { font-weight: 600; color: #0f172a; font-size: 12px; }
  .row-val.dash { color: #94a3b8; font-weight: 400; }
  .row-val.warn { color: #dc2626; }
  .state-label { font-size: 10px; color: #94a3b8; text-align: center; padding: 6px 0 2px; }
  .empty-hint { color: #94a3b8; font-size: 11px; text-align: center; padding: 16px 10px; border: 1px dashed #e2e8f0; border-radius: 6px; margin: 10px; }
</style>
</head>
<body>

<div class="panel">
  <div class="panel-title">Calculations</div>
  <div class="state-label">Duct run selected · source connected</div>
  <div class="card">
    <div class="card-label selected-label">Selected Segment</div>
    <div class="row"><span class="row-key">Airflow</span><span class="row-val">850 CFM</span></div>
    <div class="row"><span class="row-key">Velocity</span><span class="row-val">1,082 FPM</span></div>
    <div class="row"><span class="row-key">Friction Rate</span><span class="row-val">0.08 in.wg/100ft</span></div>
    <div class="row"><span class="row-key">Cumulative ΔP</span><span class="row-val">0.24 in.wg</span></div>
    <div class="row"><span class="row-key">Available SP</span><span class="row-val">1.76 in.wg</span></div>
  </div>
  <div class="card">
    <div class="card-label">System Totals</div>
    <div class="row"><span class="row-key">Total Airflow</span><span class="row-val">2,400 CFM</span></div>
    <div class="row"><span class="row-key">Max ESP</span><span class="row-val">2.00 in.wg</span></div>
    <div class="row"><span class="row-key">Total Duct Length</span><span class="row-val">148.5 ft</span></div>
    <div class="row"><span class="row-key">Approx. Weight</span><span class="row-val">312 lbs</span></div>
  </div>
</div>

<div class="panel">
  <div class="panel-title">Calculations</div>
  <div class="state-label">Duct run selected · no source equipment</div>
  <div class="card">
    <div class="card-label selected-label">Selected Segment</div>
    <div class="row"><span class="row-key">Airflow</span><span class="row-val dash">—</span></div>
    <div class="row"><span class="row-key">Velocity</span><span class="row-val dash">—</span></div>
    <div class="row"><span class="row-key">Friction Rate</span><span class="row-val dash">—</span></div>
    <div class="row"><span class="row-key">Cumulative ΔP</span><span class="row-val dash">—</span></div>
    <div class="row"><span class="row-key">Available SP</span><span class="row-val dash">—</span></div>
  </div>
  <div class="card">
    <div class="card-label">System Totals</div>
    <div class="row"><span class="row-key">Total Airflow</span><span class="row-val">0 CFM</span></div>
    <div class="row"><span class="row-key">Max ESP</span><span class="row-val">0.00 in.wg</span></div>
    <div class="row"><span class="row-key">Total Duct Length</span><span class="row-val">42.0 ft</span></div>
    <div class="row"><span class="row-key">Approx. Weight</span><span class="row-val">88 lbs</span></div>
  </div>
</div>

<div class="panel">
  <div class="panel-title">Calculations</div>
  <div class="state-label">Nothing selected</div>
  <div class="empty-hint">Select a duct run or fitting to see its engineering values.</div>
  <div class="card">
    <div class="card-label">System Totals</div>
    <div class="row"><span class="row-key">Total Airflow</span><span class="row-val">2,400 CFM</span></div>
    <div class="row"><span class="row-key">Max ESP</span><span class="row-val">2.00 in.wg</span></div>
    <div class="row"><span class="row-key">Total Duct Length</span><span class="row-val">148.5 ft</span></div>
    <div class="row"><span class="row-key">Approx. Weight</span><span class="row-val">312 lbs</span></div>
  </div>
</div>

</body>
</html>
```

**Wireframe — Fitting Selected in Calculations Panel (Tee example):**

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; font-size: 13px; }
  body { background: #f8fafc; display: flex; gap: 16px; padding: 16px; }
  .panel { width: 240px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .panel-title { background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 8px 12px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .card { border: 1px solid #e2e8f0; border-radius: 6px; margin: 10px; padding: 10px; }
  .card-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
  .selected-label { color: #2563eb; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; }
  .row-key { color: #64748b; font-size: 12px; }
  .row-val { font-weight: 600; color: #0f172a; font-size: 12px; }
  .port-divider { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; padding: 6px 0 2px; border-top: 1px solid #f1f5f9; margin-top: 4px; }
  .port-in { color: #0369a1; }
  .port-out { color: #15803d; }
  .state-label { font-size: 10px; color: #94a3b8; text-align: center; padding: 6px 0 2px; }
</style>
</head>
<body>

<!-- Tee fitting selected -->
<div class="panel">
  <div class="panel-title">Calculations</div>
  <div class="state-label">Tee fitting selected</div>
  <div class="card">
    <div class="card-label selected-label">Selected Fitting</div>
    <div class="port-divider port-in">↓ Entering</div>
    <div class="row"><span class="row-key">Inlet</span><span class="row-val">850 CFM</span></div>
    <div class="port-divider port-out">↑ Exiting</div>
    <div class="row"><span class="row-key">Straight Out</span><span class="row-val">600 CFM</span></div>
    <div class="row"><span class="row-key">Branch Out</span><span class="row-val">250 CFM</span></div>
    <div class="port-divider" style="color:#64748b">Pressure</div>
    <div class="row"><span class="row-key">Fitting Loss</span><span class="row-val">0.04 in.wg</span></div>
    <div class="row"><span class="row-key">Cumulative ΔP</span><span class="row-val">0.28 in.wg</span></div>
    <div class="row"><span class="row-key">Available SP</span><span class="row-val">1.72 in.wg</span></div>
  </div>
  <div class="card">
    <div class="card-label">System Totals</div>
    <div class="row"><span class="row-key">Total Airflow</span><span class="row-val">2,400 CFM</span></div>
    <div class="row"><span class="row-key">Max ESP</span><span class="row-val">2.00 in.wg</span></div>
    <div class="row"><span class="row-key">Total Duct Length</span><span class="row-val">148.5 ft</span></div>
    <div class="row"><span class="row-key">Approx. Weight</span><span class="row-val">312 lbs</span></div>
  </div>
</div>

<!-- Elbow fitting selected -->
<div class="panel">
  <div class="panel-title">Calculations</div>
  <div class="state-label">Elbow fitting selected</div>
  <div class="card">
    <div class="card-label selected-label">Selected Fitting</div>
    <div class="port-divider port-in">↓ Entering</div>
    <div class="row"><span class="row-key">Inlet</span><span class="row-val">850 CFM</span></div>
    <div class="port-divider port-out">↑ Exiting</div>
    <div class="row"><span class="row-key">Outlet</span><span class="row-val">850 CFM</span></div>
    <div class="port-divider" style="color:#64748b">Pressure</div>
    <div class="row"><span class="row-key">Fitting Loss</span><span class="row-val">0.06 in.wg</span></div>
    <div class="row"><span class="row-key">Cumulative ΔP</span><span class="row-val">0.30 in.wg</span></div>
    <div class="row"><span class="row-key">Available SP</span><span class="row-val">1.70 in.wg</span></div>
  </div>
  <div class="card">
    <div class="card-label">System Totals</div>
    <div class="row"><span class="row-key">Total Airflow</span><span class="row-val">2,400 CFM</span></div>
    <div class="row"><span class="row-key">Max ESP</span><span class="row-val">2.00 in.wg</span></div>
    <div class="row"><span class="row-key">Total Duct Length</span><span class="row-val">148.5 ft</span></div>
    <div class="row"><span class="row-key">Approx. Weight</span><span class="row-val">312 lbs</span></div>
  </div>
</div>

</body>
</html>
```

## Flow 3 — Duct Color Overlay Toggle

**Description:** The engineer can switch on a color overlay that tints every duct run on the canvas based on its velocity or pressure status, giving an instant visual health scan without selecting individual elements.

**Trigger:** Engineer opens the **Validation** tab in the right sidebar.

**Steps:**

1. Engineer clicks the **Issues** (Validation) tab in the right sidebar.
2. At the top of the Validation panel, above the existing issue list, a **"Duct Color Overlay"** radio group is visible with three options: **Off** · **By Velocity** · **By Pressure**.
3. Default state is **Off** — ducts render in their normal service color.
4. Engineer selects **By Velocity**:
  - Each duct run is tinted using ASHRAE-based thresholds per system type:
    | System Type | Green (acceptable) | Amber (approaching limit) | Red (over limit) |
    | --- | --- | --- | --- |
    | Supply — main trunk | < 1,500 FPM | 1,500–2,500 FPM | > 2,500 FPM |
    | Supply — branch | < 1,000 FPM | 1,000–1,800 FPM | > 1,800 FPM |
    | Return — main trunk | < 1,200 FPM | 1,200–2,000 FPM | > 2,000 FPM |
    | Return — branch | < 800 FPM | 800–1,200 FPM | > 1,200 FPM |
    | Exhaust / Outside Air | < 1,000 FPM | 1,000–1,500 FPM | > 1,500 FPM |
    | Unassigned (no system type) | < 1,200 FPM | 1,200–2,000 FPM | > 2,000 FPM |
  - **Grey** — no data (CFM not yet calculated, velocity is zero or unknown) or unsupported topology
5. Engineer selects **By Pressure**:
  - Each duct run is tinted based on its available static pressure as a percentage of source equipment SP:
    - **Green** — > 50% remaining
    - **Amber** — 20–50% remaining
    - **Red** — < 20% remaining
    - **Grey** — no data (no source equipment connected) or unsupported topology
6. Engineer selects **Off** — ducts return to their normal service color.
7. While the overlay is active, hovering over any duct run shows a small tooltip with its exact value and status — e.g. **"1,082 FPM — Within range"** (By Velocity), **"1.76 in.wg remaining — 88% available"** (By Pressure), or **"No calculation — invalid network topology"** for unsupported networks.
8. When a duct is selected while the overlay is active, the duct retains its green/amber/red overlay color. Selection is indicated only by the outline/border — the fill color is not replaced by the standard blue selection tint.
9. The preference persists for the session (not saved to the project file).
10. The rest of the Validation panel (issue list, auto-fitting buttons, and topology warnings) is unchanged and scrolls below the toggle.

**Wireframe — Validation Panel with Overlay Toggle:**

```wireframe

<html>
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; font-size: 13px; }
  body { background: #f8fafc; padding: 16px; }
  .panel { width: 260px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .panel-header { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .panel-header-title { font-weight: 600; font-size: 13px; color: #0f172a; }
  .badge-ok { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
  .badge-err { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
  .overlay-section { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
  .overlay-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .radio-group { display: flex; gap: 6px; }
  .radio-opt { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border: 1px solid #e2e8f0; border-radius: 20px; cursor: pointer; font-size: 12px; color: #475569; background: white; }
  .radio-opt.active { border-color: #2563eb; background: #eff6ff; color: #2563eb; font-weight: 600; }
  .radio-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #cbd5e1; }
  .radio-opt.active .radio-dot { border-color: #2563eb; background: #2563eb; }
  .section-body { padding: 10px 12px; }
  .action-btn { width: 100%; padding: 7px; border: 1px solid #e2e8f0; border-radius: 6px; background: #1e40af; color: white; font-size: 12px; font-weight: 500; margin-bottom: 6px; cursor: pointer; }
  .action-btn-outline { background: white; color: #374151; }
  .issue-row { padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #374151; }
  .issue-count { font-size: 10px; color: #94a3b8; margin-top: 4px; }
</style>
</head>
<body>

<div class="panel">
  <div class="panel-header">
    <span class="panel-header-title">Validation Status</span>
    <span class="badge-ok">All Clear</span>
  </div>

  <div class="overlay-section">
    <div class="overlay-label">Duct Color Overlay</div>
    <div class="radio-group">
      <div class="radio-opt" data-element-id="overlay-off">
        <div class="radio-dot"></div>
        Off
      </div>
      <div class="radio-opt active" data-element-id="overlay-velocity">
        <div class="radio-dot"></div>
        By Velocity
      </div>
      <div class="radio-opt" data-element-id="overlay-pressure">
        <div class="radio-dot"></div>
        By Pressure
      </div>
    </div>
  </div>

  <div class="section-body">
    <button class="action-btn" data-element-id="rerun-autofitting">Re-run Auto-Fitting</button>
    <button class="action-btn action-btn-outline" data-element-id="reset-selected">Reset Selected Override</button>
    <button class="action-btn action-btn-outline" data-element-id="reset-all">Reset All Manual Overrides</button>
    <div class="issue-count">0 locked overrides currently preserved from auto-fitting.</div>
  </div>

  <div style="padding: 0 12px 12px;">
    <div style="border: 1px dashed #e2e8f0; border-radius: 6px; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
      No validation issues
    </div>
  </div>
</div>

</body>
</html>
```

## Flow Summary

| Flow | Trigger | User Action | Outcome |
| --- | --- | --- | --- |
| 1 — Connection-Triggered Calculation | Duct endpoint snaps to another entity | Draw / move duct run | CFM + pressure silently recalculated across network |
| 2 — Selection-Aware Calculations Panel | Select duct run or fitting → open Calc tab | Click entity, click Calc tab | Selected Segment card shows CFM, FPM, friction rate, cumulative ΔP, available SP; fittings show all port CFMs in/out |
| 3 — Duct Color Overlay Toggle | Open Validation tab | Click radio option | Canvas duct strokes tinted green/amber/red by velocity or pressure; hover tooltip shows exact value; selection shown by outline only |