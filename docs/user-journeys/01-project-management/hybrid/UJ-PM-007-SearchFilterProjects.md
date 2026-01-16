# [UJ-PM-007] Search and Filter Projects (Hybrid/Web)

## Overview

### Purpose
This document describes how users search and filter projects in the Hybrid/Web platform.

### Scope
- Filtering projects loaded from IndexedDB
- Sorting by Date/Name

### User Personas
- **Primary**: Designers managing portfolios

### Success Criteria
- Real-time filtering
- Fast response (<100ms)

### Platform Summary (Hybrid/Web)
- **Data Source**: IndexedDB -> `ProjectListStore` (In-Memory)
- **Search Engine**: Client-side Array filtering
- **Performance**: High (all metadata in memory)

## Prerequisites
- Projects loaded from IDB

## User Journey Steps

### Step 1: Type Query
**User Action**: Type "Office".
**System Response**: List filters to matching names.

### Step 2: Change Sort
**User Action**: Select "Name (A-Z)".
**System Response**: List reorders.

### Step 3: Clear
**User Action**: Click Clear button.
**System Response**: Full list shown.

## Edge Cases
- **Large Lists**: Virtualization used for rendering 100+ items.
- **Empty State**: Show "No results found".

## Related Elements
- `SearchBar`
- `ProjectListStore`
