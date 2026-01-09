'use client';

import { useEffect, useState } from 'react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

/**
 * SearchBar component with 300ms debounce for project filtering
 * Implements UJ-PM-002 Step 2: Searching and Filtering Projects
 */
export function SearchBar({ value, onChange }: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value);

    // Debounce the onChange callback by 300ms
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [localValue, onChange]);

    // Sync with external value changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleClear = () => {
        setLocalValue('');
    };

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <input
                type="text"
                placeholder="Search projects..."
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                style={{
                    width: '100%',
                    padding: '8px 32px 8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                }}
                aria-label="Search projects"
            />
            {localValue && (
                <button
                    onClick={handleClear}
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: '#999',
                    }}
                    aria-label="Clear search"
                >
                    ×
                </button>
            )}
        </div>
    );
}
