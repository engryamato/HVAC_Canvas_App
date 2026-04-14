'use client';

import { useEffect, useState } from 'react';
import { Box, CookingPot, Flame, Gauge } from 'lucide-react';
import { useToolStore } from '@/core/store/canvas.store';
import { useValidationSummary } from '@/core/store/validationStore';
import { useUnifiedCatalogStore } from '@/core/store/componentLibraryStoreV2';
import { useBOM } from '../hooks/useBOM';
import {
  resolvePlacementStrategy,
  type PlacementBannerInfo,
  type PlacementToolbarIconKey,
} from '../tools/placementStrategies';

const TONE_STYLES: Record<NonNullable<PlacementBannerInfo['tone']>, { text: string; background: string; border: string }> = {
  info: { text: '#2563eb', background: 'rgba(37, 99, 235, 0.12)', border: 'rgba(37, 99, 235, 0.24)' },
  success: { text: '#16a34a', background: 'rgba(22, 163, 74, 0.12)', border: 'rgba(22, 163, 74, 0.24)' },
  warning: { text: '#d97706', background: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.24)' },
};

function getBannerIcon(iconKey: PlacementToolbarIconKey) {
  switch (iconKey) {
    case 'boiler_flue':
      return Flame;
    case 'grease_duct':
      return CookingPot;
    case 'generator_exhaust':
      return Gauge;
    case 'duct':
    default:
      return Box;
  }
}

function getToneStyles(tone: PlacementBannerInfo['tone'], accentColor?: string) {
  if (accentColor) {
    return {
      text: accentColor,
      background: `color-mix(in srgb, ${accentColor} 14%, white)`,
      border: `color-mix(in srgb, ${accentColor} 24%, white)`,
    };
  }

  return tone ? TONE_STYLES[tone] : TONE_STYLES.info;
}

function iconBackground(accentColor: string | undefined, tone: PlacementBannerInfo['tone']) {
  if (accentColor) {
    return `color-mix(in srgb, ${accentColor} 16%, white)`;
  }

  return tone ? TONE_STYLES[tone].background : TONE_STYLES.info.background;
}

export function ServiceContextStrip() {
  const [mounted, setMounted] = useState(false);
  const validationSummary = useValidationSummary();
  const activeSpecialtyToolId = useToolStore((state) => state.activeSpecialtyToolId);
  const activeEntryId = useUnifiedCatalogStore((state) => state.activeEntryId);
  const catalogEntries = useUnifiedCatalogStore((state) => state.catalogEntries);
  const systemProfiles = useUnifiedCatalogStore((state) => state.systemProfiles);
  const activeSystemType = useUnifiedCatalogStore((state) => state.activeSystemType);
  const setSystemType = useUnifiedCatalogStore((state) => state.setSystemType);
  const { totals } = useBOM();
  const activeEntry = catalogEntries.find((entry) => entry.id === activeEntryId);
  const activeSystemProfile = activeEntry
    ? systemProfiles.find((profile) => profile.engineeringSystem === activeEntry.engineeringSystem)
    : undefined;
  const activeSpecialtyStrategy = activeSpecialtyToolId ? resolvePlacementStrategy(activeSpecialtyToolId) : null;
  const activeSpecialtyBanner = activeSpecialtyStrategy
    ? activeSpecialtyStrategy.getSystemBannerInfo?.({
        engineeringSystem: activeSpecialtyStrategy.engineeringSystem,
        specialtyToolId: activeSpecialtyToolId,
        startPoint: null,
        endPoint: null,
        snapTarget: null,
      }) ?? {
        title: activeSpecialtyStrategy.label,
        description: activeSpecialtyStrategy.getToolbarMetadata().tooltip,
        tone: 'info' as const,
      }
    : null;
  const activeSpecialtyProfile = activeSpecialtyStrategy
    ? systemProfiles.find((profile) => profile.engineeringSystem === activeSpecialtyStrategy.engineeringSystem) ?? activeSystemProfile
    : undefined;
  const BannerIcon = activeSpecialtyStrategy
    ? getBannerIcon(activeSpecialtyStrategy.getToolbarMetadata().iconKey)
    : Box;
  const bannerStyles = activeSpecialtyBanner
    ? getToneStyles(activeSpecialtyBanner.tone, activeSpecialtyProfile?.color)
    : null;
  const bannerIconBackground = bannerStyles ? iconBackground(activeSpecialtyProfile?.color, activeSpecialtyBanner?.tone) : null;
  const warning =
    activeEntry && activeSystemProfile && activeSystemType !== activeSystemProfile.defaultSystemType
      ? `Service override is set to ${activeSystemType.replace('_', ' ')}, but ${activeEntry.name} still follows ${activeSystemProfile.name} engineering rules.`
      : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-8 w-full items-center justify-center border-b bg-slate-50 text-xs text-slate-600">
        Loading catalog context...
      </div>
    );
  }

  if (!activeEntry) {
    return (
      <div className="flex h-8 w-full items-center justify-center border-b bg-slate-50 text-xs text-slate-600">
        No active catalog entry selected.
      </div>
    );
  }

  return (
    <div className="w-full border-b bg-white text-xs">
      {activeSpecialtyBanner && bannerStyles ? (
        <div
          data-testid="specialty-context-banner"
          className="flex items-center justify-between gap-3 border-b px-4 py-2"
          style={{
            backgroundColor: bannerStyles.background,
            borderColor: bannerStyles.border,
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
              data-testid="specialty-context-banner-icon"
              style={{
                backgroundColor: bannerIconBackground ?? bannerStyles.background,
                borderColor: bannerStyles.border,
                color: bannerStyles.text,
              }}
            >
              <BannerIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Specialty Context
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    color: bannerStyles.text,
                    backgroundColor: bannerIconBackground ?? bannerStyles.background,
                  }}
                >
                  Active
                </span>
              </div>
              <div className="truncate text-sm font-semibold text-slate-900" data-testid="specialty-context-banner-title">
                {activeSpecialtyBanner.title}
              </div>
              {activeSpecialtyBanner.description ? (
                <div className="truncate text-[11px] text-slate-600" data-testid="specialty-context-banner-description">
                  {activeSpecialtyBanner.description}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSpecialtyProfile ? (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{
                  color: activeSpecialtyProfile.color,
                  backgroundColor: `color-mix(in srgb, ${activeSpecialtyProfile.color} 14%, white)`,
                }}
              >
                {activeSpecialtyProfile.name}
              </span>
            ) : null}
            <span className="text-[11px] text-slate-600">Esc exits specialty mode</span>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-10 items-center justify-between gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-slate-600">Active:</span>
          {activeEntry ? (
            <>
              <span className="font-medium text-slate-900" data-testid="active-entry-name">
                {activeEntry.name}
              </span>
              <span className="text-slate-500" data-testid="active-entry-system">
                {activeEntry.engineeringSystem.replace(/_/g, ' ')}
              </span>
            </>
          ) : (
            <span className="text-slate-500">No active catalog entry selected.</span>
          )}
          <select
            value={activeSystemType}
            onChange={(event) => setSystemType(event.target.value as typeof activeSystemType)}
            className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
          >
            <option value="supply">Supply</option>
            <option value="return">Return</option>
            <option value="exhaust">Exhaust</option>
            <option value="outside_air">Outside Air</option>
          </select>
          {warning ? <span className="text-amber-700">{warning}</span> : null}
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            BOM Live · {totals.totalItems} {totals.totalItems === 1 ? 'item' : 'items'}
          </span>
          <span className={validationSummary.totalIssues > 0 ? 'text-amber-700' : 'text-emerald-700'}>
            {validationSummary.totalIssues > 0 ? `${validationSummary.totalIssues} Issues` : 'Validated'}
          </span>
        </div>
      </div>
    </div>
  );
}
