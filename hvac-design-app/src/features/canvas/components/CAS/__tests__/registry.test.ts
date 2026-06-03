import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import {
  CAS_ENTITY_SCOPES,
  casActionRegistry,
  getActionsForEntity,
} from '../actionRegistry';

describe('CAS action registry', () => {
  it('has zero duplicate action ids and no global actions', () => {
    const ids = casActionRegistry.map((action) => action.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(casActionRegistry.every((action) => action.isGlobal === false)).toBe(true);
  });

  it('caps every entity type at six actions', () => {
    CAS_ENTITY_SCOPES.forEach((scope) => {
      expect(getActionsForEntity({ scope }).length).toBeLessThanOrEqual(6);
    });
  });

  it('does not import store setters from CAS files', () => {
    const root = path.resolve(__dirname, '..');
    const files = fs.readdirSync(root).filter((file) => /\.(ts|tsx)$/.test(file));
    const forbiddenPatterns = [
      /@\/core\/commands\/entityCommands/,
      /@\/core\/store\/settingsStore/,
      /updateEntity/,
      /updateEntities/,
      /useSettingsStore/,
    ];

    const offenders = files.flatMap((file) => {
      const contents = fs.readFileSync(path.join(root, file), 'utf8');
      return forbiddenPatterns.some((pattern) => pattern.test(contents)) ? [file] : [];
    });

    expect(offenders).toEqual([]);
  });
});
