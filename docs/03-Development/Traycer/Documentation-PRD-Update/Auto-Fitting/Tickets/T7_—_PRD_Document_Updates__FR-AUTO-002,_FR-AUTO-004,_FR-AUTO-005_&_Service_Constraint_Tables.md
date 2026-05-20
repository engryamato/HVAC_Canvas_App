# T7 — PRD Document Updates: FR-AUTO-002, FR-AUTO-004, FR-AUTO-005 & Service Constraint Tables


## Overview

Update the SizeWise PRD to formally specify the Resolver & Strategy architecture, the Connector Logic Matrix, industrial service constraint tables, 6 new fitting types, the Flat Side Rule, and Ghost Preview behavior. This is the primary deliverable of the Epic — the documentation that governs future implementation.

## Spec Reference
`spec:bb54956e-ee69-4825-978d-2e1f03123919/62771ba8-bf9d-40a3-b6f5-c39a5e328724` (Epic Brief — What This Epic Defines)
`spec:bb54956e-ee69-4825-978d-2e1f03123919/5acac42a-5087-4fcd-85a1-8b1b247c84d7` (Tech Plan — all sections)

---

## Scope — `file:docs/SizeWize_PRD_edited_full.md`

### 1. Update FR-AUTO-002: Fitting Insertion

Replace the current two-line spec with the full Resolver & Strategy specification:
- Module structure (`FittingResolver`, `ITopoStrategy`, 4 strategy engines, `ServiceRules`, `GeometryRules`)
- Two execution modes (preview / commit)
- Compound `FittingRequest[]` chain ordering rule (Transition first, Turn second)
- Two-class validation (`geometry_impossible` hard block, `service_violation` warn-and-flag)
- Ghost Preview snap-gate performance requirement

### 2. Add FR-AUTO-004: Shape & Size Transition Logic (new section)

Include:
- **Connector Logic Matrix** — full table (Source Shape × Target Shape × Dimensions → Action → Component)
- **Flat Side Rule** — three alignment modes (Center-Line default, Flat-Top, Flat-Bottom) with auto-default logic (`Obstruction_Above == true` → Flat-Top)
- **Application Constraints Lookup Table** — JSON-style constraint definitions for all 4 industrial service types:

| Service | forbiddenFittings | requiredMaterial | minSlope | maxVelocityFPM | allowFlex |
|---|---|---|---|---|---|
| `kitchen_exhaust` | `[transition_square_to_round]` (spin-ins) | `black_iron_16ga` | 3 in/ft | 4000 | false |
| `generator_exhaust` | — | `aluminized_steel` | — | 5000 | false |
| `commercial_supply` | — | `galvanized` | — | 1500 | true (max 60") |
| `fume_hood` | `[elbow_mitered]` | `stainless_304` | — | 2500 | false |

### 3. Add FR-AUTO-005: Intelligent Transitions (new user story)

User story:
> *As an HVAC Designer, I want the system to automatically insert the correct Square-to-Round or Taper when I connect mismatched ducts, so that I don't have to manually search the catalog for adapters.*

Include the 7-step flow (snap proximity → shape mismatch detection → service check → length calculation → entity insertion → duct snap).

### 4. Update Fitting Schema section (Technical Requirements)

Add 6 new `FittingType` enum values with descriptions. Add `IndustrialMaterial` enum. Add `industrialConstraints` object definition to Service schema section.

### 5. Add Acceptance Criteria (AC-AUTO-004, AC-AUTO-005)

- Shape mismatch detection fires on every duct connection attempt
- Service rule enforcement blocks or flags forbidden fittings
- Ghost Preview shows green/red before mouse release
- Compound chain (Transition + Turn) is inserted as two separate entities in correct order

---

## Out of Scope
- No code changes — documentation only
- No changes to other PRD sections (FR-DASH, FR-UI, FR-CALC, etc.)

## Acceptance Criteria
- [ ] FR-AUTO-002 fully describes the Resolver & Strategy architecture
- [ ] FR-AUTO-004 contains the complete Connector Logic Matrix table
- [ ] FR-AUTO-004 contains all 4 industrial service constraint rows
- [ ] FR-AUTO-005 user story and 7-step flow are present
- [ ] 6 new `FittingType` values are documented in the Technical Requirements schema section
- [ ] `IndustrialMaterial` enum and `industrialConstraints` object are documented
- [ ] AC-AUTO-004 and AC-AUTO-005 acceptance criteria are added

## Dependencies
- Can run in parallel with T1–T6 (documentation only)
- Recommended to complete after T5 is implemented so PRD reflects the final validated architecture
    