# Plan: Canvas Calculations Presentable

## Goal
Bring `docs/Pencil/Canvas/Calculations/Canvas_Calculations.pen` up to the same visual standard as `docs/Pencil/Canvas/Dailogs/DuctworkElementsPropertiesDialog.pen` by converting the calculations sidebar into a coherent inspector-style panel.

## Scope
- Fix the active tab state so `Calculations` is visually selected.
- Recompose `Canvas_Calculations` into a stacked panel with consistent padding, spacing, borders, and card treatment.
- Strengthen typography hierarchy for the header and section labels.
- Keep the existing calculation content and engineering meaning intact.

## Constraints
- Work only within the `.pen` document.
- Preserve current information architecture and labels where practical.
- Avoid introducing new product behavior; this is a presentation and consistency pass.

## Edge Cases
- The calculations frame currently exceeds the visible sidebar height and should fit within the sidebar viewport.
- Existing absolute-positioned child content must remain readable after moving to a structured parent layout.

## Verification
- Validate JSON structure with `jq`.
- Re-read the edited `Canvas_Calculations` block and confirm:
  - `Calculations` tab is active.
  - `Canvas_Calculations` fits the visible sidebar height.
  - The panel uses a clear top header plus evenly spaced content cards.
