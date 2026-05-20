# Epic Brief: Professional HVAC Takeoff Rendering

## Summary

The HVAC Canvas App currently renders ductwork, fittings, and equipment using basic geometric shapes (filled rectangles, simple icons) that appear unprofessional and create credibility issues with both users and clients. HVAC designers and engineers are receiving direct complaints about the "high school project" appearance and struggle to confidently share takeoffs with clients. Competitors offer professional-looking drawings that follow industry standards (ASHRAE/SMACNA), putting our product at a competitive disadvantage. This Epic transforms the visual rendering to industry-standard technical drawings with double-line ducts, proper insulation hatching, accurate fitting geometry, and enhanced equipment visualization. Success means users confidently share takeoffs, drawings are immediately recognizable as professional HVAC work, and we receive positive feedback on visual quality.

## Context & Problem

### Who's Affected

**Primary Users: HVAC Designers & Engineers**
- Experience embarrassment when sharing takeoffs with clients
- Struggle with readability and interpretation of current simple shapes
- Lack confidence in the tool's professional credibility
- Compare unfavorably to competitor tools during evaluations

**Secondary Users: Clients & Stakeholders**
- Question the credibility and accuracy of takeoffs based on appearance
- Have difficulty interpreting what simple rectangles and basic shapes represent
- Expect industry-standard ASHRAE/SMACNA drawing conventions
- Form negative first impressions that affect trust in the entire deliverable

**Business Impact:**
- Competitive disadvantage against tools with professional rendering
- Lost credibility in demos and sales presentations
- Reduced user adoption due to appearance concerns
- Constant credibility issue affecting all stages of the product lifecycle

### Where in the Product

**Canvas Rendering System:**
- `file:hvac-design-app/src/features/canvas/renderers/DuctRenderer.ts` - Currently renders ducts as simple filled rectangles
- `file:hvac-design-app/src/features/canvas/renderers/EquipmentRenderer.ts` - Currently renders equipment as basic shapes with minimal icons
- `file:hvac-design-app/src/features/canvas/tools/DuctTool.ts` - Drawing preview during active duct creation
- **Missing:** No fitting renderer exists - fittings are not properly visualized

**Impact Scope:**
- All canvas views where HVAC components are displayed
- Drawing preview during active design work
- Final rendered entities after placement
- Exported/printed deliverables
- Presentation and demo scenarios

### Current Pain

**Usability Issues:**
1. **Difficult to Read:** Simple rectangles don't convey duct dimensions, shape (round vs. rectangular), or insulation status clearly
2. **Missing Context:** No visual distinction between supply, return, and exhaust systems beyond color
3. **Incomplete Information:** Insulation properties exist in data (`insulated`, `insulationThickness`) but aren't rendered
4. **No Fitting Visualization:** Elbows, tees, and reducers lack proper geometric representation

**Credibility Issues:**
1. **Unprofessional Appearance:** Direct user feedback describes output as "high school project" quality
2. **Industry Standards Gap:** Competitors follow ASHRAE/SMACNA conventions; we don't
3. **Trust Deficit:** Clients question accuracy when drawings don't look professional
4. **Competitive Disadvantage:** Tool evaluations favor competitors with better visual quality

**Business Consequences:**
- Users hesitate to share takeoffs externally
- Negative feedback in demos and reviews
- Perception of the tool as incomplete or amateur
- Barrier to adoption by professional HVAC firms

### What Triggered This Now

**Competitive Pressure:** Other HVAC design tools have professional rendering that follows industry standards. Users are comparing our output directly to competitors and finding it lacking. This is no longer a "nice to have" but a competitive necessity.

### Success Criteria

**User Confidence:**
- HVAC designers confidently share takeoffs with clients without hesitation or disclaimers
- No complaints about unprofessional appearance
- Users describe the tool as "professional-grade"

**Visual Recognition:**
- Takeoffs are immediately recognizable as professional HVAC technical drawings
- Industry professionals can interpret drawings without confusion
- Drawings follow ASHRAE/SMACNA conventions that users expect

**Reduced Confusion:**
- Fewer questions about what drawings represent
- Clear visual distinction between duct types, shapes, and insulation
- Accurate fitting geometry that matches real-world components

**Positive Feedback:**
- Positive comments on visual quality in demos and reviews
- Competitive parity or advantage in tool evaluations
- Increased user adoption and retention

### Constraints

**Development Time:** Need to balance quality with speed. The solution must be professional but implemented efficiently without over-engineering.

**Performance:** Enhanced rendering (double-lines, hatching, shadows) must not degrade canvas performance on large, complex drawings.

**Backward Compatibility:** All existing projects will auto-upgrade to new rendering. No migration or user action required.

### Out of Scope

- Custom rendering styles or user-configurable visual themes
- 3D visualization or isometric views
- Animation or interactive rendering effects
- Export format changes (PDF, DWG, etc.) - this Epic focuses on canvas rendering only