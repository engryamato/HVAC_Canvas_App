I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: Component library migration incomplete; BOM, resolution wizard, library views still use legacy store

Update `useBOM.ts`, `LibraryManagementView.tsx`, `LibraryBrowserPanel.tsx`, and `ResolutionWizard.tsx` to consume `useComponentLibraryStoreV2` (and any V2 service equivalents) for components, categories, search, activation, and pricing. Remove remaining references to `useComponentLibraryStore` in these flows. Align related tests to the V2 store and remove legacy store setup.

### Referred Files
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\hooks\useBOM.ts
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\components\LibraryManagementView.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\library\LibraryManagementView.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\components\LibraryBrowserPanel.tsx
- c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\hvac-design-app\src\features\canvas\components\ResolutionWizard.tsx
---