export const featureFlagNames = [
  'WS1_SINGLE_TOOLBAR',
  'WS2_INLINE_TOOL_OPTIONS',
  'WS3_CAS',
  'WS5_MANUAL_SIZING_PROVENANCE',
  'WS7_BOM_PRICING',
  'WS8_PROJECT_MODE',
  'WS6D_DESIGN_GEOMETRY',
  'WS6_CONSTRUCTION_DERIVATION',
  'WS7_WEIGHT_PRICING',
] as const;

export type FeatureFlag = (typeof featureFlagNames)[number];

type FeatureFlags = Record<FeatureFlag, boolean>;

// This app builds with Next.js + webpack. webpack's DefinePlugin inlines a
// `process.env.NEXT_PUBLIC_*` reference at build time ONLY when it is spelled
// out as a full static literal — dynamic access like
// `process.env[`NEXT_PUBLIC_FF_${name}`]` is NOT replaced and resolves to
// `undefined` in the browser bundle. So every flag is referenced explicitly
// here. (The previous Vite-style `import.meta.env.VITE_FF_*` was a no-op under
// webpack — it compiled to `({}).env` and also emitted an `import.meta`
// warning — so every flag silently defaulted on regardless of the env value.)
const rawFlagEnv: Record<FeatureFlag, string | undefined> = {
  WS1_SINGLE_TOOLBAR: process.env.NEXT_PUBLIC_FF_WS1_SINGLE_TOOLBAR,
  WS2_INLINE_TOOL_OPTIONS: process.env.NEXT_PUBLIC_FF_WS2_INLINE_TOOL_OPTIONS,
  WS3_CAS: process.env.NEXT_PUBLIC_FF_WS3_CAS,
  WS5_MANUAL_SIZING_PROVENANCE: process.env.NEXT_PUBLIC_FF_WS5_MANUAL_SIZING_PROVENANCE,
  WS7_BOM_PRICING: process.env.NEXT_PUBLIC_FF_WS7_BOM_PRICING,
  WS8_PROJECT_MODE: process.env.NEXT_PUBLIC_FF_WS8_PROJECT_MODE,
  WS6D_DESIGN_GEOMETRY: process.env.NEXT_PUBLIC_FF_WS6D_DESIGN_GEOMETRY,
  WS6_CONSTRUCTION_DERIVATION: process.env.NEXT_PUBLIC_FF_WS6_CONSTRUCTION_DERIVATION,
  WS7_WEIGHT_PRICING: process.env.NEXT_PUBLIC_FF_WS7_WEIGHT_PRICING,
};

// Default-ON: a flag is disabled only when its env value is exactly 'false'.
function resolveFlag(name: FeatureFlag): boolean {
  return rawFlagEnv[name] !== 'false';
}

export const featureFlags: FeatureFlags = {
  WS1_SINGLE_TOOLBAR: resolveFlag('WS1_SINGLE_TOOLBAR'),
  WS2_INLINE_TOOL_OPTIONS: resolveFlag('WS2_INLINE_TOOL_OPTIONS'),
  WS3_CAS: resolveFlag('WS3_CAS'),
  WS5_MANUAL_SIZING_PROVENANCE: resolveFlag('WS5_MANUAL_SIZING_PROVENANCE'),
  WS7_BOM_PRICING: resolveFlag('WS7_BOM_PRICING'),
  WS8_PROJECT_MODE: resolveFlag('WS8_PROJECT_MODE'),
  WS6D_DESIGN_GEOMETRY: resolveFlag('WS6D_DESIGN_GEOMETRY'),
  WS6_CONSTRUCTION_DERIVATION: resolveFlag('WS6_CONSTRUCTION_DERIVATION'),
  WS7_WEIGHT_PRICING: resolveFlag('WS7_WEIGHT_PRICING'),
};

export function isEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
