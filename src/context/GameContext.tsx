'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameState, GameTemplate } from '../types/game';
import * as stateManager from '../lib/game/state-manager';
import * as templateLoader from '../lib/game/template-loader';
import { rollTripleDice, calculateDiceSum, calculateTotal, checkTripleMatch, getSpecialEventDescription, getSpecialEventEffects } from '../lib/game/dice';
import { buildGamePrompt } from '../lib/game/prompt-builder';
import openaiClient from '../lib/openai/client';
import { useAuth } from './AuthContext';

interface GameContextType {
  // State
  activeGame: boolean;
  loading: boolean;
  error: string | null;
  gameState: GameState | null;
  template: GameTemplate | null;
  sessionId: string | null;
  aiResponse: string | null;
  diceResult: {
    values: number[];
    isMatch: boolean;
    matchedValue?: number;
    sum: number;
    modifier: number;
    total: number;
    attributeKey?: string;
    attributeValue?: number;
    specialEvent?: {
      name: string;
      description: string;
      effects: Record<string, number>;
    };
    success?: boolean;
  } | null;

  // Template operations
  loadTemplates: () => Promise<GameTemplate[]>;
  loadTemplate: (templateId: string) => Promise<GameTemplate>;

  // Game operations
  createGame: (templateId: string, playerName: string, customizations: Record<string, string>) => Promise<void>;
  loadGame: (sessionId: string) => Promise<void>;
  saveGame: () => Promise<void>;
  endGame: () => Promise<void>;

  // Gameplay
  performAction: (action: string, diceRollValues?: number[], selectedSkillId?: string) => Promise<void>;
  rollDiceForSkill: (skill: string) => Promise<number[]>;
  clearDiceResult: () => void;
}

const initialContext: GameContextType = {
  activeGame: false,
  loading: false,
  error: null,
  gameState: null,
  template: null,
  sessionId: null,
  aiResponse: null,
  diceResult: null,

  loadTemplates: async () => [],
  loadTemplate: async () => ({} as GameTemplate),
  createGame: async () => {},
  loadGame: async () => {},
  saveGame: async () => {},
  endGame: async () => {},
  performAction: async () => {},
  rollDiceForSkill: async () => [],
  clearDiceResult: () => {},
};

const GameContext = createContext<GameContextType>(initialContext);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeGame, setActiveGame] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [template, setTemplate] = useState<GameTemplate | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [diceResult, setDiceResult] = useState<GameContextType['diceResult']>(null);

  const { user } = useAuth();
  const router = useRouter();

  const loadTemplates = async (): Promise<GameTemplate[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const templateMetadata = await templateLoader.loadTemplateMetadata();
      const templates: GameTemplate[] = [];
      
      for (const metadata of templateMetadata) {
        const template = await templateLoader.loadTemplate(metadata.id);
        templates.push(template);
      }
      
      return templates;
    } catch (error) {
      setError((error as Error).message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (templateId: string): Promise<GameTemplate> => {
    try {
      // Check if we already have this template loaded
      if (template && template.metadata.id === templateId) {
        console.log(`Template ${templateId} already loaded in context, reusing existing template`);
        return template;
      }
      
      setLoading(true);
      setError(null);
      
      console.log(`Loading template with ID: ${templateId} from server`);
      const loadedTemplate = await templateLoader.loadTemplate(templateId);
      setTemplate(loadedTemplate);
      
      return loadedTemplate;
    } catch (error) {
      console.error(`Error loading template ${templateId}:`, error);
      setError((error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createGame = async (
    templateId: string,
    playerName: string,
    customizations: Record<string, string>
  ): Promise<void> => {
    try {
      console.log("[GameContext] Starting createGame with authentication check");
      console.log("[GameContext] Current user state:", user ? 
        { id: user.id, username: user.username, authProvider: user.authProvider } : "NO USER");
      
      if (!user) {
        console.error("[GameContext] Authentication failure: No user object found");
        
        // Debug authentication state from localStorage
        if (typeof window !== 'undefined') {
          const authStateStr = localStorage.getItem('authState');
          if (authStateStr) {
            try {
              const authState = JSON.parse(authStateStr);
              console.error("[GameContext] LocalStorage has authState with isAuthenticated:", 
                authState.isAuthenticated, 
                "but user object is missing in context");
            } catch (e) {
              console.error("[GameContext] Failed to parse auth state from localStorage");
            }
          } else {
            console.error("[GameContext] No authState found in localStorage");
          }
        }
        
        throw new Error('User must be logged in to create a game');
      }
      
      setLoading(true);
      setError(null);
      
      console.log("[GameContext] Authentication verified. Creating game for user:", user.id);
      
      // Input validation
      if (!templateId) {
        throw new Error('Template ID is required');
      }
      
      if (!playerName) {
        throw new Error('Player name is required');
      }
      
      if (!customizations || Object.keys(customizations).length === 0) {
        throw new Error('Customizations are required');
      }
      
      // Load the template
      const loadedTemplate = await templateLoader.loadTemplate(templateId);
      
      if (!loadedTemplate) {
        throw new Error(`Failed to load template with ID: ${templateId}`);
      }
      
      console.log("[GameContext] Template loaded successfully:", {
        templateId,
        name: loadedTemplate.metadata.name,
        scenario: loadedTemplate.scenario?.substring(0, 50) + '...',
        startingPoint: loadedTemplate.startingPoint?.substring(0, 50) + '...'
      });
      
      setTemplate(loadedTemplate);
      
      // Calculate initial attributes based on customizations
      const initialAttributes: Record<string, number> = {};
      
      // Set base attributes to 5
      Object.keys(loadedTemplate.attributes).forEach(attr => {
        initialAttributes[attr] = 5;
      });
      
      // Apply customization impacts
      Object.entries(customizations).forEach(([key, selectedOption]) => {
        const customization = loadedTemplate.playerCustomizations[key];
        if (customization && customization.impact) {
          // Get the specific impact for the selected option
          const optionImpact = customization.impact[selectedOption];
          
          if (optionImpact) {
            // Apply impacts to attributes
            Object.entries(optionImpact).forEach(([attr, value]) => {
              if (typeof value === 'number') {
                initialAttributes[attr] = (initialAttributes[attr] || 0) + value;
              }
            });
          }
        }
      });
      
      console.log("[GameContext] Creating game with parameters:", {
        userId: user.id,
        templateId,
        playerName,
        scenario: loadedTemplate.scenario?.substring(0, 50) + '...',
        startingPoint: loadedTemplate.startingPoint?.substring(0, 50) + '...',
        customizationsCount: Object.keys(customizations).length,
        initialAttributes
      });
      
      // Validate that required parameters for createGameState are not undefined
      if (!loadedTemplate.scenario) {
        throw new Error('Template scenario is undefined');
      }
      
      if (!loadedTemplate.startingPoint) {
        throw new Error('Template starting point is undefined');
      }
      
      // Create the game state
      const result = await stateManager.createGameState(
        user.id,
        templateId,
        playerName,
        loadedTemplate.scenario,
        loadedTemplate.startingPoint,
        customizations,
        initialAttributes,
        loadedTemplate
      );
      
      // Store the session ID in localStorage to persist across navigation
      if (typeof window !== 'undefined') {
        localStorage.setItem('gameSessionId', result.newSessionId);
        localStorage.setItem('gameActive', 'true');
      }
      
      setGameState(result.newState);
      setSessionId(result.newSessionId);
      setActiveGame(true);
      
      // Generate the initial AI response
      await generateAIResponse(loadedTemplate, result.newState, 'Begin the game');
      
      // Ensure we navigate to the play page after everything is set up
      console.log("Game created successfully, navigating to play page");
      
      // Navigate to the game page using window.location for a fresh load
      // This helps ensure all context is properly initialized
      if (typeof window !== 'undefined') {
        window.location.href = '/game/play';
      } else {
        // Fallback to router if window is not available
        router.push('/game/play');
      }
    } catch (error) {
      console.error('Error in createGame:', error);
      setError((error as Error).message);
      
      // Clear any game creation flags on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gameStarting');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadGame = async (gameSessionId: string): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!user) {
        console.error("loadGame: Authentication failure - No user object found");
        throw new Error('User must be logged in to load a game');
      }
      
      console.log(`Loading game session with ID: ${gameSessionId}`);
      setLoading(true);
      setError(null);
      
      // Check if this is a local storage game session
      const isLocalStorageSession = typeof window !== 'undefined' && 
        localStorage.getItem(`game_session_${gameSessionId}`) !== null;
      
      // Load game state
      const loadedState = await stateManager.loadGameState(gameSessionId);
      
      if (!loadedState) {
        throw new Error('Failed to load game: Game state not found');
      }
      
      console.log(`Game state loaded successfully for template: ${loadedState.templateId}`);
      console.log(`Game user ID: ${loadedState.userId}, Current user ID: ${user.id}`);
      
      // Only validate user ID for database-stored games, not localStorage games
      if (!isLocalStorageSession && loadedState.userId !== user.id) {
        console.error(`User ID mismatch. Game belongs to ${loadedState.userId} but current user is ${user.id}`);
        throw new Error('This game session belongs to another user');
      }
      
      // Load template
      const loadedTemplate = await templateLoader.loadTemplate(loadedState.templateId);
      console.log(`Template loaded successfully: ${loadedTemplate.metadata.name}`);
      
      // Update state
      setGameState(loadedState);
      setTemplate(loadedTemplate);
      setSessionId(gameSessionId);
      setActiveGame(true);
      
      // Store the session ID in localStorage to persist across navigation
      if (typeof window !== 'undefined') {
        localStorage.setItem('gameSessionId', gameSessionId);
        localStorage.setItem('gameActive', 'true');
      }
      
      console.log(`Game loaded successfully`);
    } catch (error) {
      console.error('Error in loadGame:', error);
      setError((error as Error).message);
      
      // Reset game state if loading fails
      setGameState(null);
      setTemplate(null);
      setSessionId(null);
      setActiveGame(false);
      
      // Clear localStorage if there was an error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gameSessionId');
        localStorage.removeItem('gameActive');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveGame = async (): Promise<void> => {
    try {
      if (!sessionId || !gameState) {
        throw new Error('No active game to save');
      }
      
      setLoading(true);
      setError(null);
      
      await stateManager.saveGameState(sessionId, gameState);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const endGame = async (): Promise<void> => {
    setGameState(null);
    setTemplate(null);
    setSessionId(null);
    setActiveGame(false);
    setAiResponse(null);
    setDiceResult(null);
    
    router.push('/game');
  };

  const generateAIResponse = async (
    template: GameTemplate,
    state: GameState,
    playerAction: string,
    diceRoll?: { 
      values: number[]; 
      isSpecialEvent?: boolean;
      specialEventName?: string;
      specialEventDescription?: string;
      sum?: number;
      modifier?: number;
      total?: number;
    }
  ): Promise<{ aiText: string; calculatedState: GameState }> => {
    try {
      // Build the prompt for the AI
      const prompt = buildGamePrompt(template, state, playerAction, diceRoll);

      // DEBUGGING: Log the prompt for debugging
      console.log('=== AI Prompt ===');
      console.log(prompt);
      console.log('================');
      
      // Call the OpenAI API through our client
      const response = await openaiClient.generateResponse({
        prompt,
        model: 'gpt-4-turbo',
        max_tokens: 1500
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const aiText = response.text;
      // Only set the AI response text here, not the full game state yet
      setAiResponse(aiText); 
      
      const statsMatch = aiText.match(/\[STATS\]([\s\S]*?)\[\/STATS\]/);
      let updatedState: GameState = { ...state }; // Start with the current state

      // Apply special event effects first if applicable
      if (diceRoll?.isSpecialEvent && diceRoll.specialEventName && template.specialDiceEvents) {
        console.log("Applying special event effects:", diceRoll.specialEventName);
        const specialEventChanges = {
          attributes: template.specialDiceEvents[diceRoll.specialEventName].effect || {},
          relationships: {} 
        };
        updatedState = stateManager.applyStatsChanges(updatedState, specialEventChanges);
      }

      // Then apply stats changes from AI response to the potentially modified state
      if (statsMatch) {
        const statsText = statsMatch[1];
        const changes = stateManager.parseStatsChanges(statsText);
        updatedState = stateManager.applyStatsChanges(updatedState, changes);
      }
      
      // Update scene and turn based on the derived state
      updatedState = {
        ...updatedState,
        currentScene: aiText, // Use the raw AI text for the scene
        turn: state.turn + 1
      };
      
      // Create final state object ensuring deep copies for reactivity
      const finalCalculatedState: GameState = {
        ...updatedState,
        attributes: { ...updatedState.attributes },
        relationships: { ...updatedState.relationships },
        // Ensure history is copied if it exists, otherwise initialize
        history: state.history ? [...state.history] : [] 
      };
      
      // Return both the text and the calculated state
      return { aiText, calculatedState: finalCalculatedState }; 
    } catch (error) {
      const errorMessage = `Error generating AI response: ${(error as Error).message}`;
      setError(errorMessage);
      // Return error message and original state on failure
      return { aiText: errorMessage, calculatedState: state }; 
    }
  };

  const rollDiceForSkill = async (skillName: string): Promise<number[]> => {
    if (!template || !gameState) {
      throw new Error('No active game');
    }
    
    const skill = template.baseSkills[skillName];
    if (!skill) {
      throw new Error(`Skill ${skillName} not found`);
    }
    
    const attributeName = skill.attributeModifier || '';
    if (!attributeName) {
      throw new Error(`No attribute modifier defined for skill ${skillName}`);
    }
    
    const attributeValue = gameState.attributes[attributeName];
    
    if (attributeValue === undefined) {
      throw new Error(`Attribute ${attributeName} not found`);
    }
    
    // Calculate modifier (simplified: attribute value / 5, rounded down)
    const modifier = Math.floor(attributeValue / 5);
    
    // Roll three dice
    const values = rollTripleDice();
    const isMatch = checkTripleMatch(values);
    const matchedValue = isMatch ? values[0] : undefined;
    const sum = calculateDiceSum(values);
    const total = calculateTotal(sum, modifier);
    
    // Create the dice result object
    const result: GameContextType['diceResult'] = {
      values,
      isMatch,
      matchedValue,
      sum,
      modifier,
      total,
      attributeKey: attributeName,
      attributeValue: attributeValue,
    };
    
    // If we have a match, check for special events
    if (isMatch && matchedValue && template.specialDiceEvents) {
      const specialEventKey = matchedValue.toString();
      const specialEvent = template.specialDiceEvents[specialEventKey];
      
      if (specialEvent) {
        result.specialEvent = {
          name: specialEvent.name,
          description: specialEvent.description,
          effects: specialEvent.effect || {}
        };
      }
    }
    
    setDiceResult(result);
    
    return values;
  };

  const performAction = async (
    action: string,
    diceRollValues?: number[],
    selectedSkillId?: string
  ): Promise<void> => {
    if (!gameState || !template || !sessionId) {
      throw new Error('No active game');
    }

    setLoading(true);
    setError(null);

    try {
      const isSpecialEvent = diceRollValues && 
                            diceRollValues.length === 3 && 
                            diceRollValues[0] === diceRollValues[1] && 
                            diceRollValues[1] === diceRollValues[2];
      
      let specialEvent = null;
      if (isSpecialEvent && template.specialDiceEvents) {
        const matchedValue = diceRollValues![0].toString();
        specialEvent = template.specialDiceEvents[matchedValue];
      }

      // Calculate attribute modifier if a skill is selected
      let attributeModifier = 0;
      let attributeKey = '';
      let attributeValue = 0;
      
      if (selectedSkillId && diceRollValues) {
        const selectedSkill = template.baseSkills[selectedSkillId];
        if (selectedSkill) {
          attributeKey = selectedSkill.attributeKey || selectedSkill.attributeModifier || '';
          if (attributeKey && gameState.attributes[attributeKey] !== undefined) {
            attributeValue = gameState.attributes[attributeKey];
            // Calculate modifier (attribute value / 5, rounded down)
            attributeModifier = Math.floor(attributeValue / 5);
            console.log(`Applied modifier +${attributeModifier} from ${attributeKey} (${attributeValue})`);
          }
        }
      }

      // Store dice result in state if we have dice values
      if (diceRollValues && diceRollValues.length > 0) {
        const diceSum = diceRollValues.reduce((sum, val) => sum + val, 0);
        const total = isSpecialEvent ? diceSum : diceSum + attributeModifier;
        
        setDiceResult({
          values: diceRollValues,
          isMatch: isSpecialEvent || false,
          matchedValue: isSpecialEvent ? diceRollValues[0] : undefined,
          sum: diceSum,
          modifier: attributeModifier,
          total: total,
          attributeKey: attributeKey,
          attributeValue: attributeValue,
          specialEvent: isSpecialEvent && specialEvent ? {
            name: specialEvent.name,
            description: specialEvent.description,
            effects: specialEvent.effect || {}
          } : undefined,
          success: undefined
        });
      }

      // Format dice roll information for AI prompt
      const diceRollInfo = diceRollValues ? {
        values: diceRollValues,
        isSpecialEvent: isSpecialEvent,
        specialEventName: specialEvent?.name,
        specialEventDescription: specialEvent?.description,
        sum: isSpecialEvent ? undefined : diceRollValues.reduce((sum, val) => sum + val, 0),
        modifier: attributeModifier,
        attributeKey: attributeKey,
        attributeValue: attributeValue,
        total: isSpecialEvent ? undefined : diceRollValues.reduce((sum, val) => sum + val, 0) + attributeModifier
      } : undefined;

      // Generate AI response with current state
      const { aiText, calculatedState } = await generateAIResponse(
        template,
        gameState,
        action,
        diceRollInfo
      );

      // Add history entry, passing the template and using the state returned by generateAIResponse
      // This now also returns the transition status, which we aren't using here directly
      const { updatedState: finalState } = await stateManager.addHistoryEntry(
        sessionId,
        calculatedState,
        template, // Pass the template object
        action,
        aiText,
        diceRollValues ? diceRollValues[0] : undefined
      );

      // Set the final state after history is added
      setGameState(finalState);

      // Save the final state
      await stateManager.saveGameState(sessionId, finalState);

    } catch (error) {
      console.error("Error in performAction:", error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const clearDiceResult = (): void => {
    setDiceResult(null);
  };

  const value: GameContextType = {
    activeGame,
    loading,
    error,
    gameState,
    template,
    sessionId,
    aiResponse,
    diceResult,

    loadTemplates,
    loadTemplate,
    createGame,
    loadGame,
    saveGame,
    endGame,
    performAction,
    rollDiceForSkill,
    clearDiceResult,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export default GameContext; 