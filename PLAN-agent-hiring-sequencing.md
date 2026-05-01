# Agent Hiring Assessment For SizeWise HVAC Canvas

## Scope

Assess which additional agents are required to advance the active company goal for the SizeWise HVAC Canvas App without hiring in this issue.

Current staffed agents:

- CEO
- CTO
- FoundingEngineer

Observed project signals used for this assessment:

- The active goal is a modular HVAC engineering suite with standards-compliant calculations, intelligent validation, and real-time design tools.
- The codebase already spans a large Next.js + Tauri surface with `508` source files, `209` test files, and `75` E2E files under `hvac-design-app/`.
- Architecture is broad but concentrated in a few high-coupling files and mixed legacy/current state paths, especially canvas, persistence, and autosave orchestration.
- The PRD sets a strict calculation accuracy target of `±1%` and positions standards compliance as core product value.
- The current team already covers technical direction and general implementation, but not independent domain validation or independent acceptance ownership.

## Recommendation

### Hire Now

1. HVAC Domain Validator Agent

- This is the highest product-risk gap because the value proposition depends on standards-compliant calculations and validation, not just UI completion.
- The PRD requires engineering accuracy and HVAC-specific formula, lookup-table, and compliance behavior that should not be left to generalist coding alone.
- This role should define validation rules, reference tables, and acceptance inputs for calculation features before more implementation velocity creates incorrect behavior at scale.

2. QA and Acceptance Agent

- The codebase already has enough surface area and coupling that independent regression coverage is now leverage, not overhead.
- Canvas editing, persistence, Tauri/web parity, export, and undo/autosave flows are high-regression areas that benefit from explicit ownership.
- This role should convert core user journeys and defect reports into stable acceptance checks while the FoundingEngineer keeps shipping.

### Hire Later

1. UI/UX Design Agent

- The product is interaction-heavy and will benefit from dedicated UX once the core engineering workflows stabilize.
- It is useful soon, but not ahead of domain correctness and regression control.
- Until then, UX decisions can be absorbed by the CTO plus existing repo documentation and targeted implementation iteration.

2. Documentation Agent

- The repository already contains substantial architecture, PRD, testing, workflow, and phase documentation.
- Dedicated documentation leverage becomes more valuable after the domain model and acceptance workflow stabilize, otherwise the agent mostly documents moving targets.
- For now, CTO and FoundingEngineer can keep critical technical docs current as part of feature delivery.

3. Canvas Renderer Agent

- Rendering is important, but it is still part of the core engineering lane rather than a justified standalone function at current team size.
- The better near-term split is domain validation plus QA while implementation remains with the FoundingEngineer under CTO direction.
- Revisit this role if renderer complexity or 2D/3D visualization becomes a sustained bottleneck.

4. Backend and Schema Agent

- The current product is local-first and does not yet justify a separate backend owner as an immediate hire.
- Persistence and schema complexity are real, but still fit within the existing engineering structure until cloud sync, shared workspaces, or service-backed collaboration become active roadmap items.
- Revisit once server-side systems or multi-user data contracts become part of the delivery path.

### Not Needed Now

1. Product Manager Agent

- With a three-agent company, backlog shaping and roadmap sequencing should remain with the CEO and CTO.
- Adding a PM layer now adds coordination overhead without creating enough execution leverage.

2. DevOps and Infrastructure Agent

- The stack does not yet show production infrastructure complexity that warrants a dedicated owner.
- Current needs are CI hygiene, release discipline, and Tauri/web parity, which can remain inside engineering execution for now.

3. Research and Intelligence Agent

- Research work should be absorbed by the HVAC Domain Validator Agent when domain references are needed.
- Splitting research away from validation would create handoff overhead too early.

4. Code Review Agent

- Review is currently a CTO responsibility.
- A separate reviewer before there are multiple implementation agents would create process without enough throughput benefit.

5. Content and Marketing Agent

- Not part of the immediate technical execution path for the current company goal.

6. Finance and Budget Agent

- Current staffing scale and spend do not justify a dedicated finance agent.
- Budget and spend controls should remain with the CEO.

## Functional Coverage Decision

### Separate Agent Now vs absorb into existing roles

- PM: absorb into CEO + CTO now.
- QA: separate now.
- UX: absorb now, separate later.
- DevOps: absorb now.
- HVAC domain validation: separate now.
- Documentation: absorb now, separate later.

## Hiring Sequence

1. Hire HVAC Domain Validator Agent first.
2. Hire QA and Acceptance Agent second.
3. Hire UI/UX Design Agent third if interaction friction starts slowing adoption or rework.
4. Hire Documentation Agent fourth if engineering throughput or onboarding starts being constrained by stale docs.

## Reporting Structure

- HVAC Domain Validator Agent reports to CTO.
- QA and Acceptance Agent reports to CTO.
- UI/UX Design Agent, if hired later, should report to CTO until a broader product function exists.
- Documentation Agent, if hired later, should report to CTO and work from engineering-approved source material.

## Why This Sequence

- First solve correctness risk.
- Then solve regression and acceptance risk.
- Then improve usability and communication quality after the underlying engineering behavior is trustworthy enough to stabilize.

## Acceptance Criteria Check

- `hire now`, `hire later`, and `not needed now` recommendations are explicit.
- PM, QA, UX, DevOps, HVAC domain validation, and documentation are each classified as separate now or absorbed now.
- The next hiring priority is the HVAC Domain Validator Agent.
