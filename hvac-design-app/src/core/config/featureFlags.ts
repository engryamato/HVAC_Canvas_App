const readBooleanFlag = (name: string, defaultValue: boolean): boolean => {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true';
};

export const ENABLE_CALCULATION_SETTINGS_DIALOG = readBooleanFlag(
  'NEXT_PUBLIC_ENABLE_CALCULATION_SETTINGS_DIALOG',
  true
);

export const ENABLE_BULK_EDIT_DIALOG = readBooleanFlag(
  'NEXT_PUBLIC_ENABLE_BULK_EDIT_DIALOG',
  true
);

export const ENABLE_SYSTEM_TEMPLATE_DIALOG = readBooleanFlag(
  'NEXT_PUBLIC_ENABLE_SYSTEM_TEMPLATE_DIALOG',
  true
);

export const ENABLE_PROJECT_SETUP_WIZARD = readBooleanFlag(
  'NEXT_PUBLIC_ENABLE_PROJECT_SETUP_WIZARD',
  true
);

export const ENABLE_MIGRATION_WIZARD = readBooleanFlag(
  'NEXT_PUBLIC_ENABLE_MIGRATION_WIZARD',
  true
);
