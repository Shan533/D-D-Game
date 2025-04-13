import { GameTemplate } from '../../types/game';
import { Template, TemplateMetadata } from '../../types/template';

/**
 * Loads the metadata for all available game templates
 * @returns An array of template metadata
 */
export const loadTemplateMetadata = async (): Promise<TemplateMetadata[]> => {
  console.log("Loading template metadata...");
  
  try {
    // In a production app, we'd fetch this from an API or database
    // For now, we'll load from our JSON files in src/templates
    const templateIds = ['helicopter-parent', 'white-house', 'pirate-adventure'];
    const templates: TemplateMetadata[] = [];
    
    for (const id of templateIds) {
      try {
        const template = await loadTemplate(id);
        if (template && template.metadata) {
          templates.push(template.metadata);
        }
      } catch (error) {
        console.error(`Error loading template metadata for ${id}:`, error);
      }
    }
    
    console.log(`Loaded ${templates.length} template metadata records.`);
    return templates;
  } catch (error) {
    console.error('Error loading template metadata:', error);
    return [];
  }
};

/**
 * Loads a specific game template by ID
 * @param templateId The ID of the template to load
 * @returns The full game template
 */
export const loadTemplate = async (templateId: string): Promise<Template> => {
  console.log(`Loading template with ID: ${templateId}`);
  
  try {
    // In a production app, we'd fetch this from an API or database
    // For now, we'll load from our JSON files in src/templates
    const templateModule = await import(`../../templates/${templateId}.json`);
    const templateData = templateModule.default || templateModule;
    
    // Validate required fields
    if (!templateData) {
      throw new Error(`Template data is empty for ${templateId}`);
    }
    
    if (!templateData.metadata || !templateData.metadata.id) {
      throw new Error(`Template metadata missing for ${templateId}`);
    }
    
    if (!templateData.scenario) {
      throw new Error(`Scenario missing for template ${templateId}`);
    }
    
    if (!templateData.startingPoint) {
      throw new Error(`Starting point missing for template ${templateId}`);
    }
    
    if (!templateData.attributes || Object.keys(templateData.attributes).length === 0) {
      throw new Error(`Attributes missing for template ${templateId}`);
    }
    
    if (!templateData.playerCustomizations) {
      throw new Error(`Player customizations missing for template ${templateId}`);
    }
    
    // Convert any attributeKey references in the template to match our expected structure
    const processedSkills: Record<string, any> = {};
    
    // Process skills to ensure attributeModifier compatibility
    if (templateData.baseSkills) {
      Object.entries(templateData.baseSkills).forEach(([key, skill]) => {
        processedSkills[key] = {
          ...JSON.parse(JSON.stringify(skill)), // Create a clean copy
          attributeModifier: (skill as any).attributeKey || (skill as any).attributeModifier
        };
      });
    } else {
      console.warn(`No base skills defined for template ${templateId}`);
    }
    
    // Process customizations to ensure proper impact structure
    const processedCustomizations: any = {};
    if (templateData.playerCustomizations) {
      Object.entries(templateData.playerCustomizations).forEach(([key, customization]) => {
        processedCustomizations[key] = { 
          ...(customization as object) 
        };
        
        // Ensure impact is properly structured or set to empty object
        if (!(customization as any).impact || typeof (customization as any).impact !== 'object') {
          console.warn(`No impact defined for customization ${key} in template ${templateId}`);
          (processedCustomizations[key] as any).impact = {};
        }
      });
    }
    
    const processedTemplate = {
      metadata: templateData.metadata,
      scenario: templateData.scenario,
      startingPoint: templateData.startingPoint,
      attributes: templateData.attributes,
      playerCustomizations: processedCustomizations,
      npcs: templateData.npcs || {},
      events: templateData.events || {},
      baseSkills: processedSkills
    };
    
    console.log(`Successfully loaded template: ${templateId}`);
    return processedTemplate as Template;
  } catch (error) {
    console.error(`Error loading template ${templateId}:`, error);
    throw new Error(`Failed to load game template "${templateId}": ${(error as Error).message}`);
  }
}; 