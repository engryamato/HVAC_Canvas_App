import React from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
  variant?: 'default' | 'primary' | 'danger';
}

/**
 * Consistent icon-only button component
 * 
 * Features:
 * - Consistent sizing (32×32px default)
 * - Disabled state styling
 * - Hover/active states
 * - Tooltip support via title
 * - Multiple variants (default, primary, danger)
 * 
 * Usage:
 * ```tsx
 * <IconButton
 *   icon={<span>↶</span>}
 *   onClick={handleUndo}
 *   disabled={!canUndo}
 *   title="Undo (Ctrl+Z)"
 * />
 * ```
 */
export function IconButton({ 
  icon, 
  onClick, 
  disabled = false, 
  title, 
  className,
  variant = 'default'
}: IconButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className || ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
      aria-label={title}
    >
      {icon}
    </button>
  );
}