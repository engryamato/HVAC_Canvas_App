# Instruction Brief — PRD Director: Assemble the Consolidated v1 PRD

**Role:** You are the PRD Director. Your job is to merge the source materials into ONE clean, execution-ready PRD ("SizeWise Ductwork Interaction Architecture — v1"). You are an editor/integrator, not a redesigner: do not invent new requirements or change technical intent. Resolve conflicts, deduplicate, and structure.

## Source materials (the user will attach the first)

1. **Previous PRD** (the user attaches it) — the prior interaction-architecture write-up.
2. **`Ductwork_Interaction_Architecture_Plan.md`** (this repo) — the layered working doc: Part 0 (verified reality) + Scope boundaries, Parts 1–6, including the §21 truth table, §24 Phase 0 gate, §30 invariants/anti-requirements, §31 open questions, Part 4 estimation spec, Part 5 hardening, Part 6 CAS registry + Axial map.
3. **`PRD_Toolbar_Redesign.md`** — Part 1 (shipped pill) + Part 2 (inline slide-open options); referenced, not re-litigated.

Where sources conflict, precedence is: **Part 5 (normative) > Part 6 > Parts 1–4 > previous PRD**. State any conflict you resolved in a short changelog at the end.

## Required output structure (use exactly this 8-section shape)

1. **Executive summary + core principle** (Toolbar=start tools / CAS=edit selected / Inspector=full properties / Axial=fast fitting options / System=auto). Include the **Scope boundaries** block (primary scope vs follow-on PRDs vs spec-only).
2. **Verified reality** (audit-backed, code-grounded; carry the `file:line` citations).
3. **Target interaction model** — responsibility matrix + the §21 truth table with the state enums (`SelectionState` / `CanvasMode` / `OverlayState`).
4. **Surface specs (one section each):**
   - Toolbar (buttons + invariants + anti-requirements)
   - CAS (anchor/lifecycle §22, keyboard/a11y, the §7A registry table, allowed/forbidden)
   - Inspector (full property table; what may/may not duplicate CAS)
   - Axial (gesture bindings §23, the §9A–9D map, non-goals, engineer contract)
5. **System logic + HVAC correctness prerequisites** — auto-place/auto-calc rules (§6), tee/wye convention + hysteresis (§28), grease/combustion forced confirmation (§29), weight/surface-area prerequisites (§27), manual-first sizing (§15), provenance (§16).
6. **Implementation phases with hard dependencies** — promote **Phase 0 (`entityActions`)** as the gating prerequisite for CAS + Axial (§24); keep the dependency graph.
7. **Acceptance tests + risk matrix** — pull the per-surface invariants/tests/anti-requirements (§30) up next to their surfaces; keep the consolidated risk table.
8. **Open questions / decisions needed** — the §31 register (Q1–Q10), each with owner + default.

## Hard rules (do not violate)

- **Preserve statement-type tags** throughout: `[Verified]` (code-backed, keep the citation), `[Decision]` (settled), `[Proposal]` (to implement, not yet committed), `[Open]` (needs a decision). Never promote a `[Proposal]`/`[Assumption]` to `[Verified]` without a code citation.
- **Shape enum is `rectangular | round | flat_oval | flexible`** (code `DuctRunShape`). Replace every `flex_round` with `flexible`. Note "flexible treated as round for fitting-option gating."
- **Part 6 `variant field` keys are `[Proposal]` placeholders** — most don't exist in `fitting.schema.ts`. Keep them tagged; reference §31 Q10 (schema reconciliation) rather than implying they exist.
- **CAS shape-change compatibility guard depends on the port-compatibility matrix (§31 Q9)** — keep it `[Open]`; don't pretend the matrix is defined.
- **Keep estimation/pricing (Part 4 §20), persisted project mode (§17), pressure/seal schema (§27), and metric (Q8) as explicitly OUT of this PRD's primary scope** (follow-on PRDs). The interaction work must not be gated on them.
- **No code changes.** This is a documentation deliverable only.
- **Do not drop content** — if something in a source has no home in the 8-section shape, put it under the nearest section or an appendix; flag it, don't delete it.

## Definition of done (the finished PRD must satisfy)

1. Every section above is present and populated; no example-level placeholders remain in CAS/Axial (use the Part 6 registry/map).
2. No statement reads more certain than its evidence (every `[Verified]` has a citation; judgments are `[Decision]`/`[Assumption]`).
3. The truth table references the three state enums and the per-surface acceptance tests reference them.
4. Phase 0 is unambiguously the gate for CAS + Axial, with its 3 acceptance criteria.
5. Scope boundaries make clear what ships in these phases vs follow-on PRDs.
6. A short **changelog** at the end lists: conflicts resolved (with precedence used), any content relocated, and the full Open-Questions list still needing owners.
7. Output is a single self-contained markdown document that a new engineer could implement from without asking a clarifying question that the PRD could have answered.

## Tone & format

Direct, concrete, builder-to-builder. Tables over prose for registries/matrices. No filler. Cite `file:line` for verified claims. Keep it one document.
