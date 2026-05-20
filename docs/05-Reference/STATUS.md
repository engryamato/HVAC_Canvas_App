# SizeWise HVAC Canvas - Project Status Dashboard

**Created:** 2026-01-11
**Version:** 1.0.0
**Status:** Phase 1 MVP Development
**Reference:** PRD.md v1.0.0 (2025-12-06)

---

## 🎯 Project Overview

**SizeWise HVAC Canvas** is a professional desktop HVAC design application focused on air-side ventilation system design with canvas-based drawing and real-time calculations.

### Key Objectives (from PRD)
- ✅ Canvas-based design workspace for rooms, ducts, and equipment
- ⚠️ Real-time HVAC calculations for airflow, velocity, and pressure drop
- ⚠️ Local-first architecture with .sws file format
- ⚠️ Bill of Materials generation with CSV export
- ⚠️ PDF export for professional documentation

---

## 📊 Development Status by Area

### 🖥️ Dashboard & Project Management
**Status:** 🟢 **UI COMPLETE / LOGIC IN PROGRESS**
**PRD Reference:** FR-DASH-001 through FR-DASH-005

**Completed:**
- Project structure setup
- Basic Next.js routing framework

**In Progress:**
- Project listing with metadata caching
- Create/Open project functionality
- Recent projects tracking

**Blocked:**
- .sws file format implementation
- Project folder configuration UI

---

### 🎨 Canvas Interface
**Status:** 🟡 **UI COMPLETE / LOGIC PENDING**
**PRD Reference:** FR-UI-001 through FR-UI-008

**Completed (UI):**
- Modern Glassmorphism Shell (Header, Sidebars, Toolbar)
- Zoom Controls & Minimap UI
- Equipment Library Structure
- Property Panel Structure

**Planned Components:**
- Left Sidebar: Project Details, Scope, Site Conditions
- Right Sidebar: Bill of Quantities, Calculations  
- Bottom Toolbar: File operations, process, settings
- FAB Tool: Quick entity creation (D key)

**Key Requirements:**
- Desktop-first (terminate on mobile < 640px)
- Responsive sidebars and toolbars
- Real-time notifications and warnings

---

### ⚙️ Calculations Engine
**Status:** 🔴 **NOT STARTED**
**PRD Reference:** FR-CALC-001 through FR-CALC-009

**Required Formulas:**
- ASHRAE 62.1 Room Ventilation: `Vbz = Rp × Pz + Ra × Az`
- ACH to CFM Conversion: `CFM = (ACH × Volume) / 60`
- Duct Velocity: `Velocity (FPM) = CFM × 144 / Area (sq in)`
- Velocity Pressure: `VP (in.w.g.) = (V / 4005)²`
- Duct Sizing (Round & Rectangular)
- Friction Loss (Darcy-Weisbach)
- Fitting Pressure Loss (Equivalent Length)

**Data Dependencies:**
- ASHRAE 62.1 lookup tables (Rp, Ra values by occupancy type)
- Material roughness factors
- Fitting equivalent lengths
- Velocity limits by application type

---

### 📋 Bill of Materials (BOM)
**Status:** 🔴 **NOT STARTED**
**PRD Reference:** FR-BOM-001 through FR-BOM-003

**Requirements:**
- Auto-generation from canvas entities
- Real-time updates
- Categories: Rooms, Ducts, Fittings, Equipment
- CSV export functionality

**Data Structure:**
```typescript
interface BOMLineItem {
  id: string;
  category: 'duct' | 'fitting' | 'equipment';
  subcategory: string;
  description: string;
  quantity: number;
  unit: 'LF' | 'EA' | 'SF';
  material?: string;
  size?: string;
  entityIds: string[];
}
```

---

### 💾 File Management
**Status:** 🔴 **NOT STARTED**
**PRD Reference:** FR-FILE-001 through FR-FILE-004

**Critical Components:**
- .sws JSON file format with schema validation
- Auto-save (60s) with backup (.sws.bak)
- Manual save (Ctrl+S)
- Load with migration support
- Project folder configuration

---

### 📤 Export System
**Status:** 🔴 **NOT STARTED**
**PRD Reference:** FR-EXPORT-001 through FR-EXPORT-003

**Export Types:**
- JSON (Full fidelity) - .sws.json
- CSV (BOM) - UTF-8 with BOM
- PDF (Documentation) - Canvas + BOM + calculations

---

### ⚙️ Settings
**Status:** 🔴 **NOT STARTED**
**PRD Reference:** FR-SETT-001 through FR-SETT-003

**User Preferences:**
- Unit system (Imperial/Metric)
- Auto-save interval
- Grid size
- Theme (Light/Dark)
- Project folder configuration

---

## 🔧 Technical Implementation Status

### Technology Stack
**Status:** 🟢 **COMPLETE**
- ✅ Tauri desktop runtime
- ✅ Next.js 14.x with React 18.x
- ✅ TypeScript 5.x
- ✅ Zustand state management
- ✅ Zod schema validation
- ✅ Vitest testing framework

### Architecture Patterns
**Status:** 🟡 **PARTIALLY IMPLEMENTED**

**Command Pattern:**
- ✅ Interface defined
- 🔴 Implementation needed

**Feature Slices Architecture:**
- ✅ Structure defined
- 🔴 Implementation needed

### Data Models
**Status:** 🟡 **SCHEMAS DEFINED**
- ✅ BaseEntity schema
- ✅ Room, Duct, Equipment, Fitting entities
- ✅ Project file schema
- 🔴 Implementation needed

---

## 📝 Document Analysis & Updates Needed

### Current Documentation Status

| Document | Status | Issues Found | Updates Needed |
|----------|--------|--------------|----------------|
| **PRD.md** | ✅ COMPLETE | Reference document, no changes needed | None |
| **README.md** | 🔴 OUTDATED | Basic project info only | Comprehensive project overview |
| **ARCHITECTURE.md** | 🔴 OUTDATED | Very basic (65L) | Detailed architecture documentation |
| **GLOSSARY.md** | ⚠️ NEEDS REVIEW | Basic terms defined | Add HVAC-specific terms from PRD |
| **TESTING.md** | ⚠️ NEEDS REVIEW | Basic testing setup | Detailed test strategy and cases |
| **FAQ.md** | ⚠️ NEEDS REVIEW | Good content (1068L) | Sync with current PRD status |

### Critical Document Updates Required

#### 1. README.md - URGENT
**Why:** First impression for developers and users
**Needed:**
- Comprehensive project description
- Setup instructions
- Feature overview
- Development guidelines
- Links to all other docs

#### 2. ARCHITECTURE.md - HIGH
**Why:** Technical implementation guidance
**Needed:**
- Detailed system architecture
- Component relationships
- Data flow diagrams
- Implementation patterns
- Design decisions

#### 3. GLOSSARY.md - MEDIUM
**Why:** HVAC terminology consistency
**Needed:**
- Add PRD Appendix C terms
- Include calculation formulas
- Add technical abbreviations
- Material specifications

#### 4. TESTING.md - MEDIUM  
**Why:** Quality assurance framework
**Needed:**
- Test strategy aligned with PRD acceptance criteria
- Unit test coverage requirements
- E2E test scenarios
- Performance benchmarks
- Validation procedures

### Documents Up-to-Date

| Document | Reason for Current Status |
|----------|---------------------------|
| **PRD.md** | Comprehensive 1170L specification |
| **USER_JOURNEY.md** | Basic but functional |
| **CI_CD.md** | Detailed pipeline setup |
| **TROUBLESHOOTING.md** | Comprehensive issues/solutions |
| **QUICK_START.md** | Good starter guide |

---

## 🚀 Next Steps & Priorities

### Immediate (This Sprint)
1. **Create Canvas Foundation**
   - Set up Canvas 2D rendering system
   - Implement basic drawing tools
   - Create entity management system

2. **Implement Project File Format**
   - Define .sws JSON schema
   - Create save/load functionality
   - Add backup system

3. **Build Dashboard UI**
   - Project listing and management
   - Create/Open project flow
   - Recent projects tracking

### Short Term (Next 2 Sprints)
1. **Entity System**
   - Room, Duct, Equipment, Fitting entities
   - Property validation
   - Inspector panel integration

2. **Basic Calculations**
   - Room ventilation (ASHRAE 62.1)
   - Duct velocity and sizing
   - BOM auto-generation

3. **Export Functionality**
   - CSV BOM export
   - Basic PDF generation

### Medium Term (Phase 1 Complete)
1. **Advanced Features**
   - Full calculations engine
   - Pressure drop calculations
   - Fitting pressure loss

2. **Polish & Optimization**
   - Performance optimization (60fps target)
   - Error handling and recovery
   - User onboarding

---

## 📋 Acceptance Criteria Progress

### Current Progress: **0/33 Complete**

| Category | Total | Complete | In Progress | Not Started |
|----------|-------|----------|-------------|-------------|
| Dashboard | 5 | 0 | 0 | 5 |
| Canvas | 8 | 0 | 0 | 8 |
| Inspector | 5 | 0 | 0 | 5 |
| Calculations | 5 | 0 | 0 | 5 |
| File Management | 5 | 0 | 0 | 5 |
| Export | 5 | 0 | 0 | 5 |

**Overall Completion: 0%**

---

## 🔍 Risk Assessment

### High Risks
1. **Performance Requirements** - 60fps with 500 entities
2. **Calculation Accuracy** - ±1% of manual calculation
3. **File Format Complexity** - .sws with migration support

### Medium Risks
1. **Cross-platform Compatibility** - Windows/Mac/Linux
2. **User Experience Design** - Professional workflow
3. **Testing Coverage** - Comprehensive validation

### Low Risks
1. **Technical Stack** - Well-established technologies
2. **Documentation** - Comprehensive PRD available
3. **Development Environment** - Modern tooling setup

---

## 📞 Contact & Support

**Architecture Team:** Maintains PRD and technical decisions
**Development Team:** Implements features following PRD specifications
**Product Team:** Defines user requirements and acceptance criteria

---
*Last Updated: 2026-01-21*
*Next Review: Weekly sync*
