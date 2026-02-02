#!/usr/bin/env python3
"""
Automated Markdown Linting Fixer
Fixes critical markdown linting errors:
- MD031: Fenced code blocks should be surrounded by blank lines
- MD032: Lists should be surrounded by blank lines
- MD012: Remove multiple consecutive blank lines
"""

import re
import sys
from pathlib import Path
from typing import List


def fix_markdown_file(file_path: Path) -> bool:
    """
    Fix markdown linting errors in a file.
    Returns True if changes were made, False otherwise.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False
    
    original_content = ''.join(lines)
    modified = False
    
    # Fix MD031: Add blank lines around fenced code blocks
    lines = fix_blanks_around_fences(lines)
    
    # Fix MD032: Add blank lines around lists
    lines = fix_blanks_around_lists(lines)
    
    # Fix MD012: Remove multiple consecutive blank lines
    lines = fix_multiple_blank_lines(lines)
    
    new_content = ''.join(lines)
    
    if new_content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✓ Fixed: {file_path}")
            modified = True
        except Exception as e:
            print(f"Error writing {file_path}: {e}")
            return False
    else:
        print(f"- No changes: {file_path}")
    
    return modified


def fix_blanks_around_fences(lines: List[str]) -> List[str]:
    """Add blank lines before and after fenced code blocks."""
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Detect start of fenced code block
        if line.strip().startswith('```'):
            # Check if previous line is not blank
            if result and result[-1].strip() != '':
                result.append('\n')
            
            # Add the fence line
            result.append(line)
            i += 1
            
            # Add content until closing fence
            while i < len(lines):
                if lines[i].strip().startswith('```'):
                    result.append(lines[i])
                    i += 1
                    
                    # Check if next line is not blank and not a horizontal rule
                    if i < len(lines) and lines[i].strip() != '' and lines[i].strip() != '---':
                        result.append('\n')
                    break
                else:
                    result.append(lines[i])
                    i += 1
        else:
            result.append(line)
            i += 1
    
    return result


def fix_blanks_around_lists(lines: List[str]) -> List[str]:
    """Add blank lines before and after lists."""
    result = []
    in_list = False
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Check if this is a list item
        is_list_item = (
            stripped.startswith('- ') or
            stripped.startswith('* ') or
            (len(stripped) > 2 and stripped[0].isdigit() and stripped[1:].lstrip().startswith('. '))
        )
        
        # Check if previous line suggests context where blank is needed
        prev_line = result[-1].strip() if result else ''
        prev_is_header = prev_line.startswith('#')
        prev_is_bold_label = prev_line.startswith('**') and prev_line.endswith('**:')
        prev_is_validation = 'Validation Method' in prev_line or 'Expected Result' in prev_line
        
        if is_list_item:
            if not in_list:
                # Starting a new list - check if we need blank line before
                if result and result[-1].strip() != '' and not (prev_is_header or prev_is_bold_label or prev_is_validation):
                    result.append('\n')
                in_list = True
            result.append(line)
        else:
            if in_list and stripped != '':
                # Ending a list - check if we need blank line after
                # Don't add if next line is a fence, horizontal rule, or header
                if not stripped.startswith('```') and stripped != '---' and not stripped.startswith('#'):
                    result.append('\n')
                in_list = False
            elif in_list and stripped == '':
                in_list = False
            
            result.append(line)
        
        i += 1
    
    return result


def fix_multiple_blank_lines(lines: List[str]) -> List[str]:
    """Remove multiple consecutive blank lines, keeping only one."""
    result = []
    blank_count = 0
    
    for line in lines:
        if line.strip() == '':
            blank_count += 1
            if blank_count <= 1:
                result.append(line)
        else:
            blank_count = 0
            result.append(line)
    
    return result


def main():
    """Main function to process markdown files."""
    files_to_fix = [
        "docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-001-DrawRoom.md",
        "docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-002-DrawDuct.md",
        "docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-003-PlaceEquipment.md",
        "docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-004-AddNote.md",
        "docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-005-DrawFittingElbow.md",
        "docs/user-journeys/03-entity-creation/hybrid/UJ-EC-001-DrawRoom.md",
        "docs/user-journeys/03-entity-creation/hybrid/UJ-EC-002-DrawDuct.md",
        "docs/user-journeys/03-entity-creation/hybrid/UJ-EC-003-PlaceEquipment.md",
        "docs/user-journeys/03-entity-creation/hybrid/UJ-EC-004-AddNote.md",
        "docs/user-journeys/03-entity-creation/hybrid/UJ-EC-005-DrawFittingElbow.md",
    ]
    
    print("Markdown Lint Auto-Fixer")
    print("=" * 50)
    
    total_fixed = 0
    
    for file_path_str in files_to_fix:
        file_path = Path(file_path_str)
        if file_path.exists():
            if fix_markdown_file(file_path):
                total_fixed += 1
        else:
            print(f"! File not found: {file_path}")
    
    print("=" * 50)
    print(f"Fixed {total_fixed} file(s)")


if __name__ == "__main__":
    main()
