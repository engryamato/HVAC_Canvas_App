# User Journey: Validating Property Values

## 1. Overview

### Purpose
This document describes how the HVAC Canvas App validates property values to ensure data integrity, prevent design errors, and maintain system consistency. Validation occurs at multiple levels—from input sanitization to complex cross-property rules—providing real-time feedback to users and preventing invalid configurations that could lead to calculation errors or system failures.

### Scope
- Input-level validation (data types, formats, ranges)
- Field-level validation (required fields, valid values)
- Cross-field validation (property dependencies and relationships)
- System-level validation (engineering constraints, building codes)
- Real-time validation feedback mechanisms
- Validation error messages and recovery guidance
- Warning vs. blocking validation rules
- Custom validation rules for specific equipment types
- Validation override capabilities for special cases
- Batch validation for multiple entities

### User Personas
- **Primary**: HVAC designers entering equipment specifications
- **Secondary**: Engineers ensuring design compliance
- **Tertiary**: QA reviewers validating project data integrity

### Success Criteria
- Invalid values prevented from being entered or saved
- Clear, actionable error messages guide users to corrections
- Real-time validation provides immediate feedback
- Warnings inform without blocking valid edge cases
- Validation rules align with industry standards (ASHRAE, IMC)
- Users understand why validation failed and how to fix
- Complex validation rules execute efficiently without lag
- Override mechanism available for exceptional cases with proper authorization

## 2. PRD References

### Related PRD Sections
- **Section 3.5: Properties Panel** - Property editing interface
- **Section 4.5: Validation System** - Validation architecture and rules
- **Section 4.6: Data Integrity** - Ensuring valid project data
- **Section 6.3: Calculations Engine** - Validation impact on calculations
- **Section 8.2: Code Compliance** - Building code validation

### Key Requirements Addressed
- REQ-VAL-001: All property inputs must be validated before saving
- REQ-VAL-002: Validation must occur in real-time with <300ms feedback
- REQ-VAL-003: Error messages must be clear, specific, and actionable
- REQ-VAL-004: Warnings must not block valid operations
- REQ-VAL-005: Cross-property validation must detect incompatible combinations
- REQ-VAL-006: Validation rules must be configurable per equipment type
- REQ-VAL-007: Override mechanism must require proper justification
- REQ-VAL-008: Validation must support industry standards (ASHRAE, IMC)

## 3. Prerequisites

### User Prerequisites
- User is editing equipment or connection properties
- User has Properties Panel open with entity selected
- User understands basic property concepts and valid ranges

### System Prerequisites
- ValidationService initialized with rule sets
- Property schemas loaded for all entity types
- Industry standards database available (ASHRAE tables, etc.)
- Calculation engine ready for dependent validations

### Data Prerequisites
- Entity property schemas defined with validation rules
- Validation rule configurations loaded
- Reference data available (material specs, manufacturer data)

### Technical Prerequisites
- Zod validation library initialized
- Custom validators registered
- Error message templates loaded
- Validation debouncing configured

## 4. User Journey Steps

### Step 1: Input-Level Validation - Data Type and Format

**User Actions:**
1. User clicks into a numeric field (e.g., Airflow CFM)
2. User attempts to type alphabetic characters
3. User observes characters blocked or removed
4. User enters valid numeric value
5. User sees visual confirmation of valid input

**System Response:**
1. When user focuses numeric field:
   - System applies input mask for numbers only
   - Allows: digits (0-9), decimal point (.), minus sign (-)
   - Blocks: letters, special characters (except decimal/minus)

2. Input sanitization on keypress:
   - System intercepts keypress event
   - Checks character against allowed pattern: `/^[0-9.-]$/`
   - Valid character: Allowed to appear in field
   - Invalid character: Event prevented, character not entered
   - No error message shown (passive prevention)

3. Format validation on input:
   - Decimal places limited (e.g., 2 decimal places for CFM)
   - Scientific notation handled: "5e3" converted to "5000"
   - Leading zeros removed: "0025" becomes "25"
   - Multiple decimal points prevented: "12.3.4" becomes "12.3"

4. Visual feedback during input:
   - Valid input: Normal field appearance
   - Focus: Blue border highlight
   - Typing: Cursor active, text appears

5. Type coercion on blur:
   - System attempts to parse entered value
   - String "5000" → Number 5000
   - Empty string "" → null or 0 (based on field config)
   - Unparseable value → Validation error

**Visual State:**

```
Input Mask - Numeric Field:

User attempts: "abc5000xyz"
System allows: "5000"

┌────────────────────────────────────┐
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 5000█                            ││ ← Only numbers entered
│ └──────────────────────────────────┘│
│ (letters automatically blocked)     │
└────────────────────────────────────┘

Format Validation - Decimal Places:

User enters: "5000.12345"
System formats: "5000.12"

┌────────────────────────────────────┐
│ Unit Cost ($): *                   │
│ ┌──────────────────────────────────┐│
│ │ 5000.12                          ││ ← Max 2 decimals
│ └──────────────────────────────────┘│
│ (rounded to 2 decimal places)      │
└────────────────────────────────────┘

Date Field - Format Validation:

┌────────────────────────────────────┐
│ Installation Date:                 │
│ ┌──────────────────────────────────┐│
│ │ MM/DD/YYYY                       ││ ← Placeholder
│ └──────────────────────────────────┘│
│                                    │
│ User enters: "01152025"            │
│ System formats: "01/15/2025"       │
└────────────────────────────────────┘
```

**User Feedback:**
- Input mask prevents invalid characters silently (no error needed)
- Format applied automatically on blur
- Placeholder text shows expected format
- Cursor movement and selection work naturally

**Related Elements:**
- Components: `NumberField`, `InputMask`, `FormatValidator`
- Utils: `inputSanitizer`, `numberFormatter`, `typeCoercion`
- Validation: Input-level rules in Zod schema

### Step 2: Field-Level Validation - Range and Required Checks

**User Actions:**
1. User enters value in field
2. User tabs to next field or clicks elsewhere (blur event)
3. User observes validation feedback (success or error)
4. If error, user corrects value based on error message
5. User sees error clear when valid value entered

**System Response:**
1. When field loses focus (blur event):
   - System triggers field-level validation (debounced 300ms)
   - Retrieves value from field
   - Runs validation rules from property schema

2. Required field validation:
   - Check if field marked as required in schema
   - If required and empty/null: Validation fails
   - Error: "Airflow (CFM) is required"

3. Range validation (for numeric fields):
   - Check value against min/max bounds
   - Example: Airflow CFM range: 500 - 50,000
   - Value < min: Error "Value must be at least 500 CFM"
   - Value > max: Error "Value must not exceed 50,000 CFM"
   - Within range: Validation passes

4. Enum/Dropdown validation:
   - Check value exists in allowed options
   - Example: Voltage must be one of: [120V, 208V, 240V, 480V]
   - Invalid value: Error "Please select a valid voltage"

5. Pattern validation (for text fields):
   - Check against regex pattern
   - Example: Equipment Tag must match: `/^[A-Z]{3}-\d{3}$/`
   - Invalid: Error "Tag must be format: XXX-###"

6. Visual feedback after validation:
   - **Valid**: Green checkmark icon appears, field border turns subtle green
   - **Invalid**: Red X icon appears, field border turns red, error message shown below

7. Error message display:
   - Appears below field in red text
   - Icon: ⚠ for errors
   - Specific, actionable message
   - Includes valid range or format example

**Visual State:**

```
Required Field - Empty Error:

┌────────────────────────────────────┐
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │                                ✗ ││ ← Red X
│ └──────────────────────────────────┘│
│ ⚠ Airflow (CFM) is required        │ ← Error message
└────────────────────────────────────┘

Range Validation - Below Minimum:

┌────────────────────────────────────┐
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 250                            ✗ ││
│ └──────────────────────────────────┘│
│ ⚠ Value must be at least 500 CFM   │
│   Valid range: 500 - 50,000 CFM    │
└────────────────────────────────────┘

Range Validation - Above Maximum:

┌────────────────────────────────────┐
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 75000                          ✗ ││
│ └──────────────────────────────────┘│
│ ⚠ Value must not exceed 50,000 CFM │
│   Valid range: 500 - 50,000 CFM    │
└────────────────────────────────────┘

Valid Input - Success:

┌────────────────────────────────────┐
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 5000                           ✓ ││ ← Green check
│ └──────────────────────────────────┘│
│ ✓ Valid                            │
└────────────────────────────────────┘

Pattern Validation - Equipment Tag:

┌────────────────────────────────────┐
│ Equipment Tag:                     │
│ ┌──────────────────────────────────┐│
│ │ AHU123                         ✗ ││
│ └──────────────────────────────────┘│
│ ⚠ Tag must be format: XXX-###      │
│   Example: AHU-001                 │
└────────────────────────────────────┘
```

**User Feedback:**
- Immediate visual indicator (✓ or ✗)
- Color-coded border (green/red)
- Specific error message explains issue
- Valid range or format shown for guidance
- Example provided for pattern validation

**Related Elements:**
- Components: `FieldValidator`, `ValidationMessage`, `ValidationIcon`
- Services: `ValidationService`, `SchemaValidator`
- Schemas: Zod field schemas with rules
- Hooks: `useFieldValidation`

### Step 3: Cross-Field Validation - Property Dependencies

**User Actions:**
1. User edits multiple related properties
2. User applies changes to form
3. User observes cross-field validation check
4. System highlights incompatible property combinations
5. User adjusts values to satisfy dependencies

**System Response:**
1. When user clicks "Apply" button:
   - System runs field-level validation first
   - If all fields individually valid, proceed to cross-field validation
   - System checks property relationships and dependencies

2. Common cross-field validation rules:

   **Cooling Capacity vs. Airflow**
   - Rule: Cooling capacity requires minimum airflow
   - Formula: Airflow (CFM) >= Cooling Capacity (tons) × 400
   - Example: 5 tons requires ≥ 2000 CFM
   - If violated: Warning "Airflow may be insufficient for cooling capacity"

   **Duct Size vs. Airflow (Velocity Check)**
   - Rule: Velocity = CFM / Cross-sectional Area
   - Recommended velocity: 1500-3000 FPM for main ducts
   - If outside range: Warning with calculated velocity shown

   **Electrical: Voltage vs. Full Load Amps**
   - Rule: FLA must be compatible with voltage
   - High FLA with low voltage: Warning "Consider higher voltage for this amperage"

   **Aspect Ratio (Duct Width/Height)**
   - Rule: Aspect ratio should not exceed 4:1
   - Example: 40" × 8" duct has aspect ratio 5:1
   - If exceeded: Warning "High aspect ratio may increase pressure drop"

3. Validation levels:
   - **Error**: Blocks saving, must be fixed
   - **Warning**: Allows saving with confirmation, not ideal but acceptable
   - **Info**: Informational only, no action required

4. When cross-field validation fails:
   - System displays validation summary at top of form
   - Lists all cross-field issues with severity
   - Highlights affected fields
   - Provides recommendations for resolution

5. Resolution options:
   - Auto-fix: "Increase airflow to recommended 2000 CFM?"
   - Manual correction: User adjusts values
   - Override: User acknowledges warning and proceeds

**Visual State:**

```
Cross-Field Validation Summary:

┌────────────────────────────────────────────────┐
│ ⚠ Validation Issues (2)                        │
├────────────────────────────────────────────────┤
│                                                │
│ ⚠ WARNING: Airflow may be insufficient        │
│   • Cooling Capacity: 5 tons                   │
│   • Current Airflow: 1500 CFM                  │
│   • Recommended: ≥ 2000 CFM (400 CFM/ton)      │
│   [Auto-Fix: Set to 2000 CFM]                  │
│                                                │
│ ⚠ WARNING: High duct velocity                 │
│   • Duct Size: 12" × 8" (0.67 sq ft)           │
│   • Airflow: 2500 CFM                          │
│   • Velocity: 3731 FPM (high)                  │
│   • Recommended: 1500-3000 FPM                 │
│   Suggestion: Increase duct size to 14" × 10"  │
│   [Auto-Fix: Resize Duct]                      │
│                                                │
│     [Fix All]  [Apply Anyway]  [Cancel]        │
└────────────────────────────────────────────────┘

Field Highlighting:

┌────────────────────────────────────┐
│ Cooling Capacity (Tons): *         │
│ ┌──────────────────────────────────┐│
│ │ 5                              ⚠ ││ ← Warning icon
│ └──────────────────────────────────┘│
│                                    │
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 1500                           ⚠ ││ ← Warning icon
│ └──────────────────────────────────┘│
│ ⚠ Related fields may be incompatible│
└────────────────────────────────────┘

Auto-Fix Confirmation:

┌────────────────────────────────────┐
│ Apply Recommended Fix?              │
├────────────────────────────────────┤
│                                    │
│ Increase airflow to 2000 CFM?      │
│                                    │
│ This will update:                  │
│ • Airflow (CFM): 1500 → 2000       │
│                                    │
│ This resolves:                     │
│ ✓ Cooling capacity compatibility   │
│                                    │
│      [Apply Fix]     [Cancel]      │
└────────────────────────────────────┘
```

**User Feedback:**
- Validation summary shows all issues at once
- Severity indicators (⚠ warning vs. ✗ error)
- Auto-fix options provide quick resolution
- Clear explanation of why validation failed
- Recommendations guide proper values

**Related Elements:**
- Components: `ValidationSummary`, `CrossFieldValidator`, `AutoFixDialog`
- Services: `CrossFieldValidationService`, `EngineeringRulesEngine`
- Rules: `coolingCapacityRule`, `velocityRule`, `aspectRatioRule`

### Step 4: System-Level Validation - Engineering Constraints and Codes

**User Actions:**
1. User configures complete system design
2. User applies changes that may violate engineering standards
3. System performs comprehensive validation against industry codes
4. User reviews code compliance issues
5. User makes adjustments or documents exceptions

**System Response:**
1. When complex validation triggered (Apply or Calculate):
   - System runs comprehensive engineering validation
   - Checks against loaded code requirements (ASHRAE, IMC, IBC)
   - Validates equipment combinations and system design

2. ASHRAE Standard Validations:

   **ASHRAE 90.1 - Energy Efficiency**
   - Minimum efficiency requirements for equipment
   - Example: Air handler EER must meet minimum for climate zone
   - Violation: Warning "Equipment efficiency below ASHRAE 90.1 minimum for climate zone 4A"

   **ASHRAE 62.1 - Ventilation Requirements**
   - Minimum outdoor air requirements
   - Formula: OA CFM = Occupancy × OA per person
   - Violation: Error "Outdoor air below ASHRAE 62.1 requirement"

   **ASHRAE 55 - Thermal Comfort**
   - Temperature and humidity ranges
   - Airflow distribution requirements

3. IMC (International Mechanical Code) Validations:

   **Duct Construction Standards**
   - Maximum duct pressure ratings for materials
   - Example: 26ga galvanized max 2" w.g. positive pressure
   - Violation: Error "Duct gauge insufficient for specified static pressure"

   **Equipment Access Requirements**
   - Minimum clearances for service
   - Example: 30" clearance in front of equipment

4. Custom Engineering Rules:

   **Duct Sizing Best Practices**
   - Velocity limits by application type
   - Pressure drop per 100 ft limits
   - Acoustic considerations

   **Equipment Selection**
   - Oversizing limits (max 125% of calculated load)
   - Undersizing prevention (min 95% of calculated load)

5. Validation results display:
   - **Pass**: Green check with "Code Compliant" badge
   - **Warning**: Yellow caution with specific code reference
   - **Fail**: Red error with code requirement and current value

6. Documentation for exceptions:
   - If user proceeds despite warning, require justification
   - Note field: "Reason for code exception"
   - Saved with entity for audit trail

**Visual State:**

```
Code Compliance Check Results:

┌────────────────────────────────────────────────┐
│ Code Compliance Validation                     │
├────────────────────────────────────────────────┤
│                                                │
│ ✓ ASHRAE 90.1 - Energy Efficiency             │
│   Equipment EER: 12.5 (Required: ≥12.0) ✓      │
│                                                │
│ ⚠ ASHRAE 62.1 - Ventilation                   │
│   Outdoor Air: 800 CFM                         │
│   Required: 1000 CFM (100 people × 10 CFM/person)│
│   Status: BELOW REQUIREMENT                    │
│   [View Calculation] [Increase OA]             │
│                                                │
│ ✗ IMC 603.2 - Duct Gauge Requirements         │
│   Current: 26 ga galvanized steel              │
│   Static Pressure: 3.5 in. w.g.                │
│   Maximum Allowed: 2.0 in. w.g. for 26ga       │
│   Required: 24ga or heavier for 3.5 in. w.g.   │
│   [Auto-Fix: Change to 24ga]                   │
│                                                │
│ ⚠ Best Practice - Duct Velocity               │
│   Main trunk: 3200 FPM                         │
│   Recommended: ≤3000 FPM                       │
│   Note: Higher velocity increases noise        │
│                                                │
│ Summary:                                       │
│ • 2 items require attention                    │
│ • 1 code violation (must fix)                  │
│ • 1 below requirement (warning)                │
│                                                │
│     [Fix Issues]  [Document Exception]         │
└────────────────────────────────────────────────┘

Exception Documentation:

┌────────────────────────────────────────────────┐
│ Document Code Exception                        │
├────────────────────────────────────────────────┤
│                                                │
│ Exception for:                                 │
│ ASHRAE 62.1 - Outdoor Air Requirement          │
│                                                │
│ Code Requirement: 1000 CFM                     │
│ Actual Value: 800 CFM                          │
│                                                │
│ Justification: (required)                      │
│ ┌────────────────────────────────────────────┐ │
│ │ Building has operable windows providing    │ │
│ │ natural ventilation per ASHRAE 62.1        │ │
│ │ exception for naturally ventilated spaces. │ │
│ │ Approved by PE John Smith, PE#12345.       │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ This exception will be saved with project      │
│ and included in design documentation.          │
│                                                │
│      [Save Exception]     [Cancel]             │
└────────────────────────────────────────────────┘
```

**User Feedback:**
- Comprehensive code check provides compliance confidence
- Specific code section references enable research
- Color coding (✓⚠✗) shows severity at a glance
- Auto-fix options for common issues
- Exception documentation creates audit trail
- Calculations viewable to understand requirements

**Related Elements:**
- Components: `CodeComplianceChecker`, `ExceptionDocumentDialog`, `ComplianceReport`
- Services: `CodeValidationService`, `ASHRAEValidator`, `IMCValidator`
- Data: `codeRequirements.json`, `climateZones.json`
- Reports: Compliance summary for export

### Step 5: Validation Override and Exception Handling

**User Actions:**
1. User encounters blocking validation error
2. User determines error is incorrect or exception is warranted
3. User clicks "Override" or "Document Exception"
4. User provides justification for override
5. System logs override with user and reason

**System Response:**
1. When user attempts override:
   - System checks user permissions
   - Override capability may be role-restricted:
     - Designers: Can override warnings, not errors
     - Engineers (PE): Can override errors with justification
     - Admins: Full override capability

2. Override request flow:
   - User clicks "Override Warning" button
   - System displays override dialog
   - Requires: Justification text (minimum 20 characters)
   - Optional: Attach supporting document/calculation
   - User must acknowledge: "I understand this may affect system performance"

3. Override record created:
   ```
   {
     entityId: "ahu-001",
     property: "airflow",
     validationRule: "cooling-capacity-airflow-ratio",
     originalError: "Airflow below recommended for cooling capacity",
     overriddenBy: "john.smith@company.com",
     overriddenAt: "2025-01-20T14:30:00Z",
     justification: "Client requested reduced airflow for noise control. Calculated load confirms 1500 CFM sufficient.",
     attachments: ["load-calc.pdf"]
   }
   ```

4. Override visual indication:
   - Overridden fields show special badge: "⚠ Override"
   - Tooltip on badge shows override reason
   - Can be reviewed/revoked later

5. Override audit trail:
   - All overrides logged in project history
   - Exportable for compliance review
   - Included in project reports

6. Temporary overrides:
   - Option for "Temporary - remind me later"
   - System re-validates periodically
   - Notification if issue persists: "Override for AHU-001 airflow still active"

7. Revoke override:
   - User can revoke override at any time
   - System re-runs validation
   - If still invalid, error shown again

**Visual State:**

```
Override Request Dialog:

┌────────────────────────────────────────────────┐
│ Override Validation Warning                    │
├────────────────────────────────────────────────┤
│                                                │
│ Warning to Override:                           │
│ Airflow (1500 CFM) below recommended for      │
│ cooling capacity (5 tons). Recommended: 2000 CFM│
│                                                │
│ ⚠ Overriding this warning may result in:      │
│ • Reduced cooling performance                  │
│ • Inadequate air distribution                  │
│ • Potential comfort issues                     │
│                                                │
│ Justification: (required, min 20 characters)   │
│ ┌────────────────────────────────────────────┐ │
│ │ Client specifically requested lower        │ │
│ │ airflow for noise reduction. Load          │ │
│ │ calculation confirms 1500 CFM adequate     │ │
│ │ for actual cooling load of 4.2 tons.       │ │
│ │ See attached load calc sheet.              │ │
│ └────────────────────────────────────────────┘ │
│ Character count: 156 ✓                         │
│                                                │
│ Attachments: (optional)                        │
│ 📎 load-calculation.pdf                        │
│ [+ Add Attachment]                             │
│                                                │
│ ☑ I understand this override may affect       │
│   system performance and compliance            │
│                                                │
│ Override Duration:                             │
│ ⦿ Permanent                                    │
│ ○ Temporary (remind in 7 days)                 │
│                                                │
│     [Apply Override]     [Cancel]              │
└────────────────────────────────────────────────┘

Field with Override Applied:

┌────────────────────────────────────┐
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 1500                    ⚠ Override││ ← Override badge
│ └──────────────────────────────────┘│
│ ℹ Override by: john.smith@company   │
│   Reason: Client noise requirements │
│   Date: Jan 20, 2025                │
│   [View Full Justification] [Revoke]│
└────────────────────────────────────┘

Override Audit Trail:

┌────────────────────────────────────────────────┐
│ Validation Overrides - Project History        │
├────────────────────────────────────────────────┤
│                                                │
│ AHU-001 - Airflow                              │
│ • Rule: Cooling capacity airflow ratio         │
│ • Overridden: Jan 20, 2025 2:30 PM            │
│ • By: john.smith@company.com (PE)              │
│ • Justification: Client noise requirements...  │
│ • Status: Active                               │
│ [View Details] [Revoke]                        │
│                                                │
│ DUCT-023 - Gauge Selection                    │
│ • Rule: IMC 603.2 pressure rating              │
│ • Overridden: Jan 18, 2025 10:15 AM           │
│ • By: jane.doe@company.com (Admin)             │
│ • Justification: Short duct run, low risk...   │
│ • Status: Revoked (Jan 19, 2025)               │
│ [View Details]                                 │
│                                                │
└────────────────────────────────────────────────┘
```

**User Feedback:**
- Clear warning about override implications
- Required justification ensures documentation
- Attachment support for calculations/approvals
- Acknowledgment checkbox confirms understanding
- Override badge visible on affected fields
- Audit trail maintains accountability
- Revoke option if situation changes

**Related Elements:**
- Components: `OverrideDialog`, `OverrideBadge`, `OverrideAuditTrail`
- Services: `ValidationOverrideService`, `AuditService`
- Stores: `ValidationStore`, `OverrideStore`
- Permissions: Role-based override capabilities

## 5. Edge Cases and Handling

### Edge Case 1: Validation Rules Conflict

**Scenario:**
Two validation rules contradict each other, making it impossible to satisfy both.

**Example:**
- Rule 1: "Airflow must be ≥2000 CFM for 5-ton cooling"
- Rule 2: "Airflow must be ≤1800 CFM for noise requirements in office space"

**Handling:**
1. System detects conflicting rules during validation
2. System identifies both rules and their requirements
3. System displays conflict resolution dialog:
   - Shows both conflicting rules
   - Explains contradiction
   - Provides options:
     - Override one rule (with justification)
     - Modify equipment to resolve (e.g., use different unit)
     - Consult engineering for design revision
4. System logs conflict for rule review
5. Engineering team reviews rule conflicts to update rule logic

**User Impact:**
- Medium: User must make informed decision
- Clear explanation of conflict
- Multiple resolution paths available

### Edge Case 2: External Data Source Unavailable for Validation

**Scenario:**
Validation rule requires checking against manufacturer database, but API is unavailable.

**Handling:**
1. System attempts to validate against manufacturer database
2. Network request fails or times out
3. System implements graceful degradation:
   - Use cached manufacturer data (if available and recent)
   - Skip manufacturer-specific validation with warning
   - Allow manual override with notification
4. System displays warning:
   - "⚠ Unable to verify manufacturer specifications"
   - "Manufacturer database unavailable. Ensure values are correct."
5. System retries validation in background
6. When database available, re-validates and notifies if issues found

**User Impact:**
- Low: Validation continues with reduced accuracy
- Warning informs user of limitation
- Background retry ensures eventual validation

### Edge Case 3: Validation Performance Degrades with Complex Rules

**Scenario:**
Complex cross-field validation on large project (500+ entities) causes UI lag.

**Handling:**
1. System detects long-running validation (>500ms)
2. System implements performance optimizations:
   - Debounce validation triggers (wait for typing to stop)
   - Throttle expensive rules (max once per 2 seconds)
   - Run complex validation asynchronously with Web Worker
   - Cache validation results for unchanged values
3. System shows progress indicator:
   - "Validating properties..." with spinner
   - Progress bar for batch validation
4. System allows user to cancel long validation
5. System provides "Quick Validate" vs. "Full Validate" options:
   - Quick: Field-level only (instant)
   - Full: All rules including cross-field (may take time)

**User Impact:**
- Low: Performance maintained through optimization
- User informed during long operations
- Option to proceed without full validation if needed

### Edge Case 4: User Rapidly Changes Values During Validation

**Scenario:**
User quickly edits multiple fields while validation is running, creating race conditions.

**Handling:**
1. System tracks validation state per field
2. System cancels in-progress validation when field value changes
3. System debounces validation trigger:
   - Wait 300ms after last change before validating
   - Prevents validation on every keystroke
4. System queues validation requests:
   - Only most recent value validated
   - Older requests discarded
5. System uses requestAnimationFrame for UI updates:
   - Batch visual updates to prevent jank
   - Smooth error message appearance/disappearance

**User Impact:**
- Low: Smooth user experience despite rapid changes
- Latest value always validated correctly
- No UI stutter or lag

### Edge Case 5: Batch Property Changes with Mixed Validation Results

**Scenario:**
User applies preset to 10 entities, validation passes for 7 but fails for 3 due to specific entity configurations.

**Handling:**
1. System validates preset application for each entity individually
2. System collects validation results:
   - Success: 7 entities
   - Failed: 3 entities with specific errors
3. System displays batch validation summary:
   - "7 of 10 entities updated successfully"
   - "3 entities have validation errors"
   - List of failed entities with error details
4. System provides options:
   - "Apply to Valid Entities Only" - Update 7, skip 3
   - "Fix Errors" - Review and correct each failed entity
   - "Cancel All" - Revert entire batch operation
5. If user selects "Apply to Valid", creates partial batch command
6. Failed entities highlighted in canvas for review

**User Impact:**
- Medium: Partial success requires decision
- Clear summary of what succeeded/failed
- Options provide flexibility

## 6. Error Scenarios and Recovery

### Error Scenario 1: Validation Service Crashes

**Error Condition:**
ValidationService throws uncaught exception due to malformed rule or data corruption.

**System Detection:**
1. Error boundary catches ValidationService exception
2. Validation fails to complete
3. Error logged with stack trace and input data

**Error Message:**
```
⚠ Validation System Error
An error occurred during validation. Your changes have not been saved.
Error Code: ERR_VALIDATION_SERVICE_CRASH
```

**Recovery Steps:**
1. System displays error notification
2. System preserves user's input values (don't lose data)
3. System disables "Apply" button to prevent invalid save
4. System offers options:
   - "Retry Validation" - Attempt validation again
   - "Save Without Validation" - Advanced users only, requires confirmation
   - "Discard Changes" - Revert to previous values
5. System sends error report to logging service
6. If retry succeeds, proceed normally
7. If retry fails, suggest contacting support with error code

**User Recovery Actions:**
- Click "Retry Validation" first
- Check if specific field causing issue (remove recent changes)
- Save work-in-progress to file before retrying
- Contact support if error persists

**Prevention:**
- Comprehensive error handling in validation rules
- Validate validation rules themselves (meta-validation)
- Regular testing of edge cases
- Graceful degradation if specific rule fails

### Error Scenario 2: Circular Dependency in Validation Rules

**Error Condition:**
Two fields validate based on each other, creating infinite validation loop.

**Example:**
- Field A validation depends on Field B
- Field B validation depends on Field A
- Changing either triggers endless validation cycle

**System Detection:**
1. Validation depth counter increments with each recursive call
2. When depth exceeds threshold (e.g., 10), system detects circular dependency
3. System logs circular dependency chain

**Error Message:**
```
⚠ Validation Configuration Error
Circular dependency detected in validation rules.
Fields involved: Airflow (CFM), Duct Size
Please contact system administrator.
Error Code: ERR_CIRCULAR_VALIDATION
```

**Recovery Steps:**
1. System breaks validation loop immediately
2. System displays error to user
3. System allows saving with warning:
   - "Validation incomplete due to configuration error"
   - "Values will be saved as-is"
4. System flags issue for administrator review
5. System temporarily disables problematic validation rules
6. Administrator reviews and fixes rule configuration

**User Recovery Actions:**
- Acknowledge error and proceed with save
- Verify values manually using engineering judgment
- Report issue to administrator
- Work-around: Edit fields individually rather than together

**Prevention:**
- Validation rule dependency graph analysis during rule creation
- Automated testing for circular dependencies
- Rule configuration validation before deployment
- Clear documentation of rule dependencies

### Error Scenario 3: Validation Database Out of Sync

**Error Condition:**
Local validation rules don't match server-side rules, causing inconsistent validation results.

**System Detection:**
1. Client validates with local rules: Passes
2. Server validates on save: Fails
3. Server returns validation errors to client
4. Client detects mismatch between local and server validation

**Error Message:**
```
⚠ Validation Mismatch
Server validation returned errors that were not detected locally.
Your validation rules may be out of date.
```

**Recovery Steps:**
1. System displays server validation errors
2. System offers to update validation rules:
   - "Update Validation Rules from Server"
   - Downloads latest rule set
3. System re-validates with updated rules
4. System shows diff between local and server results:
   - "New errors found after update:"
   - Lists additional validation failures
5. User corrects errors based on updated rules
6. System saves successfully after corrections

**User Recovery Actions:**
- Update validation rules when prompted
- Correct newly detected errors
- Refresh application if update fails
- Contact support if sync issues persist

**Prevention:**
- Version validation rule sets
- Automatic rule update on app start
- Server-side validation as authoritative source
- Warning if rules haven't updated in 7+ days

## 7. Keyboard Shortcuts

### Validation Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+V` | Run Full Validation | Validate all properties manually |
| `Ctrl+Alt+V` | Toggle Validation | Enable/disable real-time validation |
| `Esc` | Dismiss Validation Error | Clear focused field error message |
| `Ctrl+Shift+E` | View All Errors | Show validation error summary |

### Error Navigation

| Shortcut | Action | Context |
|----------|--------|---------|
| `F8` | Next Error | Jump to next field with validation error |
| `Shift+F8` | Previous Error | Jump to previous field with error |
| `Ctrl+E` | First Error | Jump to first validation error in form |

### Override Actions

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Alt+O` | Override Warning | Open override dialog for current field |
| `Ctrl+Shift+J` | Add Justification | Open justification text area |

**Note:** Shortcuts only active when Properties Panel focused.

## 8. Related Elements

### Components
- `FieldValidator`: Field-level validation component
  - Location: `src/components/validation/FieldValidator.tsx`
  - Props: `value`, `rules`, `onValidate`, `showError`

- `ValidationMessage`: Error message display
  - Location: `src/components/validation/ValidationMessage.tsx`
  - Props: `error`, `severity`, `onDismiss`

- `ValidationSummary`: All validation errors summary
  - Location: `src/components/validation/ValidationSummary.tsx`
  - Props: `errors`, `warnings`, `onErrorClick`

- `CrossFieldValidator`: Multi-field validation
  - Location: `src/components/validation/CrossFieldValidator.tsx`
  - Props: `fields`, `rules`, `onValidate`

- `CodeComplianceChecker`: Industry standard validation
  - Location: `src/components/validation/CodeComplianceChecker.tsx`
  - Props: `entity`, `standards`, `onCheck`

- `OverrideDialog`: Validation override interface
  - Location: `src/components/validation/OverrideDialog.tsx`
  - Props: `error`, `onOverride`, `onCancel`, `requiresJustification`

### Services
- `ValidationService`: Core validation engine
  - Location: `src/services/ValidationService.ts`
  - Methods: `validateField()`, `validateEntity()`, `validateBatch()`

- `RuleEngine`: Validation rule execution
  - Location: `src/services/RuleEngine.ts`
  - Methods: `evaluateRule()`, `getRulesForField()`, `registerRule()`

- `CodeValidationService`: Industry standard validation
  - Location: `src/services/CodeValidationService.ts`
  - Methods: `checkASHRAE()`, `checkIMC()`, `checkIBC()`

- `ValidationOverrideService`: Override management
  - Location: `src/services/ValidationOverrideService.ts`
  - Methods: `requestOverride()`, `approveOverride()`, `revokeOverride()`

### Stores
- `ValidationStore`: Validation state management
  - Location: `src/stores/ValidationStore.ts`
  - State: `errors`, `warnings`, `overrides`, `validationState`
  - Actions: `setError()`, `clearErrors()`, `addOverride()`

- `OverrideStore`: Override tracking
  - Location: `src/stores/OverrideStore.ts`
  - State: `overrides`, `auditTrail`
  - Actions: `createOverride()`, `revokeOverride()`, `getOverrideHistory()`

### Hooks
- `useValidation`: Validation logic hook
  - Location: `src/hooks/useValidation.ts`
  - Returns: `validate()`, `errors`, `isValid`, `clearErrors()`

- `useFieldValidation`: Single field validation
  - Location: `src/hooks/useFieldValidation.ts`
  - Returns: `error`, `validate()`, `isValid`

- `useFormValidation`: Entire form validation
  - Location: `src/hooks/useFormValidation.ts`
  - Returns: `errors`, `validateAll()`, `isFormValid`

### Validation Rules
- `FieldValidationRules`: Field-level rules library
  - Location: `src/validation/rules/FieldRules.ts`
  - Rules: `required`, `min`, `max`, `pattern`, `enum`

- `CrossFieldRules`: Property dependency rules
  - Location: `src/validation/rules/CrossFieldRules.ts`
  - Rules: `coolingAirflowRatio`, `velocityCheck`, `aspectRatio`

- `EngineeringRules`: Engineering constraint rules
  - Location: `src/validation/rules/EngineeringRules.ts`
  - Rules: `ductSizing`, `electricalLoad`, `pressureDrop`

- `CodeComplianceRules`: Industry standard rules
  - Location: `src/validation/rules/CodeRules.ts`
  - Rules: `ASHRAE90_1`, `ASHRAE62_1`, `IMC603`

### Types & Schemas
- `ValidationRule`: Rule definition type
  - Location: `src/types/ValidationRule.ts`
  - Fields: `name`, `validator`, `message`, `severity`, `dependencies`

- `ValidationError`: Error structure
  - Location: `src/types/ValidationError.ts`
  - Fields: `field`, `rule`, `message`, `severity`, `value`

- `ValidationOverride`: Override record
  - Location: `src/types/ValidationOverride.ts`
  - Fields: `id`, `entityId`, `field`, `rule`, `justification`, `user`, `timestamp`

## 9. Visual Diagrams

### Validation Flow

```
User Edits Field
       │
       v
┌──────────────────┐
│ Input Validation │
│ - Type check     │
│ - Format         │
│ - Sanitization   │
└────────┬─────────┘
         │
    Field Blur
         │
         v
┌──────────────────────┐
│ Field Validation     │
│ - Required check     │
│ - Range check        │
│ - Pattern check      │
└────────┬─────────────┘
         │
     ┌───┴────┐
     │        │
  Valid    Invalid
     │        │
     v        v
  ┌────┐  ┌──────────┐
  │ ✓  │  │ Show Error│
  │Show│  │ Block Save│
  └────┘  └──────────┘
     │
     │
User Clicks Apply
     │
     v
┌──────────────────────────┐
│ Cross-Field Validation   │
│ - Property dependencies  │
│ - Engineering rules      │
└────────┬─────────────────┘
         │
     ┌───┴────┐
     │        │
  Valid    Invalid
     │        │
     v        v
  ┌────┐  ┌─────────────┐
  │Next│  │Show Summary │
  │    │  │Allow Override│
  └──┬─┘  └─────────────┘
     │
     v
┌──────────────────────────┐
│ Code Compliance Check    │
│ - ASHRAE standards       │
│ - IMC requirements       │
└────────┬─────────────────┘
         │
     ┌───┴────┐
     │        │
  Pass     Fail
     │        │
     v        v
  ┌────┐  ┌──────────────┐
  │Save│  │Document      │
  │    │  │Exception or  │
  └────┘  │Fix           │
          └──────────────┘
```

### Validation Hierarchy

```
┌─────────────────────────────────────┐
│     Validation Levels (Order)       │
└─────────────────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│ 1. Input-Level (Immediate)          │
│    • Type checking                  │
│    • Character filtering            │
│    • Format enforcement             │
│    • Prevents invalid input         │
└──────────────┬──────────────────────┘
               │
               v
┌─────────────────────────────────────┐
│ 2. Field-Level (On Blur)            │
│    • Required validation            │
│    • Range validation               │
│    • Pattern matching               │
│    • Enum/dropdown validation       │
└──────────────┬──────────────────────┘
               │
               v
┌─────────────────────────────────────┐
│ 3. Cross-Field (On Apply)           │
│    • Property dependencies          │
│    • Calculated relationships       │
│    • Compatibility checks           │
│    • Engineering constraints        │
└──────────────┬──────────────────────┘
               │
               v
┌─────────────────────────────────────┐
│ 4. System-Level (On Save/Calculate) │
│    • Code compliance (ASHRAE, IMC)  │
│    • System-wide constraints        │
│    • Multi-entity validation        │
│    • Performance requirements       │
└─────────────────────────────────────┘
```

### Override Approval Flow

```
Validation Fails
       │
       v
┌──────────────────┐
│ Show Error       │
│ to User          │
└────────┬─────────┘
         │
User Requests Override
         │
         v
┌──────────────────────┐
│ Check User           │
│ Permissions          │
└────────┬─────────────┘
         │
    ┌────┴────┐
    │         │
Authorized  Not Authorized
    │         │
    v         v
┌────────┐ ┌──────────────┐
│Override│ │ Deny Request │
│Dialog  │ │ Show Error   │
└───┬────┘ └──────────────┘
    │
    v
┌────────────────────────┐
│ Require Justification  │
│ - Text (min 20 chars)  │
│ - Attachments (opt)    │
│ - Acknowledgment       │
└────────┬───────────────┘
         │
User Submits
         │
         v
┌────────────────────────┐
│ Create Override Record │
│ - Entity/field         │
│ - Rule overridden      │
│ - User/timestamp       │
│ - Justification        │
└────────┬───────────────┘
         │
         v
┌────────────────────────┐
│ Apply Override         │
│ - Allow save           │
│ - Add badge to field   │
│ - Log to audit trail   │
└────────────────────────┘
```

## 10. Testing

### Unit Tests

**ValidationService Tests:**
```
describe('ValidationService', () => {
  test('validateField returns error for empty required field')
  test('validateField passes for value within range')
  test('validateField returns error for value below min')
  test('validateField returns error for value above max')
  test('validateField validates pattern correctly')
  test('validateField validates enum values')
  test('validateEntity runs all field validations')
  test('validateEntity runs cross-field validations')
  test('validateBatch validates multiple entities efficiently')
})
```

**RuleEngine Tests:**
```
describe('RuleEngine', () => {
  test('evaluateRule executes validation function correctly')
  test('evaluateRule returns correct error message')
  test('getRulesForField returns applicable rules')
  test('registerRule adds custom rule successfully')
  test('rule dependencies evaluated in correct order')
  test('circular dependencies detected and prevented')
})
```

**CodeValidationService Tests:**
```
describe('CodeValidationService', () => {
  test('checkASHRAE validates energy efficiency correctly')
  test('checkASHRAE validates ventilation requirements')
  test('checkIMC validates duct gauge for pressure')
  test('checkIMC validates equipment clearances')
  test('returns appropriate severity (error/warning)')
  test('provides code section references in errors')
})
```

### Integration Tests

**Validation Flow Integration:**
```
describe('Validation Flow Integration', () => {
  test('input mask prevents invalid characters in numeric field')
  test('blur event triggers field validation')
  test('error message displays below invalid field')
  test('apply button disabled when validation errors exist')
  test('cross-field validation runs on apply click')
  test('code compliance check runs before final save')
  test('override dialog opens when user requests override')
})
```

**Error Handling Integration:**
```
describe('Validation Error Handling', () => {
  test('validation service crash caught by error boundary')
  test('user notified of validation system error')
  test('user input preserved despite validation failure')
  test('retry validation works after failure')
  test('circular dependency detected and handled gracefully')
})
```

### End-to-End Tests

**Complete Validation Workflow:**
```
test('E2E: Property validation workflow', async () => {
  // 1. Open project and select equipment
  await page.goto('http://localhost:3000/canvas/test-project')
  await page.click('[data-entity-id="ahu-1"]')

  // 2. Enter invalid value (below range)
  await page.fill('[data-testid="field-airflow"]', '250')
  await page.click('[data-testid="field-voltage"]') // Blur airflow

  // 3. Verify validation error appears
  await expect(page.locator('[data-testid="field-airflow-error"]')).toBeVisible()
  await expect(page.locator('[data-testid="field-airflow-error"]')).toContainText('at least 500')

  // 4. Verify Apply button disabled
  await expect(page.locator('[data-testid="apply-btn"]')).toBeDisabled()

  // 5. Correct value
  await page.fill('[data-testid="field-airflow"]', '5000')
  await page.click('[data-testid="field-voltage"]')

  // 6. Verify error clears
  await expect(page.locator('[data-testid="field-airflow-error"]')).not.toBeVisible()
  await expect(page.locator('[data-testid="field-airflow-validation"]')).toHaveClass(/valid/)

  // 7. Verify Apply button enabled
  await expect(page.locator('[data-testid="apply-btn"]')).toBeEnabled()

  // 8. Enter values causing cross-field warning
  await page.fill('[data-testid="field-cooling-capacity"]', '10')
  await page.fill('[data-testid="field-airflow"]', '2000') // Too low for 10 tons

  // 9. Click Apply
  await page.click('[data-testid="apply-btn"]')

  // 10. Verify cross-field validation warning
  await expect(page.locator('[data-testid="validation-summary"]')).toBeVisible()
  await expect(page.locator('[data-testid="validation-summary"]')).toContainText('Airflow may be insufficient')

  // 11. Use auto-fix
  await page.click('[data-testid="auto-fix-btn"]')

  // 12. Verify airflow updated
  await expect(page.locator('[data-testid="field-airflow"]')).toHaveValue('4000')

  // 13. Apply changes
  await page.click('[data-testid="apply-btn"]')

  // 14. Verify success
  await expect(page.locator('[data-testid="toast"]')).toHaveText(/success/)
})
```

## 11. Common Pitfalls and Solutions

### Pitfall 1: Validation Runs Too Early

**Problem:**
Validation triggers while user is still typing, showing errors for incomplete input.

**Why It Happens:**
- Validation triggered on every keystroke
- No debouncing implemented
- Eager validation annoys users

**Solution:**
- Debounce validation by 300ms after last keystroke
- Only validate on blur for most fields
- Provide option to disable real-time validation
- Show validation only after user leaves field

### Pitfall 2: Validation Messages Too Technical

**Problem:**
Error messages use technical jargon users don't understand.

**Example:**
"Regex pattern validation failed: /^[A-Z]{3}-\d{3}$/"

**Why It Happens:**
- Messages auto-generated from rule definitions
- No user-friendly message templates
- Developer-focused error strings

**Solution:**
- Write user-friendly messages for all rules
- Provide examples: "Tag must be format: AHU-001"
- Avoid technical terms (regex, schema, etc.)
- Include actionable guidance in message

### Pitfall 3: Cross-Field Validation Creates Confusing Loops

**Problem:**
User fixes Field A, which invalidates Field B, which when fixed invalidates Field A again.

**Why It Happens:**
- Bidirectional dependencies without smart handling
- No guidance on resolution order
- Re-validation doesn't suggest fixes

**Solution:**
- Provide "Fix All" auto-correction when possible
- Show resolution order: "Fix Field A first, then Field B"
- Detect validation loops and break with suggestion
- Use warnings instead of errors for soft dependencies

### Pitfall 4: Validation Allows Edge Cases That Cause Problems

**Problem:**
Validation passes values that are technically valid but cause downstream calculation errors or poor performance.

**Why It Happens:**
- Validation rules too lenient
- Edge cases not considered in rule design
- No warnings for unusual but valid values

**Solution:**
- Implement warning-level validation for edge cases
- "This value is unusual. Are you sure?"
- Link to documentation explaining implications
- Track edge cases that cause issues, update rules

### Pitfall 5: Override Abuse Without Proper Controls

**Problem:**
Users override validation too easily, bypassing important checks without proper review.

**Why It Happens:**
- Override too accessible
- No approval workflow
- Insufficient justification required
- No audit or review process

**Solution:**
- Require minimum justification length (20+ characters)
- Role-based override permissions (warnings vs. errors)
- Periodic review of overrides by supervisors
- Flag projects with multiple overrides for review
- Temporary overrides that expire and re-validate

## 12. Performance Tips

### Tip 1: Cache Validation Results

Cache validation results for unchanged values to avoid redundant validation.

**Impact:** Validation time reduced by 80% for repeated checks

### Tip 2: Use Async Validation for Expensive Rules

Run expensive validation (API calls, complex calculations) asynchronously with Web Workers.

**Impact:** UI remains responsive during validation

### Tip 3: Batch Validate Multiple Fields

When applying changes, batch validate all fields in single pass rather than individually.

**Impact:** Validation time: 500ms → 100ms for 20 fields

### Tip 4: Lazy Load Validation Rules

Load validation rule definitions only when needed for specific entity types.

**Impact:** Initial app load time reduced by 200ms

### Tip 5: Optimize Regex Patterns

Use optimized regex patterns and avoid backtracking for pattern validation.

**Impact:** Pattern validation: 50ms → 5ms for complex patterns

## 13. Future Enhancements

1. **AI-Powered Validation Suggestions**: Machine learning suggests fixes for common validation errors

2. **Validation Rule Builder UI**: Visual interface for administrators to create custom validation rules without coding

3. **Contextual Validation**: Rules that adapt based on project type, location, climate zone automatically

4. **Predictive Validation**: Warn users before they enter invalid values based on context

5. **Smart Auto-Fix**: AI determines best fix for validation errors based on design intent

6. **Validation Templates**: Pre-configured rule sets for different building types or standards

7. **Real-Time Collaboration Validation**: Validate changes in real-time with team members' concurrent edits

8. **Validation Analytics**: Dashboard showing most common validation failures to improve UX

9. **Voice-Activated Validation**: Read validation errors aloud for accessibility

10. **Validation Simulation**: Preview how property changes will affect validation before applying
