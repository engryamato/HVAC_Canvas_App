export const featureFlagNames = [
  'WS1_SINGLE_TOOLBAR',
  'WS2_INLINE_TOOL_OPTIONS',
  'WS3_CAS',
  'WS5_MANUAL_SIZING_PROVENANCE',
] as const;

export type FeatureFlag = (typeof featureFlagNames)[number];

type FeatureFlags = Record<FeatureFlag, boolean>;

type ViteImportMeta = ImportMeta & {
  env?: Record<string, string | boolean | undefined>;
};

function readViteEnv(name: FeatureFlag): string | boolean | undefined {
  const meta = import.meta as ViteImportMeta;
  return meta.env?.[`VITE_FF_${name}`];
}

function resolveFlag(name: FeatureFlag): boolean {
  return readViteEnv(name) !== 'false';
}

export const featureFlags: FeatureFlags = {
  WS1_SINGLE_TOOLBAR: resolveFlag('WS1_SINGLE_TOOLBAR'),
  WS2_INLINE_TOOL_OPTIONS: resolveFlag('WS2_INLINE_TOOL_OPTIONS'),
  WS3_CAS: resolveFlag('WS3_CAS'),
  WS5_MANUAL_SIZING_PROVENANCE: resolveFlag('WS5_MANUAL_SIZING_PROVENANCE'),
};

export function isEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
