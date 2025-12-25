'use client';

import React, { useState } from 'react';
import styles from './CollapsibleSection.module.css';

export interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
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
export function CollapsibleSection({ 
  title, 
  defaultExpanded = true, 
  children, 
  className 
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`${styles.section} ${className || ''}`}>
      <button 
        className={styles.header} 
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        type="button"
      >
        <span className={`${styles.icon} ${isExpanded ? styles.expanded : ''}`}>
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