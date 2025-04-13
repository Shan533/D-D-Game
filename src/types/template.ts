import { GameTemplate } from './game';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  difficulty?: string;
  estimatedDuration?: string;
  tags?: string[];
}

export interface SkillDefinition {
  name: string;
  description: string;
  attributeKey?: string;
  attributeModifier?: string;
}

export interface Customization {
  name: string;
  description: string;
  options: string[];
  impact?: Record<string, Record<string, number>>;
}

export interface NPC {
  name: string;
  description: string;
  initialRelationship?: number;
}

export interface GameEvent {
  trigger: string;
  description: string;
  choices: string[];
  outcomes: Record<string, any>;
}

export interface Template {
  metadata: TemplateMetadata;
  scenario: string;
  startingPoint: string;
  attributes: Record<string, string>;
  baseSkills: Record<string, SkillDefinition>;
  playerCustomizations: Record<string, Customization>;
  npcs?: Record<string, NPC[]>;
  events?: Record<string, GameEvent>;
} 