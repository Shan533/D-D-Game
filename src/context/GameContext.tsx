'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameState, GameTemplate } from '../types/game';
import { Template } from '../types/template';
import * as stateManager from '../lib/game/state-manager';
import * as templateLoader from '../lib/game/template-loader';
import { rollD20, calculateTotal } from '../lib/game/dice';
import { buildGamePrompt } from '../lib/game/prompt-builder';
import openaiClient from '../lib/openai/client';
import { useAuth } from './AuthContext';

interface GameContextType {
  // State
  activeGame: boolean;
  loading: boolean;
  error: string | null;
  gameState: GameState | null;
  template: Template | null;
  sessionId: string | null;
  aiResponse: string | null;
  diceResult: {
    roll: number;
    modifier: number;
    total: number;
    success?: boolean;
  } | null;

  // Template operations
  loadTemplates: () => Promise<Template[]>;
  loadTemplate: (templateId: string) => Promise<Template>;

  // Game operations
  createGame: (templateId: string, playerName: string, customizations: Record<string, string>) => Promise<void>;
  loadGame: (sessionId: string) => Promise<void>;
  saveGame: () => Promise<void>;
  endGame: () => Promise<void>;

  // Gameplay
  performAction: (action: string, useSkill?: string, rollDice?: boolean, diceValue?: number | null) => Promise<void>;
  rollDiceForSkill: (skill: string) => Promise<number>;
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
  loadTemplate: async () => ({} as Template),
  createGame: async () => {},
  loadGame: async () => {},
  saveGame: async () => {},
  endGame: async () => {},
  performAction: async () => {},
  rollDiceForSkill: async () => 0,
  clearDiceResult: () => {},
};

const GameContext = createContext<GameContextType>(initialContext);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeGame, setActiveGame] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [diceResult, setDiceResult] = useState<GameContextType['diceResult']>(null);

  const { user } = useAuth();
  const router = useRouter();

  const loadTemplates = async (): Promise<Template[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const templateMetadata = await templateLoader.loadTemplateMetadata();
      const templates: Template[] = [];
      
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

  const loadTemplate = async (templateId: string): Promise<Template> => {
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
    diceRoll?: { roll: number; attributeModifier?: number; total?: number }
  ): Promise<string> => {
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
      setAiResponse(aiText);
      
      // Update game state with the AI response
      if (gameState) {
        const updatedState = {
          ...gameState,
          currentScene: aiText,
          turn: gameState.turn + 1
        };
        
        setGameState(updatedState);
        
        // Save game state if we have a session ID
        if (sessionId) {
          await stateManager.saveGameState(sessionId, updatedState);
        }
      }
      
      return aiText;
    } catch (error) {
      const errorMessage = `Error generating AI response: ${(error as Error).message}`;
      setError(errorMessage);
      return errorMessage;
    }
  };

  const rollDiceForSkill = async (skillName: string): Promise<number> => {
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
    
    // Roll dice
    const roll = rollD20();
    const total = calculateTotal(roll, modifier);
    
    setDiceResult({
      roll,
      modifier,
      total,
    });
    
    return total;
  };

  const performAction = async (
    action: string,
    useSkill?: string,
    rollDice: boolean = false,
    diceValue?: number | null
  ): Promise<void> => {
    try {
      if (!gameState || !template || !sessionId) {
        throw new Error('No active game');
      }
      
      setLoading(true);
      setError(null);
      
      let diceRollResult: { roll: number; attributeModifier?: number; total?: number } | undefined = undefined;
      let diceRollValue: number | undefined = undefined;
      
      // Handle dice roll if required
      if (rollDice && useSkill) {
        if (diceValue) {
          // Use the provided dice value from the UI
          const skill = template.baseSkills[useSkill];
          const attributeName = skill?.attributeModifier || '';
          const attributeValue = gameState.attributes[attributeName];
          
          // Calculate modifier (simplified: attribute value / 5, rounded down)
          const modifier = Math.floor(attributeValue / 5);
          const total = calculateTotal(diceValue, modifier);
          
          setDiceResult({
            roll: diceValue,
            modifier,
            total,
            success: total >= 10 // Simple success threshold
          });
          
          diceRollResult = {
            roll: diceValue,
            attributeModifier: modifier,
            total,
          };
          diceRollValue = diceValue;
        } else {
          const total = await rollDiceForSkill(useSkill);
          
          if (diceResult) {
            diceRollResult = {
              roll: diceResult.roll,
              attributeModifier: diceResult.modifier,
              total,
            };
            diceRollValue = diceResult.roll;
          }
        }
      }
      
      // Generate AI response
      const aiResponseText = await generateAIResponse(
        template,
        gameState,
        action,
        diceRollResult
      );
      
      // Update game state
      const updatedState = await stateManager.addHistoryEntry(
        sessionId,
        gameState,
        action,
        aiResponseText,
        diceRollValue,
      );
      
      setGameState(updatedState);
    } catch (error) {
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