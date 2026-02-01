'use client';

import React, { useState } from 'react';
import styles from './CollapsibleSection.module.css';

export interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  onToggle?: (expanded: boolean) => void;
  expanded?: boolean;
}

/**
 * Expandable section component for inspectors and panels
 * 
 * Features:
 * - Smooth height transition animation
 * - Rotating arrow icon indicator
 * - Default expanded/collapsed state
 * - Preserves content while collapsed
 * 
 * Usage:
 * ```tsx
 * <CollapsibleSection title="Grid Settings" defaultExpanded>
 *   <div>Grid configuration controls</div>
 * </CollapsibleSection>
 * ```
 */
export function CollapsibleSection(props: CollapsibleSectionProps) {
  const { 
    title, 
    defaultExpanded = true, 
    children, 
    className,
    onToggle,
    expanded
  } = props;

  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  
  const isExpanded = expanded !== undefined ? expanded : internalExpanded;

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    if (expanded === undefined) {
      setInternalExpanded(newExpanded);
    }
    onToggle?.(newExpanded);
  };

  return (
    <div className={`${styles.section} ${className || ''}`}>
      <button 
        className={styles.header} 
        onClick={handleToggle}
        aria-expanded={isExpanded}
        type="button"
      >
        <span 
          className={`${styles.icon} ${isExpanded ? styles.expanded : ''}`}
          data-testid="expand-icon"
          data-expanded={isExpanded.toString()}
        >
          ▶
        </span>
        <span className={styles.title}>{title}</span>
      </button>
      {isExpanded && (
        <div className={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
}