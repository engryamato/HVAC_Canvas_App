I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: New wizards/dialogs are implemented but unreachable from the UI

Add stateful open/close wiring in a shared layout (e.g., `AppShell`/`Header` or `CanvasPage`) to render the dialogs. Provide menu or toolbar actions (File/Tools/Settings) that set those states and pass required handlers. Trigger Project Setup on first launch/load and Migration Wizard when `VersionDetector` flags old data. Ensure Bulk Edit and System Template Selector are reachable from library/selection context.

### Referred Files
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\components\layout\Header.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\components\layout\ToolsMenu.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\CanvasPage.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\components\onboarding\AppInitializer.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\project\components\ProjectSetupWizard.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\components\dialogs\ProjectInitializationWizard.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\components\dialogs\MigrationWizard.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\components\CalculationSettingsDialog.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\components\BulkEditDialog.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\components\SystemTemplateSelector.tsx
---
## Comment 2: Canvas tools still use legacy stores instead of the unified component library

Refactor `DuctTool`, `EquipmentTool`, and `FittingTool` to read active components from `useComponentLibraryStoreV2` (and associated templates/metadata) instead of `serviceStore`/`useToolStore` primitives. Map selected component/fitting/equipment definitions to placement props and validation. Keep backward compatibility or feature flag if needed, but ensure V2 is the authoritative source.

### Referred Files
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\tools\DuctTool.ts
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\tools\EquipmentTool.ts
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\tools\FittingTool.ts
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\core\store\componentLibraryStoreV2.ts
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\core\store\serviceStore.ts
---
## Comment 3: Calculation settings are split across two unrelated stores causing inconsistent behavior

Choose a single calculation settings source (prefer the newer `useSettingsStore` or consolidate into one) and refactor `CalculationSettingsDialog`, `BOMPanel`, and `LeftSidebar` to use it. Remove or alias the unused store to avoid drift, and ensure validation/cost recomputation hooks listen to the unified store.

### Referred Files
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\components\CalculationSettingsDialog.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\core\store\calculationSettingsStore.ts
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\core\store\settingsStore.ts
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\components\LeftSidebar.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\components\BOMPanel.tsx
---