/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
    isValid: boolean;
    error: string | null;
}

/**
 * Validates a project name for filesystem compatibility and length constraints
 * @param value - The project name to validate
 * @returns ValidationResult with isValid flag and error message if invalid
 */
export function validateProjectName(value: string): ValidationResult {
    const trimmed = value.trim();

    if (trimmed.length < 1) {
        return {
            isValid: false,
            error: 'Project name is required.',
        };
    }

    if (trimmed.length > 100) {
        return {
            isValid: false,
            error: 'Project name must be 100 characters or less.',
        };
    }

    // Check for invalid filename characters: / \ ? % * : | " < >
    if (/[/\\?%*:|"<>]/.test(trimmed)) {
        return {
            isValid: false,
            error: 'Project name contains invalid characters. Avoid: / \\ ? % * : | " < >',
        };
    }

    return {
        isValid: true,
        error: null,
    };
}
