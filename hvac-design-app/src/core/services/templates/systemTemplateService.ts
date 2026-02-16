import { CalculationTemplate, CalculationSettings } from '../../schema/calculation-settings.schema';

export class SystemTemplateService {
  private templates: Map<string, CalculationTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const { 
      COMMERCIAL_STANDARD_TEMPLATE, 
      RESIDENTIAL_BUDGET_TEMPLATE, 
      INDUSTRIAL_HEAVY_TEMPLATE 
    } = require('../../schema/calculation-settings.schema');

    this.templates.set(COMMERCIAL_STANDARD_TEMPLATE.id, COMMERCIAL_STANDARD_TEMPLATE);
    this.templates.set(RESIDENTIAL_BUDGET_TEMPLATE.id, RESIDENTIAL_BUDGET_TEMPLATE);
    this.templates.set(INDUSTRIAL_HEAVY_TEMPLATE.id, INDUSTRIAL_HEAVY_TEMPLATE);
  }

  getTemplate(id: string): CalculationTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): CalculationTemplate[] {
    return Array.from(this.templates.values());
  }

  getDefaultTemplates(): CalculationTemplate[] {
    return this.getAllTemplates().filter((t) => t.isDefault);
  }

  createTemplate(
    name: string, 
    settings: Partial<CalculationSettings>,
    baseTemplateId?: string
  ): CalculationTemplate {
    const baseTemplate = baseTemplateId ? this.getTemplate(baseTemplateId) : undefined;
    const id = `template-${Date.now()}`;

    const newTemplate: CalculationTemplate = {
      id,
      name,
      description: settings.projectName || `Template created from ${baseTemplate?.name || 'scratch'}`,
      templateVersion: '1.0.0',
      lockedDefaults: false,
      laborRates: settings.laborRates || baseTemplate?.laborRates || {
        baseRate: 65,
        regionalMultiplier: 1.0,
        currency: 'USD',
      },
      markupSettings: settings.markupSettings || baseTemplate?.markupSettings || {
        materialMarkup: 0.15,
        laborMarkup: 0.10,
        overhead: 0.08,
        includeTaxInEstimate: true,
      },
      wasteFactors: settings.wasteFactors || baseTemplate?.wasteFactors || {
        default: 0.10,
      },
      engineeringLimits: settings.engineeringLimits || baseTemplate?.engineeringLimits || {
        maxVelocity: { supply: 2500, return: 2000, exhaust: 2000 },
        minVelocity: { supply: 600, return: 500, exhaust: 500 },
        maxPressureDrop: { supply: 0.10, return: 0.08, exhaust: 0.08 },
        frictionFactors: { galvanized: 0.0005, stainless: 0.00015, flexible: 0.003, fiberglass: 0.0003 },
        standardConditions: { temperature: 70, pressure: 29.92, altitude: 0 },
      },
      isDefault: false,
      isShared: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<CalculationTemplate>): CalculationTemplate | null {
    const template = this.templates.get(id);
    if (!template) return null;

    const updated = { ...template, ...updates, updatedAt: new Date() };
    this.templates.set(id, updated);
    return updated;
  }

  deleteTemplate(id: string): boolean {
    const template = this.templates.get(id);
    if (template?.isDefault) {
      return false;
    }
    return this.templates.delete(id);
  }

  applyTemplateToSettings(templateId: string, settings: CalculationSettings): CalculationSettings {
    const template = this.getTemplate(templateId);
    if (!template) return settings;

    return {
      ...settings,
      laborRates: template.laborRates,
      markupSettings: template.markupSettings,
      wasteFactors: template.wasteFactors,
      engineeringLimits: template.engineeringLimits,
      templateId: template.id,
      lastModified: new Date(),
    };
  }

  exportTemplate(id: string): string | null {
    const template = this.getTemplate(id);
    if (!template) return null;
    return JSON.stringify(template, null, 2);
  }

  importTemplate(json: string): CalculationTemplate | null {
    try {
      const template = JSON.parse(json) as CalculationTemplate;
      template.id = `imported-${Date.now()}`;
      template.isDefault = false;
      template.createdAt = new Date();
      template.updatedAt = new Date();
      this.templates.set(template.id, template);
      return template;
    } catch {
      return null;
    }
  }
}

export const systemTemplateService = new SystemTemplateService();
