# Epic Brief — Magnetic Link Calculation Propagation

## Summary

SizeWise currently lets engineers draw duct runs and fittings on the canvas and snap them together via magnetic connections, but those connections carry no engineering data — airflow and pressure values sit static and disconnected from the actual network topology. This Epic wires the magnetic connection system into a live calculation engine: every time a connection is made or broken, the duct network is traversed to propagate CFM (from terminal equipment upstream) and static pressure (from source equipment downstream), factoring in friction loss per duct segment and equivalent-length loss per fitting. Results are surfaced in the Calculations panel when a segment or fitting is selected, and an optional color overlay on the canvas gives engineers an at-a-glance pressure/velocity health view. In v1, the calculation layer supports only clear single-source, tree-like duct networks; ambiguous or invalid topologies fail safely with neutral overlays, unavailable values, and Validation panel warnings.

## Context & Problem

**Who is affected:** HVAC engineers using the SizeWise canvas to lay out supply, return, and exhaust duct systems.

**Where in the product:** The canvas editor — specifically the duct run drawing tool, the right-sidebar Calculations tab, and the Validation tab.

**Current pain:** After drawing a duct network, engineers have no feedback on whether the system is balanced or over-pressured. CFM and static pressure fields exist in the schema but are never automatically populated from the network topology. Engineers must mentally trace the system or use an external tool to verify that pressure is available at each branch. There is also no visual signal on the canvas to flag velocity or pressure problems without selecting each element individually.

## Scope

| In scope | Out of scope |
| --- | --- |
| CFM propagation from terminals (diffusers, hoods) upstream via existing Leaf Peeling algorithm | Auto-sizing duct dimensions based on CFM |
| Downstream static pressure propagation from source equipment (AHU, RTU, fan, furnace) | Manual CFM entry per duct |
| Friction loss per duct run segment (using existing `calculateFrictionLoss`) | Inline canvas callout labels on ducts |
| Fitting pressure loss via equivalent length (using existing `calculateFittingLoss`) | Multi-zone or multi-system balancing |
| Cumulative pressure drop and available static pressure stored per duct run and fitting | Duct leakage or thermal calculations |
| Selection-aware Calculations panel for duct runs and fittings, including fitting port airflow display |  |
| Fail-safe topology validation for single-source, tree-like networks only in v1 |  |
| Color-coded duct overlay toggle in Validation panel (Off / By Velocity / By Pressure), with neutral fallback on unsupported networks |  |

## Who Benefits

- **Design engineers** get real-time feedback on airflow and pressure as they draw — no more manual tracing.
- **Project reviewers** can scan the canvas for red/yellow ducts to spot over-velocity or pressure-starved branches instantly.
- **The platform** gains the foundational calculation layer that future features (auto-sizing, load reports, export) will build on.