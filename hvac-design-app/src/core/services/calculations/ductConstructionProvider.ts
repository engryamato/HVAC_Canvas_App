import type { PressureClass, SealClass } from '@/core/schema/duct.schema';

/**
 * WS6b/WS6a wiring — cycle-safe access to the project's construction defaults.
 *
 * The gauge/seal/weight derivation lives in the entity/calculation layer, which
 * must NOT import the settings store (that re-creates the entityStore ⇄
 * settingsStore ESM cycle — see projectMode.ts / WS8). Instead the store
 * registers a provider here at init; the calculators read it through
 * {@link getDuctConstructionDefaults}. Defaults are `undefined` until the store
 * registers, so pure unit tests get a deterministic empty baseline.
 */
export interface DuctConstructionDefaults {
  defaultPressureClass?: PressureClass;
  defaultSealClass?: SealClass;
}

const EMPTY: DuctConstructionDefaults = {};

let provider: () => DuctConstructionDefaults = () => EMPTY;

export function registerDuctConstructionProvider(next: () => DuctConstructionDefaults): void {
  provider = next;
}

export function resetDuctConstructionProvider(): void {
  provider = () => EMPTY;
}

export function getDuctConstructionDefaults(): DuctConstructionDefaults {
  return provider();
}
