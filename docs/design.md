# D&D-Style Interactive Game Design Document

## Overview
An AI-powered interactive storytelling game with triple dice mechanics, character customization, and dynamic narrative. Built on Next.js with Supabase and OpenAI integration.

## Core Game Loop
1. AI describes scene/situation
2. Player enters action/decision
3. System processes action (rolling dice when needed)
4. AI generates narrative response
5. Game state updates and loop continues

## Technical Architecture

### Template System
```typescript
interface GameTemplate {
  // Core Elements
  scenario: string;                                    // Game scenario name
  attributes: Record<string, string>;                  // Character attributes
  baseSkills: Record<string, SkillDefinition>;         // Available skills
  playerCustomizations: Record<string, Customization>; // Character options
  startingPoint: string;                               // Initial scene
  stages: Record<string, StageDefinition>;             // Game stages
  
  // Optional Elements
  npcs?: Record<string, NPC[]>;                        // NPCs by category
  specialDiceEvents?: Record<string, SpecialEvent>;    // Triple dice events
}
```

### Game State
```typescript
interface GameState {
  // Base State
  userId: string;
  templateId: string;
  scenario: string;
  currentScene: string;
  turn: number;
  currentStageId: string;
  
  // Character State
  playerName: string;
  playerCustomizations: Record<string, string>;
  attributes: Record<string, number>;
  
  // Progress Tracking
  completedGoals: Record<string, string[]>;
  relationships?: Record<string, number>;
  history?: GameHistoryEntry[];
  
  // Optional Features
  activeSpecialSkills?: Record<string, {remainingTurns: number, effect: any}>;
}
```

## Key Game Mechanics

### 1. Triple Dice System
- Three dice (1-6) rolled simultaneously
- **Matching Dice**: All three dice showing same number triggers special event
- **Regular Rolls**: Sum of dice (3-18) + attribute modifier determines success
- Difficulty classes: Very Easy (5), Easy (7), Medium (10), Hard (13), Very Hard (16)
- Attribute modifiers: +1 for every 5 points in relevant attribute

### 2. Stage Progression System
Each game has multiple stages with defined structure:
```json
{
  "stage_id": {
    "name": "Stage Name",
    "description": "Stage narrative context",
    "goals": [
      {
        "id": "goal_id",
        "name": "Goal Name",
        "description": "Goal description",
        "requirements": {"attribute1": 3, "attribute2": 2}
      }
    ],
    "completion_conditions": {
      "min_goals_completed": 1,
      "min_attributes": {"attribute1": 3}
    },
    "rewards": {
      "attribute_bonus": {"attribute1": 1},
      "unlock_skills": ["skill_id"]
    }
  }
}
```

The system tracks current stage, checks completion conditions after actions, and handles stage transitions with appropriate narrative elements.

### 3. Story Conclusion System
Three methods to end the game:

**Natural Conclusion**: Complete all goals in final stage
- System recognizes completion
- AI generates comprehensive ending reflecting full journey

**Extended Gameplay**: 30+ turns in final stage
- System acknowledges long gameplay
- AI creates satisfying ending even without all goals

**Player-Requested**: User types ending phrase
- Recognized phrases: "结束故事", "游戏结束", "end story", etc.
- Works at any stage of gameplay
- AI crafts appropriate ending based on current state

### 4. NPC Interaction System
- NPCs categorized in template
- Relationship values (-100 to 100)
- Relationship thresholds affect interactions:
  - Very Positive (≥75): Close ally, potential romantic interest
  - Positive (≥25): Friendly, helpful
  - Neutral (-25 to 25): Professional
  - Negative (≤-25): Unfriendly, resistant
  - Very Negative (≤-75): Hostile

### 5. Attribute System
- Template-defined attributes relevant to scenario
- Starting values determined by character customization
- Modified through game actions and events
- Directly affect dice roll outcomes
- Required to complete stage goals

## AI Integration

### Prompt Structure
The AI prompt includes:
- Current game state (character, attributes, relationships)
- Stage information and goals
- Player's action
- Dice roll results (if applicable)
- Special instructions for endings or transitions

Key AI instruction elements:
```
CURRENT STAGE FOCUS:
Current Stage: "{stageName}"
Stage Description: {stageDescription}
Stage Goals:
  - {goalName} ({status}): {goalDescription} (Requires: {requirements})

PLAYER ACTION (Turn {turnNumber}): {playerAction}

DICE ROLL RESULTS:
[Dice values and outcome information]
```

For endings, additional instructions guide the AI to create satisfying conclusions.

## Database Schema
```sql
-- Core tables for game functionality
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL
);

CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  template_id TEXT NOT NULL,
  game_state JSONB NOT NULL
);

CREATE TABLE game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) NOT NULL,
  turn_number INTEGER NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  state_changes JSONB
);
```

