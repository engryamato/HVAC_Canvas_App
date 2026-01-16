# [UJ-PM-007] Search and Filter Projects (Tauri Offline)

## Overview

### Purpose
This document describes how users search and filter projects in the Tauri Desktop platform.

### Scope
- Filtering projects loaded from File System
- Sorting by Date/Name

### User Personas
- **Primary**: Designers managing local files

### Success Criteria
- Real-time filtering of local files
- Fast response

### Platform Summary (Tauri Offline)
- **Data Source**: File System Scan -> `ProjectListStore` (In-Memory)
- **Search Engine**: Client-side Array filtering (metadata only)
- **External Changes**: Button to "Rescan Folder" if files added externally.

## Prerequisites
- Projects scanned from `Documents/HVAC Projects`

## User Journey Steps

### Step 1: Type Query
**User Action**: Type "Office".
**System Response**: List filters to matching names (from loaded metadata).

### Step 2: Change Sort
**User Action**: Select "Name (A-Z)".
**System Response**: List reorders.

### Step 3: Clear
**User Action**: Click Clear button.
**System Response**: Full list shown.

## Edge Cases
- **Metric Mismatch**: If searching by file properties vs metadata properties.
- **Rescan Needed**: If file deleted externally, search result might click-through to "File Not Found".

## Related Elements
- `SearchBar`
- `FileSystemService`
