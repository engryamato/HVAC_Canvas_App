'use client';

import * as React from 'react';
import { isEnabled } from '@/core/flags/featureFlags';
import { commitEntityProps } from '@/core/actions/entityActions';
import { useEntityStore } from '@/core/store/entityStore';
import type { Fitting } from '@/core/schema';
import { useSelectionStore } from '../../store/selectionStore';
import { useCasStore } from '../../store/casStore';
import { AxialMenu } from './AxialMenu';
import type { VariantPatch } from './axialFamilyMaps';
import { fittingTypeToFamily, resolveFittingShape, type AxialShape } from './fittingFamily';

interface AxialRequestDetail {
  entityId?: string;
  x?: number;
  y?: number;
}

interface OpenMenuState {
  fitting: Fitting;
  anchor: { x: number; y: number };
  shape: AxialShape;
  // Monotonic per-request id. Used as the AxialMenu `key` so every open
  // remounts a fresh menu (root level, no stale navigation stack) even when a
  // new request arrives while the menu is already open.
  token: number;
}

function isFitting(entity: unknown): entity is Fitting {
  return Boolean(entity && typeof entity === 'object' && (entity as { type?: string }).type === 'fitting');
}

function viewportCenter() {
  if (typeof window === 'undefined') {
    return { x: 512, y: 384 };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function resolveAnchor(detail?: AxialRequestDetail): { x: number; y: number } {
  if (typeof detail?.x === 'number' && typeof detail?.y === 'number') {
    return { x: detail.x, y: detail.y };
  }

  const cas = useCasStore.getState();
  if (cas.anchorRect) {
    return {
      x: cas.anchorRect.x + cas.anchorRect.width / 2,
      y: cas.anchorRect.y + cas.anchorRect.height / 2,
    };
  }

  return viewportCenter();
}

function resolveRequestedFitting(detail?: AxialRequestDetail): Omit<OpenMenuState, 'token'> | null {
  const entitiesById = useEntityStore.getState().byId;
  const selectedIds = useSelectionStore.getState().selectedIds;
  const entityId = detail?.entityId ?? selectedIds[0];
  const entity = entityId ? entitiesById[entityId] : undefined;

  if (!isFitting(entity)) {
    return null;
  }

  return {
    fitting: entity,
    anchor: resolveAnchor(detail),
    shape: resolveFittingShape(entity, entitiesById),
  };
}

export function AxialLayer() {
  const enabled = isEnabled('WS6_CONSTRUCTION_DERIVATION');
  const [openMenu, setOpenMenu] = React.useState<OpenMenuState | null>(null);
  const requestSeq = React.useRef(0);

  React.useEffect(() => {
    if (!enabled) {
      setOpenMenu(null);
      return;
    }

    const handleRequest = (event: Event) => {
      const detail = event instanceof CustomEvent ? (event.detail as AxialRequestDetail | undefined) : undefined;
      const resolved = resolveRequestedFitting(detail);
      setOpenMenu(resolved ? { ...resolved, token: (requestSeq.current += 1) } : null);
    };

    window.addEventListener('sws:axial-menu-requested', handleRequest);
    return () => window.removeEventListener('sws:axial-menu-requested', handleRequest);
  }, [enabled]);

  if (!enabled || !openMenu) {
    return null;
  }

  const family = fittingTypeToFamily[openMenu.fitting.props.fittingType];

  return (
    <AxialMenu
      key={openMenu.token}
      family={family}
      shape={openMenu.shape}
      anchor={openMenu.anchor}
      onClose={() => setOpenMenu(null)}
      onPick={(patch: VariantPatch) => {
        // Read the latest fitting from the store at pick time: the menu may have
        // been open while the fitting's props changed elsewhere, so committing
        // the open-time snapshot would clobber that newer state.
        const latest = useEntityStore.getState().byId[openMenu.fitting.id];
        if (isFitting(latest)) {
          commitEntityProps(
            latest.id,
            {
              ...latest.props,
              variant: {
                ...(latest.props.variant ?? {}),
                ...patch,
              },
            },
            latest
          );
        }
        setOpenMenu(null);
      }}
    />
  );
}
