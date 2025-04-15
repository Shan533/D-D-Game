import { Template } from './template';

export interface SkillDefinition {
  name: string;
  description: string;
  attributeModifier?: string;
  attributeKey?: string;
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

export interface SpecialSkill {
  name: string;
  description: string;
  duration: number;
  effect: any;
  unlock: string;
}

export interface ChainEffect {
  name: string;
  description: string;
  target: number;
  effect: any;
}

export interface Achievement {
  name: string;
  description: string;
  unlockCondition: string;
  reward?: any;
}

export interface RelationshipSystem {
  levels: Record<string, {
    name: string;
    threshold: number;
    effects: any;
  }>;
}

export interface GameTemplate {
  scenario: string;
  attributes: Record<string, string>;
  baseSkills: Record<string, SkillDefinition>;
  playerCustomizations: Record<string, Customization>;
  startingPoint: string;
  npcs?: Record<string, NPC[]>;
  events?: Record<string, GameEvent>;
  specialSkills?: Record<string, SpecialSkill>;
  chainEffects?: Record<string, ChainEffect>;
  achievements?: Record<string, Achievement>;
  relationshipSystem?: RelationshipSystem;
  specialDiceEvents?: Record<string, {
    name: string;
    description: string;
    effect?: Record<string, number>;
  }>;
}

export interface GameHistoryEntry {
  turn: number;
  action: string;
  result: string;
  diceRoll?: {
    roll: number;
    modifier: number;
    total: number;
    success?: boolean;
  };
  stateChanges?: Record<string, any>;
  timestamp: string;
  isKeyEvent?: boolean;
  eventType?: 'achievement' | 'relationship' | 'discovery' | 'decision' | 'consequence';
  eventDescription?: string;
  relatedNPCs?: string[];
  impact?: {
    attributes?: Record<string, number>;
    relationships?: Record<string, number>;
    unlocks?: string[];
  };
}

export interface GameState {
  userId: string;
  templateId: string;
  scenario: string;
  currentScene: string;
  turn: number;
  playerName: string;
  playerCustomizations: Record<string, string>;
  attributes: Record<string, number>;
  relationships?: Record<string, number>;
  activeSpecialSkills?: Record<string, {
    remainingTurns: number;
    effect: any;
  }>;
  chainTrackers?: Record<string, {
    progress: number;
    target: number;
  }>;
  unlockedAchievements?: string[];
  history?: GameHistoryEntry[];
  _loadedFromLocalStorage?: boolean;
} 