# Game Template Structure

This document outlines the structure and requirements for game templates in the D&D-style interactive game.

## Overview

Templates define the game world, characters, attributes, skills, and customization options. Each template is stored as a JSON file in the `/src/templates/` directory.

## Required Fields

### Metadata

```
"metadata": {
  "id": "unique-template-id",
  "name": "Display Name", 
  "description": "Brief description of the scenario",
  "imageUrl": "path/to/image.jpg", // Optional
  "tags": ["tag1", "tag2", "tag3"] // Array of category tags for filtering
  "estimatedDuration": "2-3 hours", // Optional, estimated gameplay duration
  "difficulty": "Beginner", // Optional, gameplay difficulty level
}
```

### Core Elements

```
"scenario": "Short scenario name/title",
"startingPoint": "Description of the initial game state",
```

### Attributes

Define character attributes that affect gameplay:

```
"attributes": {
  "attribute_key": "Description of what this attribute means",
  // Additional attributes...
}
```

### Skills

Define skills that can be used in gameplay:

```
"baseSkills": {
  "skill_key": {
    "name": "Display Name",
    "description": "What this skill does",
    "attributeKey": "attribute_key" // References an attribute defined above
  },
  // Additional skills...
}
```

### Player Customizations

Define options for character customization:

```
"playerCustomizations": {
  "category_key": {
    "name": "Category Name",
    "description": "Explanation of this customization category",
    "options": [
      "Option 1",
      "Option 2",
      // Additional options...
    ],
    "impact": {
      "Option 1": {
        "attribute_key": 2, // Positive or negative impact on attributes
        "another_attribute": -1
      },
      // Impact for other options...
    }
  },
  // Additional customization categories...
}
```

### NPCs (Optional)

Define non-player characters in the game world:

```
"npcs": {
  "category": [
    {
      "name": "NPC Name",
      "description": "Description of this character"
    },
    // Additional NPCs...
  ]
}
```

### Stages (Optional)

Define distinct narrative stages with goals, conditions, and rewards:

```
"stages": {
  "stage_id": {
    "name": "Human-readable Stage Name",
    "description": "Description of this stage's narrative context",
    "goals": [
      {
        "id": "goal_id",
        "name": "Goal Name",
        "description": "What the player needs to accomplish",
        "requirements": {
          "attribute1": 3,  // Minimum attribute values needed
          "attribute2": 2
        }
      }
    ],
    "completion_conditions": {
      "min_goals_completed": 1,  // Minimum number of goals to complete
      "min_attributes": {        // Minimum attributes needed
        "attribute1": 3,
        "attribute2": 2
      }
    },
    "rewards": {
      "attribute_bonus": {       // Attributes to increase upon completion
        "attribute1": 1
      },
      "nextStageId": "second-crisis"
    }
  }
}
```

#### Stage Structure Details

- **stage_id**: Unique identifier for the stage (e.g., "initial_audition")
- **name**: Human-readable name shown to players
- **description**: Narrative context for this stage of the game
- **goals**: Array of accomplishment objectives
  - **id**: Unique identifier for the goal
  - **name**: Short display name
  - **description**: Detailed description of what to accomplish
  - **requirements**: Attribute thresholds needed to complete this goal
- **completion_conditions**: Criteria to advance to the next stage
  - **min_goals_completed**: Minimum number of goals player must complete
  - **min_attributes**: Minimum attribute levels required
- **rewards**: Benefits gained upon completing this stage
  - **attribute_bonus**: Attribute increases

#### Multiple-Stage Example

```json
"stages": {
  "introduction": {
    "name": "Introduction",
    "description": "Your first day at the White House",
    "goals": [
      {
        "id": "meet_president",
        "name": "Meet the President",
        "description": "Successfully introduce yourself to the President",
        "requirements": {
          "charisma": 2,
          "intelligence": 3
        }
      },
      {
        "id": "learn_protocols",
        "name": "Learn Protocols",
        "description": "Understand basic White House protocols",
        "requirements": {
          "intelligence": 4
        }
      }
    ],
    "completion_conditions": {
      "min_goals_completed": 1,
      "min_attributes": {
        "charisma": 2
      }
    },
    "rewards": {
      "attribute_bonus": {
        "credibility": 1
      },
      "unlock_skills": ["basic_diplomacy"]
    }
  },
  "first_crisis": {
    "name": "First Crisis",
    "description": "Handle your first international incident",
    "goals": [
      {
        "id": "brief_president",
        "name": "Brief the President",
        "description": "Successfully explain the situation to the President",
        "requirements": {
          "intelligence": 5,
          "credibility": 3
        }
      }
    ],
    "completion_conditions": {
      "min_goals_completed": 1,
      "min_attributes": {
        "intelligence": 4,
        "credibility": 3
      }
    },
    "rewards": {
      "attribute_bonus": {
        "influence": 2
      },
      "nextStageId": "second-crisis"
    }
  }
}
```

## Example

See existing templates like `helicopter-parent.json` or `white-house.json` for complete examples.

## Best Practices

1. Keep descriptions concise but informative
2. Ensure all attributeKey references in skills match defined attributes
3. Balance attribute impacts in customizations
4. Use lowercase with underscores for all keys (except in the metadata section)
5. Include a variety of skills that cover different play styles
6. Test the template with different player choices to ensure balanced gameplay

## Advanced Features (Optional)

Templates can also include:
- Special events
- Location-specific content
- Achievement systems
- Relationship mechanics
- Special dice events

### Special Dice Events

Define events that trigger when all three dice match:

```
"specialDiceEvents": {
  "1": {
    "name": "Terrible Misfortune",
    "description": "A particularly unlucky outcome",
    "effect": {
      "attribute_key": -2, // Negative impact on attributes
      "another_attribute": -1
    }
  },
  "2": {
    "name": "Minor Setback",
    "description": "Something unexpected goes wrong",
    "effect": {
      "attribute_key": -1
    }
  },
  "3": {
    "name": "Strange Coincidence",
    "description": "Something unusual but neither good nor bad happens",
    "effect": {
      "attribute_key": 0,
      "another_attribute": 0
    }
  },
  "4": {
    "name": "Unexpected Assistance",
    "description": "Someone or something provides unexpected help",
    "effect": {
      "attribute_key": 1
    }
  },
  "5": {
    "name": "Lucky Break",
    "description": "Something fortunate happens unexpectedly",
    "effect": {
      "attribute_key": 1,
      "another_attribute": 1
    }
  },
  "6": {
    "name": "Extraordinary Success",
    "description": "An extremely fortunate outcome beyond expectations",
    "effect": {
      "attribute_key": 2,
      "another_attribute": 1
    }
  }
}
```

Refer to the game design documentation for details on implementing these features.