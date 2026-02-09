'use client';

import { useEffect, useState } from 'react';
import { useToolActions } from '@/core/store/canvas.store';

interface FABToolProps {
  className?: string;
}

export function FABTool({ className = '' }: FABToolProps) {
  const { setTool } = useToolActions();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (tool: 'room' | 'duct' | 'equipment') => {
    setTool(tool);
    setIsOpen(false);
  };

  return (
    <div className={`fab-tool ${className}`} data-testid="fab-tool">
      <button
        type="button"
        className="fab-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Quick create"
      >
        +
      </button>

      {isOpen && (
        <div className="fab-menu" role="menu">
          <button type="button" className="fab-item" onClick={() => handleSelect('room')}>
            Rooms
          </button>
          <button type="button" className="fab-item" onClick={() => handleSelect('duct')}>
            Ducts
          </button>
          <button type="button" className="fab-item" onClick={() => handleSelect('equipment')}>
            Equipments
          </button>
        </div>
      )}
    </div>
  );
}

export default FABTool;

