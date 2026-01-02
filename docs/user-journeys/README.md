# User Journeys Documentation

## Overview

This directory contains comprehensive user journey documentation for the SizeWise HVAC Canvas App. Each user journey maps to specific product requirements, user stories, and test implementations, ensuring complete coverage of all application functionality.

**Total User Journeys:** 129 documents across 15 categories

---

## Quick Navigation: Dependency Layers

| Layer | Categories | Docs | Status |
|-------|------------|------|--------|
| **1. Foundation** | [Project Management](#01-project-management), [File Management](#08-file-management), [Canvas Navigation](#02-canvas-navigation) | 26 | 🟢 Complete |
| **2. Core** | [Entity Creation](#03-entity-creation), [Selection](#04-selection-and-manipulation), [Undo/Redo](#07-undo-redo) | 37 | 🟢 Complete |
| **3. Data** | [Property Editing](#05-property-editing), [BOM Panel](#10-bom-panel) | 15 | 🟡 In Progress |
| **4. Operations** | [Calculations](#06-calculations) | 10 | 🔴 Missing |
| **5. Output** | [Export](#09-export) | 6 | 🔴 Missing |
| **6. Quality** | [Error Handling](#12-error-handling) | 6 | 🔴 Missing |
| **7. Advanced** | [Workflows](#15-complete-workflows), [Shortcuts](#11-keyboard-shortcuts), [Settings](#13-settings-and-preferences) | 26 | 🔴 Missing |

---

## Documentation Assets
- **[Master Template](_TEMPLATE.md)**: Comprehensive structure (11-13 sections)
- **[Gold Standard Example](_EXAMPLE.md)**: 1000+ line reference document
- **[Master Index](INDEX.md)**: Full dependency-aware navigation

---

## Category Index

| Category | Count | Priority | Status |
|----------|-------|----------|--------|
| [01 - Project Management](01-project-management/INDEX.md) | 8 | **High** | 🟢 Complete |
| [02 - Canvas Navigation](02-canvas-navigation/INDEX.md) | 8 | **High** | 🟢 Complete |
| [03 - Entity Creation](03-entity-creation/INDEX.md) | 16 | **High** | 🟢 Complete |
| [04 - Selection & Manipulation](04-selection-and-manipulation/INDEX.md) | 12 | **High** | 🟢 Complete |
| [05 - Property Editing](05-property-editing/INDEX.md) | 10 | **High** | 🟡 In Progress |
| [06 - Calculations](06-calculations/INDEX.md) | 10 | **Critical** | 🔴 Missing |
| [07 - Undo/Redo](07-undo-redo/INDEX.md) | 9 | **High** | 🟢 Complete |
| [08 - File Management](08-file-management/INDEX.md) | 10 | **Critical** | 🟢 Complete |
| [09 - Export](09-export/INDEX.md) | 6 | **High** | 🔴 Missing |
| [10 - BOM Panel](10-bom-panel/INDEX.md) | 5 | Medium | 🟢 Complete |
| [11 - Keyboard Shortcuts](11-keyboard-shortcuts/INDEX.md) | 7 | Medium | 🔴 Missing |
| [12 - Error Handling](12-error-handling/INDEX.md) | 6 | **High** | 🔴 Missing |
| [13 - Settings & Preferences](13-settings-and-preferences/INDEX.md) | 5 | Medium | 🔴 Missing |
| [14 - Sidebar Interactions](14-sidebar-interactions/INDEX.md) | 7 | Medium | 🔴 Missing |
| [15 - Complete Workflows](15-complete-workflows/INDEX.md) | 7 | **High** | 🔴 Missing |

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

1. Use the **[Master Template](_TEMPLATE.md)**.
2. Reference the **[Gold Standard Example](_EXAMPLE.md)** for depth requirements.
3. Reference PRD requirements and user stories.
4. Include test implementation references (Unit, Integration, E2E).
5. Add to appropriate category index.
6. Submit via pull request.
