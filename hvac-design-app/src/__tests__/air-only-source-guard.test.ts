import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Identifiers exclusive to the removed specialized applications (grease duct,
// boiler/water-heater flue, generator exhaust). These must carry no trace in src.
// NOTE: patterns are intentionally specific so legitimate air-side tokens are not
// caught — e.g. `specialtyToolId` (generic tool plumbing) and `end_boot` (air
// register boot) must NOT match.
const FORBIDDEN_PATTERNS = [
  /grease/i,
  /GreaseDuct/,
  /boiler/i,
  /BoilerFlue/,
  /generator_exhaust/i,
  /GeneratorExhaust/,
  /single_wall_pipe/i,
  /double_wall_pipe/i,
  /boot_tee/i,
  /draft_inducer/i,
  /condensate_trap/i,
  /specialty_exhaust/i,
  /duct_boiler/i,
  /flanged_exhaust/i,
  /slip_fit_exhaust/i,
  /flexible_liner/i,
  /factory_built_round/i,
  /welded_rectangular/i,
  /zero_clearance/i,
];

const SOURCE_ROOT = join(process.cwd(), 'src');
const THIS_FILE = relative(SOURCE_ROOT, __filename).replace(/\\/g, '/');

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return collectSourceFiles(path);
    }

    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

describe('air-only source guard', () => {
  it('keeps removed specialized identifiers out of src', () => {
    const matches = collectSourceFiles(SOURCE_ROOT).flatMap((file) => {
      const relativePath = relative(SOURCE_ROOT, file).replace(/\\/g, '/');
      if (relativePath === THIS_FILE) {
        return [];
      }

      const contents = readFileSync(file, 'utf8');
      return FORBIDDEN_PATTERNS.flatMap((pattern) =>
        pattern.test(contents) ? [`${relativePath}: ${pattern}`] : []
      );
    });

    expect(matches).toEqual([]);
  });
});
