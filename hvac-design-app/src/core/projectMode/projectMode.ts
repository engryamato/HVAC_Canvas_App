/**
 * WS8 — Persisted Estimation/Design project mode.
 *
 * A real, persisted project mode (NOT the inert legacy `autoCalculate`) that
 * sets sensible defaults for the takeoff/estimator persona vs the designer
 * persona. WS8 owns the mode + the derived default flags; the *behaviors* live
 * in WS5 (size posture), WS6 (auto-fitting), and WS7 (cost columns).
 *
 * Dependency note (see [[ws5-sizing-and-codex-cycle]]): this module must stay a
 * leaf — it imports ONLY featureFlags (+ a type). The entity/sizing layer reads
 * the live mode through a runtime-registered provider rather than importing the
 * settings store, which would create the entityStore ⇄ settingsStore ESM cycle.
 */

export const PROJECT_MODES = ['estimation', 'design'] as const;
export type ProjectMode = (typeof PROJECT_MODES)[number];

/** New-project default. Matches the takeoff emphasis (ticket decision: locked). */
export const DEFAULT_PROJECT_MODE: ProjectMode = 'estimation';

export function isProjectMode(value: unknown): value is ProjectMode {
  return value === 'estimation' || value === 'design';
}

/**
 * Provider that yields the live persisted project mode. Registered at runtime by
 * the settings store so this module never statically imports the store.
 */
let projectModeProvider: (() => ProjectMode) | null = null;
let autoFittingProvider: (() => boolean | undefined) | null = null;

export function registerProjectModeProvider(provider: () => ProjectMode): void {
  projectModeProvider = provider;
}

/** Test/teardown helper — clears the registered provider. */
export function resetProjectModeProvider(): void {
  projectModeProvider = null;
}

export function registerAutoFittingProvider(provider: () => boolean | undefined): void {
  autoFittingProvider = provider;
}

/** Test/teardown helper - clears the registered auto-fitting provider. */
export function resetAutoFittingProvider(): void {
  autoFittingProvider = null;
}

/**
 * The effective project mode. Falls back to {@link DEFAULT_PROJECT_MODE} when no
 * provider is registered (e.g. isolated unit tests with no settings store).
 */
export function getProjectMode(): ProjectMode {
  const mode = projectModeProvider?.();
  return isProjectMode(mode) ? mode : DEFAULT_PROJECT_MODE;
}

/**
 * WS5 size posture: the provenance source a newly-created duct's primary
 * dimension starts with. Estimation leans manual-first (`default`, awaiting user
 * entry); Design starts `computed` (legacy behavior). When the WS8 flag is off,
 * always returns `computed` to preserve pre-WS8 behavior exactly.
 */
export function getInitialSizePostureSource(): 'default' | 'computed' {
  return getProjectMode() === 'estimation' ? 'default' : 'computed';
}

/**
 * WS7 cost columns: whether cost columns are visible by default. Estimation →
 * visible; Design → collapsed. When the WS8 flag is off, returns `false` to
 * preserve the legacy default-hidden behavior.
 */
export function areCostColumnsDefaultVisible(): boolean {
  return getProjectMode() === 'estimation';
}

/**
 * WS6 auto-fitting default: always on by default. Project mode no longer drives
 * this behavior; users can override it per project.
 */
export function isAutoFittingDefaultEnabled(): boolean {
  return true;
}

/**
 * Persisted project auto-fitting setting. Greenfield and legacy projects default
 * to enabled when the field is absent.
 */
export function isAutoFittingProjectSettingEnabled(): boolean {
  return autoFittingProvider?.() ?? isAutoFittingDefaultEnabled();
}
