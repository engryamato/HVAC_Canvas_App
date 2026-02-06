'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { InspectorPanel } from './InspectorPanel';
import { useInspectorPreferencesStore } from '../../store/inspectorPreferencesStore';

const DEFAULT_FLOATING_INSPECTOR_WIDTH_PX = 320;
const PORTAL_ELEMENT_ID = 'floating-inspector-portal';

export interface FloatingInspectorProps {
  onDock: () => void;
}

export function FloatingInspector({ onDock }: FloatingInspectorProps) {
  const floatingPosition = useInspectorPreferencesStore((state) => state.floatingPosition);

  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

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

  const floatingStyle = useMemo<React.CSSProperties>(() => {
    const left = floatingPosition?.x ?? 0;
    const top = floatingPosition?.y ?? 0;

    return {
      left,
      top,
      width: DEFAULT_FLOATING_INSPECTOR_WIDTH_PX,
    };
  }, [floatingPosition]);

  if (!portalElement) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-50 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xl"
      style={floatingStyle}
      data-testid="floating-inspector"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        <div className="text-sm font-semibold text-slate-900">Properties</div>
        <button
          type="button"
          onClick={onDock}
          className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
