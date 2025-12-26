'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

/**
 * Reusable dropdown component for menus, filters, zoom/grid selectors
 * 
 * Features:
 * - Click-outside-to-close
 * - Keyboard navigation (arrow keys, Enter)
 * - Optional icons per option
 * - Accessible ARIA labels
 * 
 * Usage:
 * ```tsx
 * <Dropdown
 *   label="Grid Size"
 *   options={[
 *     { value: '12', label: '1/2"' },
 *     { value: '24', label: '1"' }
 *   ]}
 *   value={gridSize}
 *   onChange={setGridSize}
 * />
 * ```
 */
export function Dropdown({ 
  options, 
  value, 
  onChange, 
  label, 
  className 
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = options.findIndex(opt => opt.value === value);
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < options.length - 1 && currentIndex >= 0) {
            const nextOption = options[currentIndex + 1];
            if (nextOption) {
              onChange(nextOption.value);
            }
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const prevOption = options[currentIndex - 1];
            if (prevOption) {
              onChange(prevOption.value);
            }
          }
          break;
        case 'Enter':
          e.preventDefault();
          setIsOpen(false);
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, value, options, onChange]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className={`${styles.dropdown} ${className || ''}`}>
      {label && <label className={styles.label}>{label}</label>}
      <button 
        className={styles.trigger} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        {selectedOption?.icon && <span className={styles.triggerIcon}>{selectedOption.icon}</span>}
        <span className={styles.triggerLabel}>{selectedOption?.label || 'Select...'}</span>
        <span className={styles.arrow}>▼</span>
      </button>
      {isOpen && (
        <ul className={styles.menu} role="listbox">
          {options.map(option => (
            <li 
              key={option.value}
              className={`${styles.menuItem} ${option.value === value ? styles.selected : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={option.value === value}
            >
              {option.icon && <span className={styles.itemIcon}>{option.icon}</span>}
              <span>{option.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}