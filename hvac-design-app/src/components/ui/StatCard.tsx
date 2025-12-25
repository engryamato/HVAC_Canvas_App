import React from 'react';
import styles from './StatCard.module.css';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

/**
 * Dashboard statistics card component
 * 
 * Features:
 * - Large number display
 * - Optional icon on left
 * - Optional trend indicator (↑↓ with %)
 * - Hover animation (lift + shadow)
 * - Responsive sizing
 * 
 * Usage:
 * ```tsx
 * <StatCard
 *   label="Total Projects"
 *   value={24}
 *   icon={<span>📁</span>}
 *   trend={{ value: 12, label: 'this week' }}
 * />
 * ```
 */
export function StatCard({ 
  label, 
  value, 
  icon, 
  trend, 
  className 
}: StatCardProps) {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <div className={styles.value}>{value}</div>
        <div className={styles.label}>{label}</div>
        {trend && (
          <div className={`${styles.trend} ${trend.value > 0 ? styles.up : styles.down}`}>
            {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}