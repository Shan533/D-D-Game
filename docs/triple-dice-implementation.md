# Triple Dice System Implementation Plan

This document outlines the implementation plan for replacing the current D20 dice system with a slot machine-like triple dice system.

## Overview

The new system will use three six-sided dice instead of a single D20 die. When the player makes a skill check:
1. Three dice (numbered 1-6) are rolled simultaneously
2. If all three dice show the same number, a special event is triggered based on the matched number
3. If the dice are not identical, their values are summed (3-18) to determine the outcome
4. Similar to the old system, attribute modifiers are applied to the final sum

## Implementation Steps

### 1. Update Dice Logic (src/lib/game/dice.ts)

Replace the current dice functions with new ones:

```typescript
// Roll three dice (each 1-6)
export const rollTripleDice = (): number[] => {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];
};

// Check if all dice match
export const checkTripleMatch = (dice: number[]): boolean => {
  return dice[0] === dice[1] && dice[1] === dice[2];
};

// Get the matched value (if there is a match)
export const getMatchedValue = (dice: number[]): number | null => {
  return checkTripleMatch(dice) ? dice[0] : null;
};

// Calculate total for non-matching dice
export const calculateDiceSum = (dice: number[]): number => {
  return dice.reduce((sum, value) => sum + value, 0);
};

// Apply attribute modifier to dice sum
export const calculateTotal = (diceSum: number, modifier: number): number => {
  return diceSum + modifier;
};

// Determine success of skill check against difficulty class (DC)
export const isSuccessful = (total: number, difficultyClass: number): boolean => {
  return total >= difficultyClass;
};

// Get description for special events
export const getSpecialEventDescription = (
  matchedValue: number,
  templateEvents: any
): string => {
  const event = templateEvents[matchedValue.toString()];
  return event 
    ? `Special Event: ${event.name} - ${event.description}` 
    : `Special Event: Triple ${matchedValue}s`;
};

// Get the outcome description based on the roll
export const getDiceOutcomeDescription = (
  dice: number[],
  total: number,
  difficultyClass: number
): string => {
  if (checkTripleMatch(dice)) {
    return `Triple match! All dice showing ${dice[0]}.`;
  } else if (isSuccessful(total, difficultyClass)) {
    const margin = total - difficultyClass;
    if (margin >= 5) {
      return 'Great Success! You performed better than expected.';
    } else {
      return 'Success! You accomplished what you set out to do.';
    }
  } else {
    const margin = difficultyClass - total;
    if (margin <= 2) {
      return 'Near Miss! You almost succeeded.';
    } else {
      return 'Failure! You were unable to accomplish your goal.';
    }
  }
};
```

### 2. Update DiceRoller Component (src/components/game/DiceRoller.tsx)

Modify the component to:
1. Display three dice instead of one
2. Add special animations for matching dice
3. Show special event text when a match occurs

```typescript
interface TripleDiceProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  values?: number[];
  onRollComplete?: (values: number[]) => void;
}

export function TripleDice({ 
  size = 'md', 
  animate = true,
  values: initialValues,
  onRollComplete
}: TripleDiceProps) {
  const [rolling, setRolling] = useState(false);
  const [values, setValues] = useState(initialValues || [1, 1, 1]);
  
  // Implementation details...
}

interface DiceRollerProps {
  onRoll?: (result: number[]) => void;
  className?: string;
  specialEvents?: Record<string, any>;
}

export default function DiceRoller({ onRoll, className, specialEvents }: DiceRollerProps) {
  const [result, setResult] = useState<number[] | null>(null);
  const [isMatch, setIsMatch] = useState(false);
  const [specialEvent, setSpecialEvent] = useState<string | null>(null);
  
  const handleRollComplete = (values: number[]) => {
    setResult(values);
    
    // Check for matching dice
    if (values[0] === values[1] && values[1] === values[2]) {
      setIsMatch(true);
      
      if (specialEvents && specialEvents[values[0]]) {
        setSpecialEvent(`${specialEvents[values[0]].name}: ${specialEvents[values[0]].description}`);
      } else {
        setSpecialEvent(`Triple ${values[0]}s!`);
      }
    } else {
      setIsMatch(false);
      setSpecialEvent(null);
    }
    
    onRoll?.(values);
  };
  
  return (
    <div className={cn('flex flex-col items-center space-y-3', className)}>
      <div className="flex space-x-2">
        <TripleDice size="lg" onRollComplete={handleRollComplete} />
      </div>
      
      {result !== null && (
        <div className="text-center">
          {isMatch ? (
            <div className="text-xl font-bold text-pink-500 animate-pulse">
              {specialEvent}
            </div>
          ) : (
            <div className="text-lg font-medium text-[var(--game-text-primary)]">
              Total: {result.reduce((sum, val) => sum + val, 0)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 3. Update GameInterface Component (src/components/game/GameInterface.tsx)

Modify to handle the special events from matched dice:

```typescript
// Process the dice roll and special events
const handleDiceRoll = (diceValues: number[]) => {
  // Check for triple match
  const isMatch = diceValues[0] === diceValues[1] && diceValues[1] === diceValues[2];
  
  if (isMatch) {
    // Handle special event based on the matched value
    const matchedValue = diceValues[0];
    const specialEvent = gameState.template.specialDiceEvents[matchedValue];
    
    if (specialEvent) {
      // Apply special event effects to game state
      const newAttributes = {...gameState.attributes};
      
      for (const [attr, value] of Object.entries(specialEvent.effect)) {
        if (newAttributes[attr] !== undefined) {
          newAttributes[attr] += value;
        }
      }
      
      // Update game state with special event effects
      updateGameState({
        ...gameState,
        attributes: newAttributes,
        lastEvent: {
          type: 'specialDice',
          name: specialEvent.name,
          description: specialEvent.description,
          effects: specialEvent.effect
        }
      });
      
      // Send special event to AI for narration
      setPromptContext({
        ...promptContext,
        diceRoll: {
          values: diceValues,
          isSpecialEvent: true,
          specialEventName: specialEvent.name,
          specialEventDescription: specialEvent.description
        }
      });
    }
  } else {
    // Regular dice roll - sum the values and apply attribute modifier
    const diceSum = diceValues.reduce((sum, val) => sum + val, 0);
    const attributeModifier = getCurrentAttributeModifier();
    const total = diceSum + attributeModifier;
    
    // Update prompt context for AI
    setPromptContext({
      ...promptContext,
      diceRoll: {
        values: diceValues,
        isSpecialEvent: false,
        sum: diceSum,
        modifier: attributeModifier,
        total: total
      }
    });
  }
  
  // Proceed with the game flow...
};
```

### 4. Update AI Prompt Structure (src/lib/game/prompt-builder.ts)

Modify the prompt to include information about the triple dice roll:

```typescript
const buildPrompt = (state, playerAction, diceRoll) => {
  // Basic prompt structure
  let prompt = `You are the game master for a D&D-style game called "${state.scenario}".\n\n`;
  
  // Add game state information
  // [...]
  
  // Add player action
  prompt += `\nThe player has chosen to: ${playerAction}\n\n`;
  
  // Add dice roll information
  if (diceRoll) {
    prompt += `Three dice were rolled with the following results: [${diceRoll.values.join(', ')}]\n`;
    
    if (diceRoll.isSpecialEvent) {
      prompt += `SPECIAL EVENT TRIGGERED! All dice showing ${diceRoll.values[0]}\n`;
      prompt += `Event: ${diceRoll.specialEventName} - ${diceRoll.specialEventDescription}\n`;
      prompt += `This special event affects the character's attributes and the story. Incorporate this event into your narration.\n`;
    } else {
      prompt += `Regular roll with a sum of ${diceRoll.sum} (Modified by ${diceRoll.modifier} for a final total of ${diceRoll.total})\n`;
    }
  }
  
  // Add instructions for AI response
  prompt += `\nBased on this information, narrate what happens next. Include:
1. The outcome of the player's action
2. World/NPC reactions
3. New information or opportunities
4. A question or hook for what the player might want to do next`;
  
  return prompt;
};
```

## Testing Plan

1. Test the basic dice rolling functionality (rollTripleDice)
2. Test the match detection logic (checkTripleMatch)
3. Test the UI component with various combinations of dice
4. Test the special event triggering and application of effects
5. Test the integration with the AI prompt system

## Considerations

1. Adjust the difficulty thresholds in the game to account for the new sum range (3-18 instead of 1-20)
2. Consider additional UI enhancements to make the slot machine analogy more apparent (e.g., spinning animations)
3. Balance the special events to ensure they are exciting but not game-breaking

## Timeline

- Day 1: Implement core dice logic and UI components
- Day 2: Integrate with game state and AI prompt system
- Day 3: Testing and refinement 