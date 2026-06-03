'use client';

import * as React from 'react';
import { Pencil } from 'lucide-react';

import { useCasStore, type CasAnchorRect } from '../../store/casStore';
import type { CasEntitySnapshot } from './actionRegistry';

interface CASHandleProps {
  entity: CasEntitySnapshot;
  anchorRect?: CasAnchorRect;
  viewport?: { width: number; height: number };
}

function nearestCorner(rect: CasAnchorRect, viewport: { width: number; height: number }) {
  const center = { x: viewport.width / 2, y: viewport.height / 2 };
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height },
  ];

  return corners.reduce((best, corner) => {
    const bestDistance = Math.hypot(best.x - center.x, best.y - center.y);
    const nextDistance = Math.hypot(corner.x - center.x, corner.y - center.y);
    return nextDistance < bestDistance ? corner : best;
  }, corners[0]);
}

export function CASHandle({
  entity,
  anchorRect = { x: 24, y: 24, width: 48, height: 48 },
  viewport = {
    width: typeof window === 'undefined' ? 1024 : window.innerWidth,
    height: typeof window === 'undefined' ? 768 : window.innerHeight,
  },
}: CASHandleProps) {
  const openCas = useCasStore((state) => state.openCas);
  const corner = nearestCorner(anchorRect, viewport);
  const left = Math.max(8, Math.min(corner.x - 14, viewport.width - 36));
  const top = Math.max(8, Math.min(corner.y - 14, viewport.height - 36));

  return (
    <button
      type="button"
      data-testid="cas-handle"
      aria-label="Open quick edits"
      className="absolute z-30 flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700 shadow-md transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
      style={{ left, top }}
      onClick={() => openCas(entity.id, anchorRect)}
    >
      <Pencil aria-hidden="true" size={15} />
    </button>
  );
}
