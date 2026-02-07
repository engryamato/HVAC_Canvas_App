'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InspectorPanel } from './InspectorPanel';
import { useInspectorPreferencesStore } from '../../store/inspectorPreferencesStore';
import { validateFloatingPosition } from '../../utils/validateFloatingPosition';

const DEFAULT_FLOATING_INSPECTOR_WIDTH_PX = 320;
const PORTAL_ELEMENT_ID = 'floating-inspector-portal';

export interface FloatingInspectorProps {
  onDock: () => void;
}

export function FloatingInspector({ onDock }: FloatingInspectorProps) {
  const floatingPosition = useInspectorPreferencesStore((state) => state.floatingPosition);
  const setFloatingPosition = useInspectorPreferencesStore((state) => state.setFloatingPosition);

  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const dragStartMouseRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartPanelRef = useRef<{ x: number; y: number } | null>(null);
  const lastDragPositionRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const existing = document.getElementById(PORTAL_ELEMENT_ID);
    if (existing) {
      setPortalElement(existing);
      return;
    }

    const created = document.createElement('div');
    created.id = PORTAL_ELEMENT_ID;
    document.body.appendChild(created);
    setPortalElement(created);

    return () => {
      created.remove();
    };
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const dragStartMouse = dragStartMouseRef.current;
      const dragStartPanel = dragStartPanelRef.current;

      if (!dragStartMouse || !dragStartPanel) {
        return;
      }

      const nextPosition = {
        x: dragStartPanel.x + (event.clientX - dragStartMouse.x),
        y: dragStartPanel.y + (event.clientY - dragStartMouse.y),
      };

      lastDragPositionRef.current = nextPosition;
      setDragPosition(nextPosition);
    };

    const handleMouseUp = () => {
      const finalPosition = lastDragPositionRef.current;

      setIsDragging(false);
      dragStartMouseRef.current = null;
      dragStartPanelRef.current = null;
      lastDragPositionRef.current = null;
      setDragPosition(null);

      document.body.style.userSelect = '';

      if (finalPosition) {
        setFloatingPosition(finalPosition);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setFloatingPosition]);

  useEffect(() => {
    if (!floatingPosition || isDragging) {
      return;
    }

    const handleResize = () => {
      const rect = containerRef.current?.getBoundingClientRect();

      const validatedPosition = validateFloatingPosition(
        floatingPosition,
        {
          width: rect?.width ?? DEFAULT_FLOATING_INSPECTOR_WIDTH_PX,
          height: rect?.height ?? 600,
        },
        { width: window.innerWidth, height: window.innerHeight }
      );

      if (
        validatedPosition.x !== floatingPosition.x ||
        validatedPosition.y !== floatingPosition.y
      ) {
        setFloatingPosition(validatedPosition);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [floatingPosition, isDragging, setFloatingPosition]);

  const floatingStyle = useMemo<React.CSSProperties>(() => {
    const position = dragPosition ?? floatingPosition;
    const left = position?.x ?? 0;
    const top = position?.y ?? 0;

    return {
      left,
      top,
      width: DEFAULT_FLOATING_INSPECTOR_WIDTH_PX,
    };
  }, [dragPosition, floatingPosition]);

  const handleHeaderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onDock();
    }
  };

  const handleHeaderMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    const initialPanelPosition = dragPosition ?? floatingPosition ?? { x: 0, y: 0 };

    dragStartMouseRef.current = { x: event.clientX, y: event.clientY };
    dragStartPanelRef.current = { x: initialPanelPosition.x, y: initialPanelPosition.y };
    lastDragPositionRef.current = { x: initialPanelPosition.x, y: initialPanelPosition.y };

    document.body.style.userSelect = 'none';
    setIsDragging(true);
  };

  if (!portalElement) {
    return null;
  }

  return createPortal(
    <div
      ref={containerRef}
      className="fixed z-50 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xl"
      style={floatingStyle}
      role="dialog"
      aria-label="Floating Properties Panel"
      data-testid="floating-inspector"
    >
      <div
        className={`flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 ${
          isDragging ? 'cursor-grabbing' : 'cursor-move'
        }`}
        onMouseDown={handleHeaderMouseDown}
        onKeyDown={handleHeaderKeyDown}
        tabIndex={0}
        aria-grabbed={isDragging}
      >
        <div className="text-sm font-semibold text-slate-900">Properties</div>
        <button
          type="button"
          onClick={onDock}
          onMouseDown={(event) => event.stopPropagation()}
          className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600"
        >
          Dock
        </button>
      </div>

      <div className="max-h-[calc(100vh-120px)] overflow-auto">
        <InspectorPanel embedded={false} />
      </div>
    </div>,
    portalElement
  );
}

export default FloatingInspector;
