# T3 — Turn & Termination Strategies


## Overview

Implement the two simpler Strategy engines: `TurnStrategy` (direction changes → elbows) and `TerminationStrategy` (terminal connections → caps, end boots). Both implement `ITopoStrategy` and return `FittingRequest[]`.

## Spec Reference
`spec:bb54956e-ee69-4825-978d-2e1f03123919/5acac42a-5087-4fcd-85a1-8b1b247c84d7` — Section 3 (Module Map: TurnStrategy, TerminationStrategy)

---

## Scope

### 1. `TurnStrategy.ts` — `src/features/canvas/auto-fitting/strategies/TurnStrategy.ts`

- Implements `ITopoStrategy`
- Asserts `ctx.connections.length === 2` at entry
- Selection logic:

| Condition | Output |
|---|---|
| `ctx.constraints.industrial?.preferredElbowType === 'elbow_mitered'` | `elbow_mitered` |
| `Math.abs(ctx.angleDeg - 45) <= 15`="" |="" `elbow_45`="" Default="" `elbow_90`="" -="" Returns="" `FittingRequest[]`="" with="" one="" item;="" empty="" array="" if="" angle="" is="" within="" straight="" tolerance="" (≤="" 15°)="" Material="" defaults="" to="" `ctx.constraints.service?.material="" ??="" 'galvanized'`="" ###="" 2.="" `TerminationStrategy.ts`="" —="" `src="" features="" canvas="" auto-fitting="" strategies="" TerminationStrategy.ts`="" Implements="" `ITopoStrategy`="" Selects="" between="" `cap`,="" `end_boot`,="" `grille`="" based="" on="" `ctx.topologyType="==" 'termination'`="" and="" target="" entity="" type="" metadata="" in="" `TopologyContext`="" item="" ---="" ##="" Out="" of="" Scope="" No="" shape-mismatch="" logic="" (that's="" `TransitionStrategy`)="" junction="" `JunctionStrategy`)="" Acceptance="" Criteria="" [="" ]="" `TurnStrategy`="" returns="" `elbow_mitered`="" when="" `preferredElbowType`="" set="" industrial="" constraints="" for="" 45°="" ±="" 15°="" angles="" connections="" `TerminationStrategy`="" `end_boot`="" a="" rectangular="" terminal="" Both="" return="" (never="" single="" object)="" Unit="" tests="" cover="" all="" selection="" branches="" constructed="" inputs="" Dependencies="" **T1**="" (types),="" **T2**="" (ServiceRules="" constraint="" lookup)="" <="" TRAYCER_TICKET_DESCRIPTION="">
  </=>