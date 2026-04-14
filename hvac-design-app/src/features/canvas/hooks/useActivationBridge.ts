'use client';

import { useEffect, useMemo } from 'react';
import { useToolActions } from '@/core/store/canvas.store';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import { resolveEquipmentType, resolveFittingType } from '../tools/catalogPlacement';
import { isSupportToolEntry } from '../tools/supportPlacement';

function resolveTool(componentClass: string, isSupportEntry: boolean) {
  if (isSupportEntry) {
    return 'support';
  }

  switch (componentClass) {
    case 'duct':
      return 'duct';
    case 'fitting':
      return 'fitting';
    case 'equipment':
    case 'accessory':
      return 'equipment';
    default:
      return 'select';
  }
}

export function useActivationBridge(): void {
  const activeEntryId = useUnifiedCatalogStore((state) => state.activeEntryId);
  const catalogEntries = useUnifiedCatalogStore((state) => state.catalogEntries);
  const getActivationIntent = useUnifiedCatalogStore((state) => state.getActivationIntent);
  const {
    setEquipmentType,
    setFittingType,
    setTool,
    setSpecialtyToolId,
    setSupportSettings,
    setSupportPrompt,
  } = useToolActions();
  const activeEntry = useMemo(
    () => catalogEntries.find((entry) => entry.id === activeEntryId),
    [activeEntryId, catalogEntries]
  );
  const activationIntent = useMemo(
    () => getActivationIntent(),
    [getActivationIntent, activeEntryId, catalogEntries]
  );

  useEffect(() => {
    if (!activeEntry || !activationIntent) {
      setSpecialtyToolId(null);
      setSupportPrompt(null);
      return;
    }

    const supportEntry = isSupportToolEntry(activeEntry);
    setTool(resolveTool(activationIntent.componentClass, supportEntry));
    setSpecialtyToolId(supportEntry ? null : activationIntent.specialtyToolId);
    if (supportEntry) {
      setSupportPrompt(null);
      if (activeEntry.componentClass === 'accessory') {
        setSupportSettings({ hangerEntryId: activeEntry.id });
      } else if (
        activeEntry.typeId === 'auto_hanger_spacing' &&
        activeEntry.recommendedAccessoryEntryIds?.[0]
      ) {
        setSupportSettings({ hangerEntryId: activeEntry.recommendedAccessoryEntryIds[0] });
      }
      return;
    }
    if (activeEntry.componentClass === 'fitting') {
      setFittingType(resolveFittingType(activeEntry));
    }
    if (activeEntry.componentClass === 'equipment' || activeEntry.componentClass === 'accessory') {
      setEquipmentType(resolveEquipmentType(activeEntry));
    }
  }, [
    activeEntry,
    activationIntent,
    setEquipmentType,
    setFittingType,
    setSupportPrompt,
    setSupportSettings,
    setSpecialtyToolId,
    setTool,
  ]);
}

export default useActivationBridge;
