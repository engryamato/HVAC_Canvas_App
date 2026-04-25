# Draft: Hydration Audit for HVAC Canvas App

## Context
- App: hvac-design-app (Next.js App Router) with server components by default and client components indicated with "use client".
- Objective: identify what needs hydration (i.e. which parts run on client and require hydration) and map hydration boundaries per route.

## Requirements (confirmed)
- Analyze hydration needs for the Next.js App Router app within hvac-design-app.
- Identify all Client Components (files with or without explicit "use client" directive) and browser-API usage that would necessitate hydration.
- Map hydration boundaries on a per-route basis (which server components can stay server, which should be client-bound).
- Propose a hydration strategy to optimize initial render and interactivity.

## Research Findings (to be filled)
- [Finding]: [Notes]
- [Finding]: [Notes]

## Open Questions
- [ ] Confirm target repository/path: hvac-design-app (root path yli hvac-design-app/ or app/?)
- [ ] Are there any constraints due to Tauri (desktop) environment affecting hydration boundaries?
- [ ] Do you want hydration optimized for minimal client JS or for rapid interactivity (i.e., heavier hydration up-front vs progressive hydration)?
- [ ] Any components known to be browser-only (e.g., window or localStorage usage in server components)?

## Scope Boundaries
- INCLUDE: Client components, server components, dynamic imports, data fetching strategies, and interop between them
- EXCLUDE: Backend logic unrelated to Next.js app routing; non-Next.js microservices

## Next Steps (proposed)
- Step 1: Scan codebase for "use client" directives and browser-APIs usage in server components.
- Step 2: Build a per-route hydration map: which routes render which components and their hydration requirements.
- Step 3: Propose a hydration strategy and potential refactors (e.g., convert some components to server components/limit hydration).
- Step 4: Create a plan at .sisyphus/plans/hydration-audit.md with precise task list and acceptance criteria.

## Draft Notes
- This draft will be updated after exploration results.
