import { CalculationTemplate, CalculationSettings } from '../../schema/calculation-settings.schema';
import { SystemTemplate } from '../../schema/system-template.schema';
import { ComponentLibrary } from '../../schema/component-library.schema';

/**
 * Project Initialization Service
 * 
 * Handles new project setup with templates and default configurations.
 * Provides wizard-like initialization workflow.
 */

export interface ProjectInitializationOptions {
  projectName: string;
  location?: string;
  estimator?: string;
  
  // Template selection
  calculationTemplateId?: string;
  systemTemplates?: string[]; // IDs of system templates to include
  componentLibraryId?: string;
  
  // Quick setup options
  useDefaults?: boolean;
  projectType?: 'commercial' | 'residential' | 'industrial';
}

export interface InitializedProject {
  projectInfo: {
    name: string;
    location?: string;
    estimator?: string;
    createdAt: Date;
  };
  
  calculationSettings: CalculationSettings;
  systemTemplates: SystemTemplate[];
  componentLibrary?: ComponentLibrary;
  
  status: 'ready' | 'incomplete';
  missingItems: string[];
}

export class ProjectInitializationService {
  /**
   * Initialize a new project with templates
   */
  static initializeProject(
    options: ProjectInitializationOptions,
    availableTemplates: {
      calculation: CalculationTemplate[];
      systems: SystemTemplate[];
      libraries: ComponentLibrary[];
    }
  ): InitializedProject {
    const missingItems: string[] = [];

    // Project info
    const projectInfo = {
      name: options.projectName,
      location: options.location,
      estimator: options.estimator,
      createdAt: new Date(),
    };

    // Calculation settings
    let calculationSettings: CalculationSettings;
    if (options.calculationTemplateId) {
      const template = availableTemplates.calculation.find(
        t => t.id === options.calculationTemplateId
      );
      if (template) {
        calculationSettings = this.applyCalculationTemplate(template, projectInfo);
      } else {
        missingItems.push('Calculation template not found');
        calculationSettings = this.createDefaultCalculationSettings(projectInfo);
      }
    } else if (options.useDefaults) {
      calculationSettings = this.createDefaultCalculationSettings(projectInfo);
    } else {
      missingItems.push('No calculation settings specified');
      calculationSettings = this.createDefaultCalculationSettings(projectInfo);
    }

    // System templates
    const systemTemplates: SystemTemplate[] = [];
    if (options.systemTemplates && options.systemTemplates.length > 0) {
      for (const templateId of options.systemTemplates) {
        const template = availableTemplates.systems.find(t => t.id === templateId);
        if (template) {
          systemTemplates.push(template);
        } else {
          missingItems.push(`System template ${templateId} not found`);
        }
      }
    } else if (options.useDefaults) {
      // Add default system templates
      systemTemplates.push(...this.createDefaultSystemTemplates());
    }

    // Component library
    let componentLibrary: ComponentLibrary | undefined;
    if (options.componentLibraryId) {
      componentLibrary = availableTemplates.libraries.find(
        l => l.id === options.componentLibraryId
      );
      if (!componentLibrary) {
        missingItems.push('Component library not found');
      }
    }

    const status = missingItems.length === 0 ? 'ready' : 'incomplete';

    return {
      projectInfo,
      calculationSettings,
      systemTemplates,
      componentLibrary,
      status,
      missingItems,
    };
  }

  /**
   * Apply calculation template to project
   */
  private static applyCalculationTemplate(
    template: CalculationTemplate,
    projectInfo: { name: string; location?: string; estimator?: string }
  ): CalculationSettings {
    return {
      laborRates: template.laborRates,
      markupSettings: template.markupSettings,
      wasteFactors: template.wasteFactors,
      engineeringLimits: template.engineeringLimits,
      projectName: projectInfo.name,
      location: projectInfo.location,
      estimator: projectInfo.estimator,
      templateId: template.id,
      lastModified: new Date(),
    };
  }

  /**
   * Create default calculation settings
   */
  private static createDefaultCalculationSettings(
    projectInfo: { name: string; location?: string; estimator?: string }
  ): CalculationSettings {
    return {
      laborRates: {
        baseRate: 45.0,
        regionalMultiplier: 1.0,
        currency: 'USD',
      },
      markupSettings: {
        materialMarkup: 0.15,
        laborMarkup: 0.10,
        overhead: 0.10,
        includeTaxInEstimate: true,
      },
      wasteFactors: {
        default: 0.10,
      },
      engineeringLimits: {
        maxVelocity: {
          supply: 2500,
          return: 2000,
          exhaust: 2000,
        },
        minVelocity: {
          supply: 600,
          return: 500,
          exhaust: 500,
        },
        maxPressureDrop: {
          supply: 0.10,
          return: 0.08,
          exhaust: 0.08,
        },
        frictionFactors: {
          galvanized: 0.0005,
          stainless: 0.00015,
          flexible: 0.003,
          fiberglass: 0.0003,
        },
        standardConditions: {
          temperature: 70,
          pressure: 29.92,
          altitude: 0,
        },
      },
      projectName: projectInfo.name,
      location: projectInfo.location,
      estimator: projectInfo.estimator,
      lastModified: new Date(),
    };
  }

  /**
   * Create default system templates (supply, return, exhaust)
   */
  private static createDefaultSystemTemplates(): SystemTemplate[] {
    return [
      {
        id: 'default-supply',
        name: 'Supply Air',
        type: 'supply',
        visualStyle: {
          color: '#2196F3',
          lineWidth: 2,
        },
        properties: {
          pressureClass: 'low',
          defaultInsulated: true,
          defaultVelocity: 1500,
        },
        isDefault: true,
      },
      {
        id: 'default-return',
        name: 'Return Air',
        type: 'return',
        visualStyle: {
          color: '#FF9800',
          lineWidth: 2,
        },
        properties: {
          pressureClass: 'low',
          defaultInsulated: false,
          defaultVelocity: 1200,
        },
        isDefault: true,
      },
      {
        id: 'default-exhaust',
        name: 'Exhaust Air',
        type: 'exhaust',
        visualStyle: {
          color: '#F44336',
          lineWidth: 2,
        },
        properties: {
          pressureClass: 'low',
          defaultInsulated: false,
          defaultVelocity: 1500,
        },
        isDefault: true,
      },
    ];
  }

  /**
   * Quick setup based on project type
   */
  static quickSetup(
    projectType: 'commercial' | 'residential' | 'industrial',
    projectName: string
  ): InitializedProject {
    const options: ProjectInitializationOptions = {
      projectName,
      projectType,
      useDefaults: true,
    };

    // Adjust defaults based on project type
    const templates = this.getTemplatesForProjectType(projectType);

    return this.initializeProject(options, templates);
  }

  /**
   * Get appropriate templates for project type
   */
  private static getTemplatesForProjectType(
    projectType: 'commercial' | 'residential' | 'industrial'
  ): {
    calculation: CalculationTemplate[];
    systems: SystemTemplate[];
    libraries: ComponentLibrary[];
  } {
    // In production, this would fetch from database/store
    // For now, return empty arrays - the defaults will be used
    return {
      calculation: [],
      systems: [],
      libraries: [],
    };
  }

  /**
   * Validate project setup
   */
  static validateProjectSetup(project: InitializedProject): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!project.projectInfo.name) {
      errors.push('Project name is required');
    }

    if (!project.calculationSettings) {
      errors.push('Calculation settings are required');
    }

    // Check for warnings
    if (!project.projectInfo.location) {
      warnings.push('Project location not specified');
    }

    if (!project.projectInfo.estimator) {
      warnings.push('Estimator not specified');
    }

    if (project.systemTemplates.length === 0) {
      warnings.push('No system templates configured');
    }

    if (!project.componentLibrary) {
      warnings.push('No component library selected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Export singleton instance
 */
export const projectInitializationService = ProjectInitializationService;
