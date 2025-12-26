import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type Duct,
  DuctSchema,
  type Equipment,
  EquipmentSchema,
  type Room,
  RoomSchema,
  type Entity,
} from '@/core/schema';

type SupportedEntity = Room | Duct | Equipment;

type ValidationErrors = Record<string, string | undefined>;

function schemaFor(entity?: Entity | null) {
  switch (entity?.type) {
    case 'room':
      return RoomSchema;
    case 'duct':
      return DuctSchema;
    case 'equipment':
      return EquipmentSchema;
    default:
      return null;
  }
}

function pathMatchesField(path: PropertyKey[], field: string) {
  if (!path.length) {
    return false;
  }
  const stringPath = path.map(String);
  return stringPath.includes(field) || stringPath.join('.').endsWith(field);
}

/**
 * Debounced, field-level validation using the existing Zod schemas.
 * Returns current errors and a validateField helper that also gates updates.
 */
export function useFieldValidation(entity: SupportedEntity | null) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    setErrors({});
  }, [entity?.id]);

  const validateField = useCallback((field: string, draft: SupportedEntity): boolean => {
    const schema = schemaFor(draft);
    if (!schema) {
      return true;
    }

    const result = schema.safeParse(draft);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      if (result.success) {
        setErrors((prev) => {
          const { [field]: _omit, ...rest } = prev;
          return rest;
        });
      } else {
        const fieldError = result.error.issues.find((err) => pathMatchesField(err.path, field));
        if (fieldError) {
          setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
        }
      }
    }, 300);

    return result.success;
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const { [field]: _omit, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    errors,
    validateField,
    clearError,
  };
}

export default useFieldValidation;
