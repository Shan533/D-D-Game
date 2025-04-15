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
      // Before trying to stringify, detect and handle circular references
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key: string, value: any) => {
          // Skip __proto__ properties
          if (key.startsWith('__')) return;
          
          // Handle non-object values normally
          if (typeof value !== 'object' || value === null) {
            return value;
          }
          
          // Detect circular references
          if (seen.has(value)) {
            console.warn(`Circular reference detected when saving to localStorage at key: ${key}`);
            // For circular references, return a simple representation instead
            return '[Circular Reference]';
          }
          
          seen.add(value);
          return value;
        };
      };

      // Use the circular reference-safe replacer
      const jsonString = JSON.stringify(data, getCircularReplacer());
      localStorage.setItem(key, jsonString);
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

    // Determine the starting stage ID
    const startingStageId = template.firstStageId || (template.stages ? Object.keys(template.stages)[0] : 'start');
    if (!startingStageId) {
      console.warn("Could not determine a starting stage ID for the template.");
      // Fallback to a default or handle error appropriately
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
      currentStageId: startingStageId || 'start', // Use determined or fallback ID
      completedGoals: {},                  // Initialize as empty
      isGameEnded: false,                  // Initialize as false
      gameEnding: undefined,               // Initialize as undefined
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
  template: GameTemplate,
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
): Promise<{ updatedState: GameState; didTransition: boolean }> => {
  try {
    if (!sessionId) {
      throw new Error('Cannot add history entry: sessionId is required');
    }
    
    if (!state) {
      throw new Error('Cannot add history entry: gameState is required');
    }

    // 1. Apply AI suggested state changes first (if any)
    let stateAfterAIChanges = { ...state };
    if (stateChanges) {
      // Assuming stateChanges contains attributes/relationships directly for now
      // If they are nested (like from parseStatsChanges), adjust this logic
      const parsedChanges = {
          attributes: stateChanges.attributes || {},
          relationships: stateChanges.relationships || {}
      };
      stateAfterAIChanges = applyStatsChanges(stateAfterAIChanges, parsedChanges);
    } 

    // 2. Check for stage progression *after* applying AI changes
    const { updatedState: stateAfterProgression, didTransition } = checkStageProgression(stateAfterAIChanges, template);

    // Ensure turn is incremented correctly on the final state
    const finalState = {
      ...stateAfterProgression,
      turn: state.turn + 1, // Increment turn based on the original state's turn
    };

    // 3. Create history entry (using the state *before* progression check for context?)
    const newEntry: GameHistoryEntry = {
      timestamp: new Date().toISOString(),
      turn: finalState.turn, // Use the incremented turn
      action,
      result,
      diceRoll: stateChanges?.diceRoll, // Pass full dice info if available in stateChanges
      // Store the state *after* AI changes but *before* progression check?
      // Or store the final state changes including progression?
      // Storing changes from AI + progression status for now
      stateChanges: {
        ...(stateChanges || {}),
        stageTransitionOccurred: didTransition,
        // Don't store the entire state to avoid circular references
        // Instead, store just the relevant state changes
        attributeChanges: { ...finalState.attributes },
        relationshipChanges: finalState.relationships ? { ...finalState.relationships } : {},
        currentStageId: finalState.currentStageId,
        completedGoals: { ...finalState.completedGoals },
        isGameEnded: finalState.isGameEnded,
        gameEnding: finalState.gameEnding
      },
      isKeyEvent, // Pass through existing fields
      eventType,
      eventDescription,
      relatedNPCs,
      impact
    };

    // Add the entry to the final state
    finalState.history = [...(stateAfterProgression.history || []), newEntry];

    // 4. Save the final state (stateAfterProgression, with history added)
    // ... (rest of the saving logic: localStorage or Supabase)
    
    // Save to localStorage if this was a localStorage session
    if (finalState._loadedFromLocalStorage) {
      console.log("Adding history entry to localStorage session");
      const localSession = getFromLocalStorage(`game_session_${sessionId}`);
      
      if (localSession) {
        localSession.game_state = finalState;
        localSession.updated_at = new Date().toISOString();
        
        saveToLocalStorage(`game_session_${sessionId}`, localSession);
        
        // Update in sessions list too
        const gameSessionsKey = `game_sessions_${finalState.userId}`;
        const sessions = getFromLocalStorage(gameSessionsKey) || [];
        
        const updatedSessions = sessions.map((s: any) => 
          s.id === sessionId ? localSession : s
        );
        
        saveToLocalStorage(gameSessionsKey, updatedSessions);
        
        return { updatedState: finalState, didTransition }; // Return final state and transition status
      }
    }
    
    // Check if Supabase is available
    const supabaseAvailable = await isSupabaseAvailable();
    
    if (supabaseAvailable) {
      try {
        console.log("Adding history entry to Supabase session");
        // Save history entry separately to game_history table
        const { error: historyError } = await supabase
          .from('game_history')
          .insert({
            session_id: sessionId,
            turn_number: finalState.turn,
            action,
            result,
            // Adjust how state_changes are saved if needed
            state_changes: newEntry.stateChanges || null, 
            is_key_event: isKeyEvent || false,
            event_type: eventType || null,
            event_description: eventDescription || null,
            related_npcs: relatedNPCs || null,
            impact: impact || null,
            // Save dice info if available
            dice_roll: stateChanges?.diceRoll || null 
          });
        
        if (historyError) {
          console.error("Error adding history entry:", historyError);
          // Decide if this should prevent state update
        }
        
        // Update the full game state in game_sessions table
        const { error: updateError } = await supabase
          .from('game_sessions')
          .update({
            game_state: finalState as any, // Save the final state including new history
            updated_at: new Date()
          })
          .eq('id', sessionId);
        
        if (updateError) {
          console.error("Error updating game state:", updateError);
          // Maybe throw error here?
        }
      } catch (dbError) {
        console.error("Database error when adding history entry:", dbError);
        // Decide how to handle this
      }
    } else {
      console.warn("Supabase not available - history entry only updated in memory and localStorage (if applicable)");
    }
    
    return { updatedState: finalState, didTransition }; // Return final state and transition status
  } catch (error) {
    console.error("Error in addHistoryEntry:", error);
    
    // Return original state and no transition in case of error
    return { updatedState: state, didTransition: false };
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

/**
 * Parses the stats changes from the AI response
 * @param statsText The text containing the stats changes
 * @returns An object containing attribute and relationship changes
 */
export const parseStatsChanges = (statsText: string): {
  attributes: Record<string, number>;
  relationships: Record<string, number>;
} => {
  const changes: {
    attributes: Record<string, number>;
    relationships: Record<string, number>;
  } = {
    attributes: {},
    relationships: {}
  };

  // Process attribute changes
  const attributeMatch = statsText.match(/Attribute changes: (.*)/);
  if (attributeMatch) {
    const attributeChanges = attributeMatch[1].split(',').map(change => change.trim());
    attributeChanges.forEach(change => {
      const match = change.match(/([^+-]+)([+-])(\d+)/);
      if (match) {
        const [, attr, operator, value] = match;
        const attributeName = attr.trim().toLowerCase().replace(/\s+/g, '_');
        const changeValue = parseInt(value) * (operator === '+' ? 1 : -1);
        if (!isNaN(changeValue)) {
          changes.attributes[attributeName] = changeValue;
        }
      }
    });
  }

  // Process relationship changes
  const relationshipMatch = statsText.match(/Relationship changes: (.*)/);
  if (relationshipMatch) {
    const relationshipChanges = relationshipMatch[1].split(',').map(change => change.trim());
    relationshipChanges.forEach(change => {
      const match = change.match(/([^+-]+)([+-])(\d+)/);
      if (match) {
        const [, npc, operator, value] = match;
        const npcName = npc.trim();
        const changeValue = parseInt(value) * (operator === '+' ? 1 : -1);
        if (!isNaN(changeValue)) {
          changes.relationships[npcName] = changeValue;
        }
      }
    });
  }

  // Also check for direct attribute changes without the "Attribute changes:" prefix
  const directAttributeMatch = statsText.match(/- ([^:]+)([+-])(\d+)/);
  if (directAttributeMatch) {
    const [, attr, operator, value] = directAttributeMatch;
    const attributeName = attr.trim().toLowerCase().replace(/\s+/g, '_');
    const changeValue = parseInt(value) * (operator === '+' ? 1 : -1);
    if (!isNaN(changeValue)) {
      changes.attributes[attributeName] = changeValue;
    }
  }

  return changes;
};

// --- Stage Progression Logic ---

/**
 * Checks if the player meets the conditions to progress to the next stage.
 * Updates completed goals, applies rewards, and transitions the stage if conditions are met.
 * Also handles game end conditions (success or failure).
 * 
 * @param state The current game state.
 * @param template The game template.
 * @returns An object containing the potentially updated game state and a flag indicating if a stage transition occurred.
 */
export const checkStageProgression = (
  state: GameState,
  template: GameTemplate
): { updatedState: GameState; didTransition: boolean } => {
  if (state.isGameEnded || !template.stages || !state.currentStageId || !template.stages[state.currentStageId]) {
    // Game already ended or no stages defined/found
    return { updatedState: state, didTransition: false };
  }

  const currentStage = template.stages[state.currentStageId];
  let updatedState = { ...state };
  let didTransition = false;

  // 1. Check for newly completed goals in the current stage
  const currentCompletedGoals = updatedState.completedGoals[updatedState.currentStageId] || [];
  let newGoalsCompleted = false;
  currentStage.goals.forEach(goal => {
    if (!currentCompletedGoals.includes(goal.id)) {
      // Check if requirements are met
      const requirementsMet = Object.entries(goal.requirements).every(([attr, minValue]) => {
        return (updatedState.attributes[attr] || 0) >= minValue;
      });

      if (requirementsMet) {
        if (!updatedState.completedGoals[updatedState.currentStageId]) {
          updatedState.completedGoals[updatedState.currentStageId] = [];
        }
        updatedState.completedGoals[updatedState.currentStageId].push(goal.id);
        currentCompletedGoals.push(goal.id); // Update local copy for condition checks
        newGoalsCompleted = true;
        console.log(`Goal completed: ${goal.name} in stage ${currentStage.name}`);
      }
    }
  });

  // Ensure completedGoals is a new object if modified
  if (newGoalsCompleted) {
    updatedState = { ...updatedState, completedGoals: { ...updatedState.completedGoals } };
  }

  // 2. Check stage completion conditions
  const conditions = currentStage.completion_conditions;
  let stageCompleted = true;

  if (conditions.min_goals_completed && currentCompletedGoals.length < conditions.min_goals_completed) {
    stageCompleted = false;
  }
  if (conditions.min_attributes) {
    if (!Object.entries(conditions.min_attributes).every(([attr, minValue]) => (updatedState.attributes[attr] || 0) >= minValue)) {
      stageCompleted = false;
    }
  }

  // --- Add Failure Condition Check (Example: Low 人气 in Idol Competition) ---
  // This needs to be more generic or template-driven in a real implementation
  if (template.metadata?.id === 'idol-competition' && (updatedState.attributes['人气'] || 0) < 0 && updatedState.turn > 5) { // Example condition
     console.log("Game ended due to low popularity.");
     updatedState.isGameEnded = true;
     updatedState.gameEnding = "由于人气过低，你遗憾地被淘汰了。Your journey ends here due to low popularity.";
     // Ensure state object is new
     return { updatedState: { ...updatedState }, didTransition: false };
  }
  // --- End Failure Condition Check ---

  // 3. Process Stage Completion
  if (stageCompleted) {
    console.log(`Stage completed: ${currentStage.name}`);
    didTransition = true;

    // Apply rewards
    if (currentStage.rewards.attribute_bonus) {
      Object.entries(currentStage.rewards.attribute_bonus).forEach(([attr, bonus]) => {
        updatedState.attributes[attr] = (updatedState.attributes[attr] || 0) + bonus;
      });
    }
    if (currentStage.rewards.unlock_skills) {
      // Assuming skills are managed elsewhere or added to a list
      console.log("Unlocked skills:", currentStage.rewards.unlock_skills); 
      // Placeholder: Add logic to handle skill unlocks if applicable
    }
    // Ensure attributes object is new
    updatedState = { ...updatedState, attributes: { ...updatedState.attributes } };

    // Transition to next stage or end game
    if (currentStage.nextStageId && template.stages[currentStage.nextStageId]) {
      console.log(`Transitioning to stage: ${currentStage.nextStageId}`);
      updatedState.currentStageId = currentStage.nextStageId;
    } else {
      // No next stage, game ends successfully
      console.log("Final stage completed. Game Won!");
      updatedState.isGameEnded = true;
      updatedState.gameEnding = template.metadata?.id === 'idol-competition' 
        ? "恭喜！你成功出道，成为了万众瞩目的新星！Congratulations! You successfully debuted and became a star!"
        : "You have successfully completed the scenario!"; // Default ending
    }
  }

  return { updatedState, didTransition };
};

// --- End Stage Progression Logic ---

/**
 * Applies the parsed stats changes to the game state
 * @param state The current game state
 * @param changes The changes to apply
 * @returns The updated game state
 */
export const applyStatsChanges = (
  state: GameState,
  changes: {
    attributes: Record<string, number>;
    relationships: Record<string, number>;
  }
): GameState => {
  let updatedState = { ...state };

  // Apply attribute changes
  Object.entries(changes.attributes).forEach(([attr, value]) => {
    // Ensure attribute exists in template before applying change?
    // For now, allow adding new attributes implicitly if needed
    const currentValue = updatedState.attributes[attr] || 0;
    // updatedState = updateAttribute(updatedState, attr, currentValue + value); // Use direct update for efficiency here
    updatedState.attributes[attr] = currentValue + value;
  });

  // Apply relationship changes
  Object.entries(changes.relationships).forEach(([npc, value]) => {
    // Ensure NPC exists before applying change? 
    const currentValue = updatedState.relationships?.[npc] || 0;
    // updatedState = updateRelationship(updatedState, npc, value); // Use direct update
    const newValue = Math.max(-100, Math.min(100, currentValue + value));
    if (!updatedState.relationships) {
        updatedState.relationships = {};
    }
    updatedState.relationships[npc] = newValue;
  });

  // Create new objects to ensure React detects the changes
  return {
    ...updatedState,
    attributes: { ...updatedState.attributes },
    relationships: { ...(updatedState.relationships || {}) }
  };
}; 