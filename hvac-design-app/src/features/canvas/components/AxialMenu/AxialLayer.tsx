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

function resolveRequestedFitting(detail?: AxialRequestDetail): OpenMenuState | null {
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

  React.useEffect(() => {
    if (!enabled) {
      setOpenMenu(null);
      return;
    }

    const handleRequest = (event: Event) => {
      const detail = event instanceof CustomEvent ? (event.detail as AxialRequestDetail | undefined) : undefined;
      setOpenMenu(resolveRequestedFitting(detail));
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
      family={family}
      shape={openMenu.shape}
      anchor={openMenu.anchor}
      onClose={() => setOpenMenu(null)}
      onPick={(patch: VariantPatch) => {
        commitEntityProps(
          openMenu.fitting.id,
          {
            ...openMenu.fitting.props,
            variant: {
              ...(openMenu.fitting.props.variant ?? {}),
              ...patch,
            },
          },
          openMenu.fitting
        );
        setOpenMenu(null);
      }}
    />
  );
}
