# User Journey: [Document Title]

## 1. Overview

### Purpose
[Describe the high-level objective and goal of this user journey.]

### Scope
- [List specific functionalities covered]
- [List what is NOT covered (optional)]

### User Personas
- **Primary**: [Role, e.g., HVAC Designer]
- **Secondary**: [Role, e.g., Project Manager]

### Success Criteria
- [Condition 1 for success]
- [Condition 2 for success]

## 2. PRD References

### Related PRD Sections
- **Section X.Y: Title** - Description of relation
- **Section A.B: Title** - Description of relation

### Key Requirements Addressed
- REQ-XXX-001: Description
- REQ-XXX-002: Description

## 3. Prerequisites

### User Prerequisites
- [What the user needs to know or have done]

### System Prerequisites
- [App state, e.g., "Project opened", "Canvas active"]

### Data Prerequisites
- [Entities or data that must exist]

### Technical Prerequisites
- [Specific stores, services, or hooks that must be initialized]

## 4. User Journey Steps

### Step 1: [Descriptive Action Title]

**User Actions:**
1. [Action 1]
2. [Action 2]

**System Response:**
1. [System behavior 1]
2. [System behavior 2]

**Visual State:**
```
[Ascii art or detailed text description of UI state]
```

**User Feedback:**
- [Toasts, icons, state changes]

**Related Elements:**
- Components: `[Name]`
- Stores: `[Name]`
- Services: `[Name]`
- Events: `[Name]`

[... Repeat for at least 5 steps ...]

## 5. Edge Cases and Handling

1. **[Edge Case Title]**
   - **Scenario**: [Describe the edge case]
   - **Handling**: [How the system responds]
   - **Test Case**: `tests/e2e/[path]`

[... Repeat for at least 5 edge cases ...]

## 6. Error Scenarios and Recovery

1. **[Error Scenario Title]**
   - **Scenario**: [Describe the failure]
   - **Recovery**: [How the system handles/recovers]
   - **User Feedback**: [Error message text]

[... Repeat for at least 3 error scenarios ...]

## 7. Performance Considerations
- [Latency requirements]
- [Memory/CPU impact for complex operations]
- [Degradation behavior]

## 8. Keyboard Shortcuts
| Action | Shortcut | Context |
|--------|----------|---------|
| [Action] | [Key] | [Condition] |

## 9. Accessibility & Internationalization
- [ARIA labels]
- [Keyboard focus management]
- [Language/Units support]

## 10. Key UI Components & Interactions
- [Component A]: Behavior details
- [Component B]: Behavior details

## 11. Related Documentation
- [Prerequisites]: [relative path]
- [Related Elements]: [relative path]
- [Next Steps]: [relative path]

## 12. Automation & Testing

### Unit Tests
- `src/__tests__/[path]`

### Integration Tests
- `src/__tests__/integration/[path]`

### E2E Tests
- `tests/e2e/[path]`

## 13. Notes
- [Implementation details]
- [Architectural considerations]
- [Future enhancements/limitations]
