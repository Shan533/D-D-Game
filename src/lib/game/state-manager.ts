import { GameState, GameHistoryEntry, GameTemplate, NPC } from '../../types/game';
// Update the import with proper typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as supabaseModule from '../supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

// Add proper typing to the supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = (supabaseModule as any).default as SupabaseClient;

/**
 * Helper function to generate a random UUID
 * This is used as a fallback when Supabase is not available
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Check if Supabase is properly configured and available
 */
const isSupabaseAvailable = async (): Promise<boolean> => {
  try {
    // Check if Supabase client is defined
    if (!supabase) {
      console.warn('Supabase client is not defined');
      return false;
    }
    
    // Check for environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables are missing');
      return false;
    }
    
    // Test connection by making a simple query
    console.log('Testing Supabase connection...');
    try {
      const { error } = await supabase
        .from('game_sessions')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('Supabase connection test failed:', error);
        return false;
      }
      
      console.log('Supabase connection successful');
      return true;
    } catch (testError) {
      console.warn('Error testing Supabase connection:', testError);
      return false;
    }
  } catch (e) {
    console.warn('Supabase availability check failed:', e);
    return false;
  }
};

/**
 * Save game state to localStorage (fallback when Supabase is not available)
 */
const saveToLocalStorage = (key: string, data: any) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error saving to localStorage:', e);
    return false;
  }
};

/**
 * Get game state from localStorage
 */
const getFromLocalStorage = (key: string) => {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
    return null;
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return null;
  }
};

// Create a new game state
export const createGameState = async (
  userId: string,
  templateId: string,
  playerName: string,
  scenario: string,
  startingPoint: string,
  playerCustomizations: Record<string, string>,
  initialAttributes: Record<string, number>,
  template: GameTemplate
): Promise<{ newState: GameState; newSessionId: string }> => {
  // Validate required parameters
  if (!userId) throw new Error('Error creating game state: userId is undefined');
  if (!templateId) throw new Error('Error creating game state: templateId is undefined');
  if (!playerName) throw new Error('Error creating game state: playerName is undefined');
  if (!scenario) throw new Error('Error creating game state: scenario is undefined');
  if (!startingPoint) throw new Error('Error creating game state: startingPoint is undefined');
  if (!playerCustomizations) throw new Error('Error creating game state: playerCustomizations is undefined');
  if (!initialAttributes) throw new Error('Error creating game state: initialAttributes is undefined');
  
  try {
    // Initialize relationships from template NPCs
    const initialRelationships: Record<string, number> = {};
    if (template.npcs) {
      Object.values(template.npcs).forEach((npcGroup: NPC[]) => {
        npcGroup.forEach((npc: NPC) => {
          initialRelationships[npc.name] = npc.initialRelationship || 0;
        });
      });
    }

    const newState: GameState = {
      userId,
      templateId,
      scenario,
      currentScene: startingPoint,
      turn: 0,
      playerName,
      playerCustomizations,
      attributes: initialAttributes,
      relationships: initialRelationships,
      history: []
    };

    console.log("Creating game state with:", {
      userId,
      templateId,
      playerName,
      scenario: scenario.substring(0, 50) + '...',
      startingPoint: startingPoint.substring(0, 50) + '...',
      customizationsCount: Object.keys(playerCustomizations).length,
      attributesCount: Object.keys(initialAttributes).length,
      relationshipsCount: Object.keys(initialRelationships).length
    });

    // Check if Supabase is properly configured and available
    const supabaseAvailable = await isSupabaseAvailable();
    let supabaseSuccess = false;
    
    if (supabaseAvailable) {
      console.log("Supabase available, attempting to save game state...");
      try {
        // Save to database
        const { data, error } = await supabase
          .from('game_sessions')
          .insert({
            user_id: userId,
            template_id: templateId,
            game_state: newState as any
          })
          .select()
          .single();

        // Check for empty error object which seems to be happening
        if (error && Object.keys(error).length === 0) {
          console.warn("Received empty error object from Supabase, treating as an error");
          throw new Error("Supabase returned an empty error object");
        } else if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }

        if (!data) {
          throw new Error('Failed to create game session: No data returned from database');
        }
        
        if (!data.id) {
          throw new Error('Failed to create game session: No session ID returned');
        }

        console.log("Successfully saved game state to Supabase with ID:", data.id);
        
        // Indicate success with Supabase
        supabaseSuccess = true;
        
        // Return both the new state and the session ID
        return {
          newState,
          newSessionId: data.id
        };
      } catch (dbError) {
        console.error("Supabase error, falling back to localStorage:", dbError);
        // Fall through to localStorage fallback
      }
    } else {
      console.warn("Supabase not available, using localStorage fallback");
    }
    
    // Always fall back to localStorage if Supabase failed or is not available
    if (!supabaseSuccess) {
      // Generate a unique ID for localStorage
      const sessionId = generateUUID();
      const gameSessionsKey = `game_sessions_${userId}`;
      
      console.log("Using localStorage fallback with generated session ID:", sessionId);
      
      // Get existing sessions or create new array
      const existingSessions = getFromLocalStorage(gameSessionsKey) || [];
      
      // Add new session
      const newSession = {
        id: sessionId,
        user_id: userId,
        template_id: templateId,
        game_state: newState,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      existingSessions.push(newSession);
      
      // Save back to localStorage
      try {
        saveToLocalStorage(gameSessionsKey, existingSessions);
        saveToLocalStorage(`game_session_${sessionId}`, newSession);
        
        console.log("Saved game state to localStorage with ID:", sessionId);
        
        return {
          newState,
          newSessionId: sessionId
        };
      } catch (localStorageError) {
        console.error("Error saving to localStorage:", localStorageError);
        throw new Error(`Failed to save game: ${(localStorageError as Error).message}`);
      }
    }
    
    // Should never reach here, but to satisfy TypeScript
    throw new Error("Failed to create game state through any available method");
  } catch (err) {
    console.error("Error in createGameState:", err);
    throw err;
  }
};

// Load a game state from the database
export const loadGameState = async (sessionId: string): Promise<GameState> => {
  // Try localStorage first if sessionId contains a specific format indicating localStorage
  const localSession = getFromLocalStorage(`game_session_${sessionId}`);
  if (localSession) {
    console.log("Loaded game state from localStorage:", sessionId);
    
    // For local storage sessions, mark as loaded from localStorage for permission checks
    const gameState = localSession.game_state as GameState;
    gameState._loadedFromLocalStorage = true;
    
    return gameState;
  }
  
  // Check if Supabase is available
  const supabaseAvailable = await isSupabaseAvailable();
  
  // Fallback to Supabase if available
  if (supabaseAvailable) {
    try {
      console.log("Attempting to load game state from Supabase...");
      const { data, error } = await supabase
        .from('game_sessions')
        .select('game_state')
        .eq('id', sessionId)
        .single();

      if (error) {
        throw new Error(`Error loading game state: ${error.message}`);
      }

      if (!data) {
        throw new Error('Game session not found');
      }

      // For database sessions, do not mark as loaded from localStorage
      const gameState = data.game_state as GameState;
      gameState._loadedFromLocalStorage = false;
      
      console.log("Successfully loaded game state from Supabase");
      return gameState;
    } catch (dbError) {
      console.error("Supabase error loading game state:", dbError);
      throw dbError;
    }
  } else {
    throw new Error('Could not load game state: Supabase not available and session not found in localStorage');
  }
};

// Save a game state to the database
export const saveGameState = async (
  sessionId: string,
  state: GameState
): Promise<void> => {
  // Try localStorage first
  const localSession = getFromLocalStorage(`game_session_${sessionId}`);
  if (localSession) {
    console.log("Saving game state to localStorage");
    localSession.game_state = state;
    localSession.updated_at = new Date().toISOString();
    
    saveToLocalStorage(`game_session_${sessionId}`, localSession);
    
    // Also update in the sessions list
    const gameSessionsKey = `game_sessions_${state.userId}`;
    const existingSessions = getFromLocalStorage(gameSessionsKey) || [];
    
    const updatedSessions = existingSessions.map((session: any) => 
      session.id === sessionId ? localSession : session
    );
    
    saveToLocalStorage(gameSessionsKey, updatedSessions);
    console.log("Game state saved to localStorage successfully");
    return;
  }
  
  // Check if Supabase is available
  const supabaseAvailable = await isSupabaseAvailable();
  
  // Fallback to Supabase if available
  if (supabaseAvailable) {
    try {
      console.log("Attempting to save game state to Supabase...");
      const { error } = await supabase
        .from('game_sessions')
        .update({
          game_state: state as any,
          updated_at: new Date()
        })
        .eq('id', sessionId);
      
      if (error) {
        throw new Error(`Error saving game state: ${error.message}`);
      }
      
      console.log("Game state saved to Supabase successfully");
    } catch (dbError) {
      console.error("Error saving game state to database:", dbError);
      throw dbError;
    }
  } else {
    throw new Error('Could not save game state: Supabase not available and session not found in localStorage');
  }
};

// Add a history entry to the game state
export const addHistoryEntry = async (
  sessionId: string,
  state: GameState,
  action: string,
  result: string,
  diceRoll?: number,
  stateChanges?: Record<string, any>,
  isKeyEvent?: boolean,
  eventType?: 'achievement' | 'relationship' | 'discovery' | 'decision' | 'consequence',
  eventDescription?: string,
  relatedNPCs?: string[],
  impact?: {
    attributes?: Record<string, number>;
    relationships?: Record<string, number>;
    unlocks?: string[];
  }
): Promise<GameState> => {
  try {
    if (!sessionId) {
      throw new Error('Cannot add history entry: sessionId is required');
    }
    
    if (!state) {
      throw new Error('Cannot add history entry: gameState is required');
    }
    
    // Create a new entry
    const newEntry: GameHistoryEntry = {
      timestamp: new Date().toISOString(),
      turn: state.turn + 1,
      action,
      result,
      diceRoll: diceRoll ? {
        roll: diceRoll,
        modifier: 0,
        total: diceRoll
      } : undefined,
      stateChanges,
      isKeyEvent,
      eventType,
      eventDescription,
      relatedNPCs,
      impact
    };
    
    // Add the entry to the state
    const updatedState = {
      ...state,
      turn: state.turn + 1,
      history: [...(state.history || []), newEntry],
      ...(stateChanges || {})
    };
    
    // Save to localStorage if this was a localStorage session
    if (state._loadedFromLocalStorage) {
      console.log("Adding history entry to localStorage session");
      const localSession = getFromLocalStorage(`game_session_${sessionId}`);
      
      if (localSession) {
        localSession.game_state = updatedState;
        localSession.updated_at = new Date().toISOString();
        
        saveToLocalStorage(`game_session_${sessionId}`, localSession);
        
        // Update in sessions list too
        const gameSessionsKey = `game_sessions_${state.userId}`;
        const sessions = getFromLocalStorage(gameSessionsKey) || [];
        
        const updatedSessions = sessions.map((s: any) => 
          s.id === sessionId ? localSession : s
        );
        
        saveToLocalStorage(gameSessionsKey, updatedSessions);
        
        return updatedState;
      }
    }
    
    // Check if Supabase is available
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      try {
        console.log("Adding history entry to Supabase session");
        // Save history to database
        const { error: historyError } = await supabase
          .from('game_history')
          .insert({
            session_id: sessionId,
            turn_number: state.turn + 1,
            action,
            result,
            state_changes: stateChanges || null,
            is_key_event: isKeyEvent || false,
            event_type: eventType || null,
            event_description: eventDescription || null,
            related_npcs: relatedNPCs || null,
            impact: impact || null
          });
        
        if (historyError) {
          console.error("Error adding history entry:", historyError);
          // Continue anyway - this is not critical
        }
        
        // Update the game state
        const { error: updateError } = await supabase
          .from('game_sessions')
          .update({
            game_state: updatedState as any,
            updated_at: new Date()
          })
          .eq('id', sessionId);
        
        if (updateError) {
          console.error("Error updating game state:", updateError);
          // Continue anyway - we'll return the updated state even if save failed
        }
      } catch (dbError) {
        console.error("Database error when adding history entry:", dbError);
        // Continue anyway
      }
    } else {
      console.warn("Supabase not available - history entry only updated in memory");
    }
    
    return updatedState;
  } catch (error) {
    console.error("Error in addHistoryEntry:", error);
    
    // Just return the state without adding history in case of error
    // This ensures the game can continue even if history fails
    return state;
  }
};

// Update an attribute value in the game state
export const updateAttribute = (
  state: GameState,
  attribute: string,
  value: number
): GameState => {
  return {
    ...state,
    attributes: {
      ...state.attributes,
      [attribute]: value
    }
  };
};

// Update relationship value with an NPC
export const updateRelationship = (
  state: GameState,
  npcId: string,
  change: number
): GameState => {
  const currentValue = state.relationships?.[npcId] || 0;
  const newValue = Math.max(-100, Math.min(100, currentValue + change));

  return {
    ...state,
    relationships: {
      ...(state.relationships || {}),
      [npcId]: newValue
    }
  };
};

// Update the current scene
export const updateCurrentScene = (
  state: GameState,
  newScene: string
): GameState => {
  return {
    ...state,
    currentScene: newScene
  };
}; 