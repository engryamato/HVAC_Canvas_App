# User Journeys Documentation

## Overview

This directory contains comprehensive user journey documentation for the SizeWise HVAC Canvas App. Each user journey maps to specific product requirements, user stories, and test implementations, ensuring complete coverage of all application functionality.

**Total User Journeys:** 129 documents across 15 categories

---

## Quick Navigation

| Category | Count | Priority | Status |
|----------|-------|----------|--------|
| [00 - Getting Started](#00-getting-started) | 5 | Medium | 🟡 Planned |
| [01 - Project Management](#01-project-management) | 8 | **High** | 🟢 In Progress |
| [02 - Canvas Navigation](#02-canvas-navigation) | 8 | **High** | 🟡 Planned |
| [03 - Entity Creation](#03-entity-creation) | 16 | **High** | 🟢 In Progress |
| [04 - Selection & Manipulation](#04-selection-and-manipulation) | 12 | **High** | 🟡 Planned |
| [05 - Property Editing](#05-property-editing) | 10 | **High** | 🟡 Planned |
| [06 - Calculations](#06-calculations) | 10 | **High** | 🟡 Planned |
| [07 - Undo/Redo](#07-undo-redo) | 9 | **High** | 🟡 Planned |
| [08 - File Management](#08-file-management) | 10 | **Critical** | 🟢 In Progress |
| [09 - Export](#09-export) | 6 | **High** | 🟡 Planned |
| [10 - BOM Panel](#10-bom-panel) | 5 | Medium | 🟡 Planned |
| [11 - Keyboard Shortcuts](#11-keyboard-shortcuts) | 7 | Medium | 🟡 Planned |
| [12 - Error Handling](#12-error-handling) | 6 | **High** | 🟡 Planned |
| [13 - Settings & Preferences](#13-settings-and-preferences) | 5 | Medium | 🟡 Planned |
| [14 - Sidebar Interactions](#14-sidebar-interactions) | 7 | Medium | 🟡 Planned |
| [15 - Complete Workflows](#15-complete-workflows) | 7 | **High** | 🟡 Planned |

---

## Document Template

Each user journey follows this structure:

```markdown
# [UJ-XX-NNN] User Journey Title

## Overview
## PRD References
## Prerequisites
## User Journey Steps
## Edge Cases
## Error Scenarios
## Keyboard Shortcuts
## Related Elements
## Test Implementation
## Notes
```

---

## 00 - Getting Started

Initial user experience and orientation.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-GS-001 | [First Launch](./00-getting-started/UJ-GS-001-FirstLaunch.md) | Medium |
| UJ-GS-002 | [Dashboard Navigation](./00-getting-started/UJ-GS-002-DashboardNavigation.md) | Medium |
| UJ-GS-003 | [Help and Shortcuts](./00-getting-started/UJ-GS-003-HelpAndShortcuts.md) | Medium |
| UJ-GS-006 | [Environment Detection](./00-getting-started/UJ-GS-006-EnvironmentDetection.md) | **Critical** |
| UJ-GS-007 | [Integrity Check](./00-getting-started/UJ-GS-007-IntegrityCheck.md) | **Critical** |

---

## 01 - Project Management

Creating, opening, managing, and organizing projects.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-PM-001 | [Create New Project](./01-project-management/UJ-PM-001-CreateNewProject.md) | **High** |
| UJ-PM-002 | [Open Existing Project](./01-project-management/UJ-PM-002-OpenExistingProject.md) | **High** |
| UJ-PM-003 | [Recent Projects Access](./01-project-management/UJ-PM-003-RecentProjectsAccess.md) | High |
| UJ-PM-004 | [Rename Project](./01-project-management/UJ-PM-004-RenameProject.md) | High |
| UJ-PM-005 | [Duplicate Project](./01-project-management/UJ-PM-005-DuplicateProject.md) | High |
| UJ-PM-006 | [Archive Project](./01-project-management/UJ-PM-006-ArchiveProject.md) | High |
| UJ-PM-007 | [Delete Project](./01-project-management/UJ-PM-007-DeleteProject.md) | High |
| UJ-PM-008 | [Configure Project Folder](./01-project-management/UJ-PM-008-ConfigureProjectFolder.md) | Medium |

---

## 02 - Canvas Navigation

Pan, zoom, grid controls, and viewport manipulation.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-CN-001 | [Pan Canvas](./02-canvas-navigation/UJ-CN-001-PanCanvas.md) | High |
| UJ-CN-002 | [Zoom Canvas](./02-canvas-navigation/UJ-CN-002-ZoomCanvas.md) | High |
| UJ-CN-003 | [Zoom Controls](./02-canvas-navigation/UJ-CN-003-ZoomControls.md) | Medium |
| UJ-CN-004 | [Fit to Content](./02-canvas-navigation/UJ-CN-004-FitToContent.md) | Medium |
| UJ-CN-005 | [Reset View](./02-canvas-navigation/UJ-CN-005-ResetView.md) | Low |
| UJ-CN-006 | [Grid Toggle](./02-canvas-navigation/UJ-CN-006-GridToggle.md) | Medium |
| UJ-CN-007 | [Grid Size Change](./02-canvas-navigation/UJ-CN-007-GridSizeChange.md) | Low |
| UJ-CN-008 | [Snap to Grid Toggle](./02-canvas-navigation/UJ-CN-008-SnapToGridToggle.md) | Medium |

---

## 03 - Entity Creation

Drawing and placing rooms, ducts, equipment, fittings, and notes.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-EC-001 | [Draw Room](./03-entity-creation/UJ-EC-001-DrawRoom.md) | **High** |
| UJ-EC-002 | [Draw Rectangular Duct](./03-entity-creation/UJ-EC-002-DrawRectangularDuct.md) | **High** |
| UJ-EC-003 | [Draw Round Duct](./03-entity-creation/UJ-EC-003-DrawRoundDuct.md) | **High** |
| UJ-EC-004 | [Place Hood](./03-entity-creation/UJ-EC-004-PlaceHood.md) | High |
| UJ-EC-005 | [Place Fan](./03-entity-creation/UJ-EC-005-PlaceFan.md) | High |
| UJ-EC-006 | [Place Diffuser](./03-entity-creation/UJ-EC-006-PlaceDiffuser.md) | High |
| UJ-EC-007 | [Place Damper](./03-entity-creation/UJ-EC-007-PlaceDamper.md) | Medium |
| UJ-EC-008 | [Place Air Handler](./03-entity-creation/UJ-EC-008-PlaceAirHandler.md) | High |
| UJ-EC-009 | [Place 90° Elbow](./03-entity-creation/UJ-EC-009-PlaceElbow90.md) | High |
| UJ-EC-010 | [Place 45° Elbow](./03-entity-creation/UJ-EC-010-PlaceElbow45.md) | Medium |
| UJ-EC-011 | [Place Tee](./03-entity-creation/UJ-EC-011-PlaceTee.md) | High |
| UJ-EC-012 | [Place Reducer](./03-entity-creation/UJ-EC-012-PlaceReducer.md) | Medium |
| UJ-EC-013 | [Place Cap](./03-entity-creation/UJ-EC-013-PlaceCap.md) | Low |
| UJ-EC-014 | [Place Note](./03-entity-creation/UJ-EC-014-PlaceNote.md) | Medium |
| UJ-EC-015 | [FAB Tool Quick Create](./03-entity-creation/UJ-EC-015-FABToolQuickCreate.md) | Medium |
| UJ-EC-016 | [Invalid Placement Handling](./03-entity-creation/UJ-EC-016-InvalidPlacementHandling.md) | High |

---

## 04 - Selection and Manipulation

Selecting, moving, and manipulating entities.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-SM-001 | [Single Select](./04-selection-and-manipulation/UJ-SM-001-SingleSelect.md) | High |
| UJ-SM-002 | [Multi-Select Shift Click](./04-selection-and-manipulation/UJ-SM-002-MultiSelectShiftClick.md) | High |
| UJ-SM-003 | [Marquee Selection](./04-selection-and-manipulation/UJ-SM-003-MarqueeSelection.md) | High |
| UJ-SM-004 | [Select All](./04-selection-and-manipulation/UJ-SM-004-SelectAll.md) | Medium |
| UJ-SM-005 | [Clear Selection](./04-selection-and-manipulation/UJ-SM-005-ClearSelection.md) | Medium |
| UJ-SM-006 | [Drag to Move](./04-selection-and-manipulation/UJ-SM-006-DragToMove.md) | High |
| UJ-SM-007 | [Arrow Key Nudge](./04-selection-and-manipulation/UJ-SM-007-ArrowKeyNudge.md) | Medium |
| UJ-SM-008 | [Shift Arrow Fast Nudge](./04-selection-and-manipulation/UJ-SM-008-ShiftArrowFastNudge.md) | Low |
| UJ-SM-009 | [Duplicate Entities](./04-selection-and-manipulation/UJ-SM-009-DuplicateEntities.md) | High |
| UJ-SM-010 | [Delete Entities](./04-selection-and-manipulation/UJ-SM-010-DeleteEntities.md) | High |
| UJ-SM-011 | [Move with Snap to Grid](./04-selection-and-manipulation/UJ-SM-011-MoveWithSnapToGrid.md) | Medium |
| UJ-SM-012 | [zIndex Layering](./04-selection-and-manipulation/UJ-SM-012-ZIndexLayering.md) | Low |

---

## 05 - Property Editing

Editing entity properties via inspector panel.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-PE-001 | [Inspector Panel Overview](./05-property-editing/UJ-PE-001-InspectorPanelOverview.md) | High |
| UJ-PE-002 | [Edit Room Properties](./05-property-editing/UJ-PE-002-EditRoomProperties.md) | High |
| UJ-PE-003 | [Using Property Presets](./05-property-editing/UJ-PE-003-UsingPropertyPresets.md) | High |
| UJ-PE-004 | [Edit Equipment Properties](./05-property-editing/UJ-PE-004-EditEquipmentProperties.md) | High |
| UJ-PE-005 | [Edit Fitting Properties](./05-property-editing/UJ-PE-005-EditFittingProperties.md) | Medium |
| UJ-PE-006 | [Edit Note Properties](./05-property-editing/UJ-PE-006-EditNoteProperties.md) | Low |
| UJ-PE-007 | [Validation Error Feedback](./05-property-editing/UJ-PE-007-ValidationErrorFeedback.md) | High |
| UJ-PE-008 | [Calculated Fields Display](./05-property-editing/UJ-PE-008-CalculatedFieldsDisplay.md) | Medium |
| UJ-PE-009 | [Multi-Select Properties](./05-property-editing/UJ-PE-009-MultiSelectProperties.md) | Medium |
| UJ-PE-010 | [Canvas Properties Inspector](./05-property-editing/UJ-PE-010-CanvasPropertiesInspector.md) | Low |

---

## 06 - Calculations

HVAC engineering calculations (ASHRAE 62.1, duct sizing, pressure loss).

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-CA-001 | [Room Ventilation ASHRAE](./06-calculations/UJ-CA-001-RoomVentilationASHRAE.md) | High |
| UJ-CA-002 | [ACH to CFM Conversion](./06-calculations/UJ-CA-002-ACHToCFMConversion.md) | High |
| UJ-CA-003 | [Duct Velocity Calculation](./06-calculations/UJ-CA-003-DuctVelocityCalculation.md) | High |
| UJ-CA-004 | [Velocity Pressure](./06-calculations/UJ-CA-004-VelocityPressure.md) | Medium |
| UJ-CA-005 | [Round Duct Sizing](./06-calculations/UJ-CA-005-RoundDuctSizing.md) | High |
| UJ-CA-006 | [Rectangular Duct Sizing](./06-calculations/UJ-CA-006-RectangularDuctSizing.md) | Medium |
| UJ-CA-007 | [Friction Loss](./06-calculations/UJ-CA-007-FrictionLoss.md) | Medium |
| UJ-CA-008 | [Fitting Pressure Loss](./06-calculations/UJ-CA-008-FittingPressureLoss.md) | Medium |
| UJ-CA-009 | [Live Recalculation](./06-calculations/UJ-CA-009-LiveRecalculation.md) | High |
| UJ-CA-010 | [Velocity Warnings](./06-calculations/UJ-CA-010-VelocityWarnings.md) | Medium |

---

## 07 - Undo/Redo

Command pattern undo/redo functionality.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-UR-001 | [Undo Single Action](./07-undo-redo/UJ-UR-001-UndoSingleAction.md) | High |
| UJ-UR-002 | [Redo Single Action](./07-undo-redo/UJ-UR-002-RedoSingleAction.md) | High |
| UJ-UR-003 | [Undo/Redo Chain](./07-undo-redo/UJ-UR-003-UndoRedoChain.md) | High |
| UJ-UR-004 | [Undo Entity Create](./07-undo-redo/UJ-UR-004-UndoEntityCreate.md) | High |
| UJ-UR-005 | [Undo Entity Delete](./07-undo-redo/UJ-UR-005-UndoEntityDelete.md) | High |
| UJ-UR-006 | [Undo Entity Update](./07-undo-redo/UJ-UR-006-UndoEntityUpdate.md) | Medium |
| UJ-UR-007 | [Undo Entity Move](./07-undo-redo/UJ-UR-007-UndoEntityMove.md) | Medium |
| UJ-UR-008 | [Selection State Restoration](./07-undo-redo/UJ-UR-008-SelectionStateRestoration.md) | Low |
| UJ-UR-009 | [History Stack Limits](./07-undo-redo/UJ-UR-009-HistoryStackLimits.md) | Low |

---

## 08 - File Management

Saving, loading, backup, and recovery.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-FM-001 | [Manual Save](./08-file-management/UJ-FM-001-ManualSave.md) | **Critical** |
| UJ-FM-002 | [Auto Save](./08-file-management/UJ-FM-002-AutoSave.md) | **Critical** |
| UJ-FM-003 | [Save Indicator](./08-file-management/UJ-FM-003-SaveIndicator.md) | High |
| UJ-FM-004 | [Backup Creation](./08-file-management/UJ-FM-004-BackupCreation.md) | **Critical** |
| UJ-FM-005 | [Load Project](./08-file-management/UJ-FM-005-LoadProject.md) | **Critical** |
| UJ-FM-006 | [Load Validation Error](./08-file-management/UJ-FM-006-LoadValidationError.md) | **Critical** |
| UJ-FM-007 | [Backup Recovery](./08-file-management/UJ-FM-007-BackupRecovery.md) | **Critical** |
| UJ-FM-008 | [Schema Migration](./08-file-management/UJ-FM-008-SchemaMigration.md) | High |
| UJ-FM-009 | [Unsaved Changes Warning](./08-file-management/UJ-FM-009-UnsavedChangesWarning.md) | High |
| UJ-FM-010 | [Save Failure Retry](./08-file-management/UJ-FM-010-SaveFailureRetry.md) | High |

---

## 09 - Export

Exporting to JSON, CSV, and PDF formats.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-EXP-001 | [Export JSON](./09-export/UJ-EXP-001-ExportJSON.md) | High |
| UJ-EXP-002 | [Export CSV BOM](./09-export/UJ-EXP-002-ExportCSVBOM.md) | High |
| UJ-EXP-003 | [Export PDF](./09-export/UJ-EXP-003-ExportPDF.md) | High |
| UJ-EXP-004 | [Export Filenaming](./09-export/UJ-EXP-004-ExportFilenaming.md) | Medium |
| UJ-EXP-005 | [Export Menu Access](./09-export/UJ-EXP-005-ExportMenuAccess.md) | Low |
| UJ-EXP-006 | [Export Options](./09-export/UJ-EXP-006-ExportOptions.md) | Medium |

---

## 10 - BOM Panel

Bill of Materials panel functionality.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-BOM-001 | [View BOM Summary](./10-bom-panel/INDEX.md) | Medium |
| UJ-BOM-002 | [Filter/Sort BOM](./10-bom-panel/INDEX.md) | Low |
| UJ-BOM-003 | [Export BOM](./10-bom-panel/INDEX.md) | Medium |
| UJ-BOM-004 | [Edit BOM Line Items](./10-bom-panel/INDEX.md) | Medium |
| UJ-BOM-005 | [BOM Cost Analysis](./10-bom-panel/INDEX.md) | Low |

---

## 11 - Keyboard Shortcuts

Keyboard-driven workflows.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-KS-001 | [Tool Switching Shortcuts](./11-keyboard-shortcuts/UJ-KS-001-ToolSwitchingShortcuts.md) | High |
| UJ-KS-002 | [Editing Shortcuts](./11-keyboard-shortcuts/UJ-KS-002-EditingShortcuts.md) | High |
| UJ-KS-003 | [File Shortcuts](./11-keyboard-shortcuts/UJ-KS-003-FileShortcuts.md) | High |
| UJ-KS-004 | [Viewport Shortcuts](./11-keyboard-shortcuts/UJ-KS-004-ViewportShortcuts.md) | Medium |
| UJ-KS-005 | [Selection Shortcuts](./11-keyboard-shortcuts/UJ-KS-005-SelectionShortcuts.md) | Medium |
| UJ-KS-006 | [Input Field Bypassing](./11-keyboard-shortcuts/UJ-KS-006-InputFieldBypassing.md) | Medium |
| UJ-KS-007 | [Shortcuts Help Modal](./11-keyboard-shortcuts/UJ-KS-007-ShortcutsHelpModal.md) | Low |

---

## 12 - Error Handling

Validation errors, save/load failures, and recovery.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-EH-001 | [Application Recovery](./12-error-handling/INDEX.md) | High |
| UJ-EH-002 | [File Load Errors](./12-error-handling/INDEX.md) | High |
| UJ-EH-003 | [Calculation Errors](./12-error-handling/INDEX.md) | Medium |
| UJ-EH-004 | [Save Errors](./12-error-handling/INDEX.md) | High |
| UJ-EH-005 | [Error Boundary Recovery](./12-error-handling/INDEX.md) | Medium |
| UJ-EH-006 | [Warning Notifications](./12-error-handling/INDEX.md) | Medium |

---

## 13 - Settings and Preferences

User preferences and application settings.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-SET-001 | [Unit System Toggle](./13-settings-and-preferences/UJ-SET-001-UnitSystemToggle.md) | Medium |
| UJ-SET-002 | [Auto Save Interval](./13-settings-and-preferences/UJ-SET-002-AutoSaveInterval.md) | Medium |
| UJ-SET-003 | [Grid Size Setting](./13-settings-and-preferences/UJ-SET-003-GridSizeSetting.md) | Low |
| UJ-SET-004 | [Theme Toggle](./13-settings-and-preferences/UJ-SET-004-ThemeToggle.md) | Low |
| UJ-SET-005 | [Warning Indicator Toggles](./13-settings-and-preferences/UJ-SET-005-WarningIndicatorToggles.md) | Low |

---

## 14 - Sidebar Interactions

Left and right sidebar functionality.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-SB-001 | [Left Sidebar Project Details](./14-sidebar-interactions/UJ-SB-001-LeftSidebarProjectDetails.md) | Medium |
| UJ-SB-002 | [Left Sidebar Scope](./14-sidebar-interactions/UJ-SB-002-LeftSidebarScope.md) | Medium |
| UJ-SB-003 | [Left Sidebar Site Conditions](./14-sidebar-interactions/UJ-SB-003-LeftSidebarSiteConditions.md) | Medium |
| UJ-SB-004 | [Right Sidebar BOQ](./14-sidebar-interactions/UJ-SB-004-RightSidebarBOQ.md) | Medium |
| UJ-SB-005 | [Right Sidebar Calculations](./14-sidebar-interactions/UJ-SB-005-RightSidebarCalculations.md) | Medium |
| UJ-SB-006 | [Sidebar Resizing](./14-sidebar-interactions/UJ-SB-006-SidebarResizing.md) | Low |
| UJ-SB-007 | [Sidebar Collapse](./14-sidebar-interactions/UJ-SB-007-SidebarCollapse.md) | Low |

---

## 15 - Complete Workflows

End-to-end design workflows.

| ID | User Journey | Priority |
|----|--------------|----------|
| UJ-WF-001 | [New Office Design](./15-complete-workflows/UJ-WF-001-NewOfficeDesign.md) | High |
| UJ-WF-002 | [Kitchen Ventilation Design](./15-complete-workflows/UJ-WF-002-KitchenVentilationDesign.md) | High |
| UJ-WF-003 | [Edit Existing Project](./15-complete-workflows/UJ-WF-003-EditExistingProject.md) | High |
| UJ-WF-004 | [Generate BOM Report](./15-complete-workflows/UJ-WF-004-GenerateBOMReport.md) | Medium |
| UJ-WF-005 | [Presentation Export](./15-complete-workflows/UJ-WF-005-PresentationExport.md) | Medium |
| UJ-WF-006 | [Error Recovery Workflow](./15-complete-workflows/UJ-WF-006-ErrorRecoveryWorkflow.md) | Low |
| UJ-WF-007 | [Collaborative Handoff](./15-complete-workflows/UJ-WF-007-CollaborativeHandoff.md) | Low |

---

## Implementation Roadmap

### Phase 1 - Critical Paths (Weeks 1-2)
- ✅ 01-project-management (8 docs)
- ✅ 08-file-management (10 docs)
- 🔄 03-entity-creation (16 docs)

### Phase 2 - Core Functionality (Weeks 3-4)
- 04-selection-and-manipulation (12 docs)
- 05-property-editing (10 docs)
- 06-calculations (10 docs)

### Phase 3 - Supporting Features (Weeks 5-6)
- 02-canvas-navigation (8 docs)
- 07-undo-redo (9 docs)
- 09-export (6 docs)

### Phase 4 - Polish & Edge Cases (Weeks 7-8)
- 12-error-handling (6 docs)
- 11-keyboard-shortcuts (7 docs)
- 15-complete-workflows (7 docs)

### Phase 5 - Nice-to-Have (Weeks 9+)
- 00-getting-started (3 docs)
- 10-bom-panel (5 docs)
- 13-settings-and-preferences (5 docs)
- 14-sidebar-interactions (7 docs)

---

## Related Documentation

- [Product Requirements (PRD)](../PRD.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Testing Guide](../TESTING.md)
- [Element Documentation](../elements/)
- [Quick Start Guide](../QUICK_START.md)

---

## Contributing

To add a new user journey:

1. Use the document template (see above)
2. Reference PRD requirements and user stories
3. Include test implementation references
4. Add to appropriate category index
5. Submit via pull request
