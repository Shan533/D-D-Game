D&D-Style Interactive Game Design
Project Overview
This document outlines the design and implementation plan for an interactive, text-based, AI-powered Dungeons & Dragons style game. The application will be built using Next.js with Supabase for authentication and user management, and will integrate with OpenAI APIs for dynamic storytelling capabilities.
Core Concepts
The game follows the basic D&D gameplay loop:
The AI introduces and describes a scene/situation (acting as Dungeon Master)
The player makes decisions and takes actions
The AI determines outcomes based on character attributes, player choices, and random elements (D20 dice rolls)
The AI narrates the results and world reactions
The story progresses based on these interactions
The application will support various scenario templates (like "Asian Helicopter Parenting" or "White House Chaos: Trump's Advisor") and can be easily adapted to run any scenario conforming to our template structure.
Technical Architecture
Template System
Templates define game worlds with the following interface:
interface GameTemplate {
  // Core Elements (Required)
  scenario: string;                                    // Game scenario name
  attributes: Record<string, string>;                  // Character attributes and descriptions
  baseSkills: Record<string, SkillDefinition>;         // Base skill definitions
  playerCustomizations: Record<string, Customization>; // Character customization options
  startingPoint: string;                               // Game starting point description
  
  // Extension Elements (Optional)
  npcs?: Record<string, NPC[]>;                        // NPC character definitions
  events?: Record<string, GameEvent>;                  // Game events
  specialSkills?: Record<string, SpecialSkill>;        // Special skills
  chainEffects?: Record<string, ChainEffect>;          // Chain effect system
  achievements?: Record<string, Achievement>;          // Achievement system
  relationshipSystem?: RelationshipSystem;             // Relationship system
}

Game State Management
The game state tracks player progress and is defined as:
interface GameState {
  // Base State
  userId: string;                                      // User ID
  templateId: string;                                  // Template ID in use
  scenario: string;                                    // Game scenario
  currentScene: string;                                // Current scene
  turn: number;                                        // Current turn
  
  // Character State
  playerName: string;                                  // Player name
  playerCustomizations: Record<string, string>;        // Player's chosen customization options
  attributes: Record<string, number>;                  // Current attribute values
  
  // Extended State (Optional)
  relationships?: Record<string, number>;              // Relationships with NPCs
  activeSpecialSkills?: Record<string, {               // Active special skills
    remainingTurns: number;
    effect: any;
  }>;
  chainTrackers?: Record<string, {                     // Chain effect trackers
    progress: number;
    target: number;
  }>;
  unlockedAchievements?: string[];                     // Unlocked achievements
  history?: GameHistoryEntry[];                        // Game history records
}

Core Features
1. User Authentication & Management
User registration and login
Basic profile management
Game save and load functionality
Secure authentication flow using Supabase
2. Interactive AI Gameplay
AI-powered storytelling (OpenAI integration)
Game state tracking and management
D&D dice system for randomized outcomes
Attribute and skill check mechanisms
User choice-driven narrative
3. User Experience & Interface
Character creation and customization
Main game interface with dialogue and attribute display
Game progression visualization
Intuitive navigation and controls
Game Mechanics
1. Character Attributes & Skills
Each template defines unique attributes relevant to its scenario
Skills are tied to attributes and represent actions players can take
Skill checks use a D20 dice roll modified by relevant attribute values
2. D&D Dice System
Random number generation (1-20) for skill checks
Critical success/failure mechanics
Modified success thresholds based on character attributes
3. NPC Interaction System
Limited set of key NPCs with defined personalities and preferences
Basic relationship tracking (-100 to 100 scale)
NPC interactions that impact game progression
Relationship levels with corresponding effects
4. Event System
Triggered events based on player actions or game state
Multiple-choice decision points
Consequences that affect attributes, relationships, and story progression
5. Chain Effects & Special Skills (Future Enhancement)
Conditional game mechanics that trigger after meeting specific requirements
Limited-duration special abilities activated through specific in-game actions
Progress tracking for chain conditions
6. Achievement System (Future Enhancement)
Unlockable achievements based on game outcomes and player choices
Rewards for achievement completion
Tracking for replay value
Database Schema (Supabase)
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game saves table
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  template_id TEXT NOT NULL,
  game_state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game history table
CREATE TABLE game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) NOT NULL,
  turn_number INTEGER NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  state_changes JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  achievement_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id, template_id)
);

AI Integration
Prompt Engineering
The AI system will receive structured prompts that include:
Current game state information
Player action/choice
Template context
Relevant history
Dice roll results
Example prompt structure:
You are the game master for a D&D-style game called "{scenario}".

Current game state:
- Character: {playerCustomizations description}
- Attributes: {attributes with values}
- Current scene: {currentScene}
- Active effects: {activeSpecialSkills}
- Relationships: {key relationships}

The player has chosen to: {playerAction}

A D20 dice was rolled with the following result: {diceRoll} 
(Modified by {attributeValue} for a total of {total})

Based on this information, narrate what happens next. Include:
1. The outcome of the player's action
2. World/NPC reactions
3. New information or opportunities
4. A question or hook for what the player might want to do next

Implementation Plan
Phase 1 (1 day) - Core Functionality
Basic Framework Setup


Next.js project initialization
Supabase integration
Basic UI component design
User Authentication System


Registration/login functionality
Authentication state management
Basic profile management
Template Parser


Basic template loading and parsing
Game state initialization
Attribute and skill system
AI Interaction Basics


OpenAI integration
Prompt engineering design
Basic dialogue interface
Phase 2 (1-2 days) - Game Experience Enhancement
D&D Dice System


Random number generator
Skill check mechanism
Result visualization
Game Flow Design


Scene transitions
Attribute growth system
Event trigger mechanism
Simplified NPC System


Implementation of 3-5 key NPCs
Basic relationship system
Simple interaction mechanism
Game Progress Management


Save and load functionality
Game history recording
Turn management
Phase 3 (Future Iterations) - Extended Features
Extended Game Mechanics


Chain effect system
Timed special skills
Achievement system implementation
Enhanced NPC System


More complex NPC behaviors
Rich interaction options
Relationship influence on gameplay
Visual and Audio Enhancement


Visual effects
Background music
Sound effects and animations
Multi-template Support


Template creation tools
Multi-scenario switching
Custom template support
Feature Priority Ranking
Core Game Loop - Highest priority


Dialogue and narrative
Attribute and skill system
Basic decision branches
Dice System - High priority


Adds randomness and uncertainty
Provides immediate feedback
Enhances gameplay
Simplified NPC System - Medium-high priority


Enriches the game world
Provides social interactions
Adds strategic depth
Event System - Medium priority


Creates dramatic moments
Diversifies gameplay experience
Provides challenges and opportunities
Chain Effects and Special Skills - Medium-low priority


Increases game depth
Provides strategic choices
Creates sense of achievement
Achievement System - Low priority


Increases replay value
Tracks progress
Provides long-term goals
UI/UX Design
Key Screens
Login/Registration


Simple, clean authentication flow
Username/password and profile creation
Template Selection


Visual cards for each available scenario
Brief description and theme preview
Character Creation


Interactive customization options
Visual representation of attribute bonuses
Background story integration
Main Game Interface


AI-generated narrative display
Character stats sidebar
Action input/selection area
Dice roll visualization
Game history/log access
User Flow
User registers/logs in
User selects a game template
User creates a character (customizations)
Game introduces the scenario and starting point
Main gameplay loop begins:
AI describes situation
Player takes action
AI determines outcome (with dice if needed)
Game state updates
Loop continues
Conclusion
This D&D-style interactive game leverages modern AI technology to create dynamic, personalized storytelling experiences. By implementing a flexible template system, the application can support various scenarios while maintaining consistent game mechanics.
The development plan prioritizes core functionality first, ensuring a complete and functional game loop within the initial 1-day timeframe, with additional enhancements implemented in the following 1-2 days as time permits.
Future iterations can expand on the foundation with more complex game mechanics, enhanced NPC interactions, visual/audio improvements, and support for custom user-created templates.

