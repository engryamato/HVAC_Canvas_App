# [UJ-EXP-002] Export To CSV (Hybrid/Web)

## Overview
This user journey covers exporting project data (Bill of Materials) as a CSV file in the **Web Environment**.

## Prerequisites
- **Data**: Entity List.
- **Generation**: Client-side String concatenation.

## User Journey Steps

### Step 1: Trigger Export
**User Action**: File > Export > CSV (BOM).
**System Response**:
- **Action**: Generates CSV string (with BOM header for Excel compatibility).
- **Download**: Creates Blob -> `<a download="Project_BOM.csv">`.

## Edge Cases

### 1. Special Characters
**Scenario**: Entity names with commas or quotes.
**Handling**:
- **Escaping**: Surround fields with quotes. Escape internal quotes.

## Related Documentation
- [Export PDF](./UJ-EXP-001-ExportToPDF.md)