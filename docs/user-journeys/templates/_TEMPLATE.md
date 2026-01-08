# User Journey: [Title]

## 1. Overview

### Purpose
[Brief description of what this user journey achieves]

### Scope
- [In-scope item 1]
- [In-scope item 2]

### User Personas
- **Primary**: [Role, e.g., HVAC Designer]
- **Secondary**: [Role, e.g., Project Manager]

### Success Criteria
- [Criterion 1]
- [Criterion 2]

## 2. PRD References

### Related PRD Sections
- **Section X.Y: [Name]** - [Context]

### Key Requirements Addressed
- REQ-XXX-000: [Description]

## 3. Prerequisites

### User Prerequisites
- [e.g., Project is open]

### System Prerequisites
- [e.g., Component initialized]

### Data Prerequisites
- [e.g., Entities present]

### Technical Prerequisites
- [e.g., Service available]

## 4. User Journey Steps

### Step 1: [Action Name]
**User Actions:**
1. [Action 1]
2. [Action 2]

**System Response:**
1. [Response 1]
2. [Response 2]

**Visual State:**
```
[ASCII Art or Description of UI State]
```

**User Feedback:**
- [Feedback 1]

**Related Elements:**
- Components: `[Name]`
- Stores: `[Name]`
- Services: `[Name]`
- Events: `[Name]`

*(Repeat for subsequent steps)*

## 5. Edge Cases and Handling

1.  **[Case Name]**
    - **Scenario**: [Description]
    - **Handling**: [Description]
    - **Test Case**: `tests/e2e/[path]`

## 6. Error Scenarios and Recovery

1.  **[Error Name]**
    - **Scenario**: [Description]
    - **Recovery**: [Description]
    - **User Feedback**: "[Message]"

## 7. Performance Considerations
- [Consideration 1]

## 8. Keyboard Shortcuts
| Action | Shortcut | Context |
|--------|----------|---------|
| [Action] | [Keys] | [Context] |

## 9. Accessibility & Internationalization
- [Note on A11y]
- [Note on i18n]

## 10. Key UI Components & Interactions
- `[Component]`: [Role]

## 11. Related Documentation
- [Prerequisites]: [Link]
- [Related Elements]: [Link]

## 12. Automation & Testing

### Unit Tests
- `src/__tests__/[path]`

### Integration Tests
- `src/__tests__/integration/[path]`

### E2E Tests
- `tests/e2e/[path]`
- [ ] **Validates using ONLY UI navigation** (no direct URL jumps per `docs/TESTING.md#e2e-navigation-rules`)

## 13. Notes
- [Additional notes]
