import type { ProjectFile } from '../../persistence/types';
import { readTextFile, exists } from '../../persistence/filesystem';

export interface CorruptionReport {
    isValid: boolean;
    error?: string;
    corruptionType?: 'INVALID_JSON' | 'INVALID_SCHEMA' | 'MISSING_REQUIRED_FIELDS';
}

/**
 * Detects corruption in a project file by validating JSON structure and schema.
 * 
 * Validation checks:
 * 1. Valid JSON parsing
 * 2. Required fields present (projectId, projectName, createdAt, modifiedAt)
 * 3. Basic type validation for critical fields
 * 
 * @param filePath - Absolute path to the .sws file
 * @returns CorruptionReport indicating validity and error details
 */
export async function detectCorruption(filePath: string): Promise<CorruptionReport> {
    try {
        // Check if file exists
        if (!(await exists(filePath))) {
            return {
                isValid: false,
                error: 'File does not exist',
                corruptionType: 'INVALID_JSON',
            };
        }

        // Read file contents
        const content = await readTextFile(filePath);

        // Phase 1: JSON parsing validation
        let parsed: unknown;
        try {
            parsed = JSON.parse(content);
        } catch (jsonError) {
            return {
                isValid: false,
                error: `Invalid JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`,
                corruptionType: 'INVALID_JSON',
            };
        }

        // Phase 2: Schema validation
        if (typeof parsed !== 'object' || parsed === null) {
            return {
                isValid: false,
                error: 'Project file must be a JSON object',
                corruptionType: 'INVALID_SCHEMA',
            };
        }

        const project = parsed as Record<string, unknown>;

        // Phase 3: Required fields validation
        const requiredFields: Array<keyof ProjectFile> = [
            'projectId',
            'projectName',
            'createdAt',
            'modifiedAt',
        ];

        const missingFields = requiredFields.filter((field) => !project[field]);
        if (missingFields.length > 0) {
            return {
                isValid: false,
                error: `Missing required fields: ${missingFields.join(', ')}`,
                corruptionType: 'MISSING_REQUIRED_FIELDS',
            };
        }

        // Phase 4: Type validation for critical fields
        if (typeof project.projectId !== 'string' || project.projectId.trim() === '') {
            return {
                isValid: false,
                error: 'projectId must be a non-empty string',
                corruptionType: 'INVALID_SCHEMA',
            };
        }

        if (typeof project.projectName !== 'string' || project.projectName.trim() === '') {
            return {
                isValid: false,
                error: 'projectName must be a non-empty string',
                corruptionType: 'INVALID_SCHEMA',
            };
        }

        if (typeof project.createdAt !== 'string') {
            return {
                isValid: false,
                error: 'createdAt must be a string',
                corruptionType: 'INVALID_SCHEMA',
            };
        }

        if (typeof project.modifiedAt !== 'string') {
            return {
                isValid: false,
                error: 'modifiedAt must be a string',
                corruptionType: 'INVALID_SCHEMA',
            };
        }

        // All validations passed
        return {
            isValid: true,
        };
    } catch (error) {
        return {
            isValid: false,
            error: `Corruption detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            corruptionType: 'INVALID_JSON',
        };
    }
}
