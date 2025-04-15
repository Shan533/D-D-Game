/**
 * Triple Dice System (Slot Machine Style)
 */

// Roll three dice (each 1-6)
export const rollTripleDice = (): number[] => {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];
};

// Check if all dice match (for special events)
export const checkTripleMatch = (dice: number[]): boolean => {
  return dice[0] === dice[1] && dice[1] === dice[2];
};

// Get the matched value (if there is a match)
export const getMatchedValue = (dice: number[]): number | null => {
  return checkTripleMatch(dice) ? dice[0] : null;
};

// Calculate sum of dice values
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
  templateEvents: Record<string, any>
): string => {
  if (!templateEvents || !templateEvents[matchedValue.toString()]) {
    return `Triple ${matchedValue}s! A special event occurs.`;
  }
  
  const event = templateEvents[matchedValue.toString()];
  return `Special Event: ${event.name} - ${event.description}`;
};

// Get the attribute effects for a special event
export const getSpecialEventEffects = (
  matchedValue: number,
  templateEvents: Record<string, any>
): Record<string, number> => {
  if (!templateEvents || !templateEvents[matchedValue.toString()]) {
    return {};
  }
  
  return templateEvents[matchedValue.toString()].effect || {};
};

// Get the outcome description based on the dice roll
export const getDiceOutcomeDescription = (
  dice: number[],
  total: number,
  difficultyClass: number
): string => {
  if (checkTripleMatch(dice)) {
    return `Triple match! All dice showing ${dice[0]}. A special event is triggered!`;
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

// Adjusted difficulty class thresholds based on the new range (3-18)
export const getDifficultyClass = (
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard'
): number => {
  switch (difficulty) {
    case 'very_easy': return 5;   // Almost always succeeds
    case 'easy': return 7;        // Usually succeeds
    case 'medium': return 10;     // 50/50 chance
    case 'hard': return 13;       // Usually fails
    case 'very_hard': return 16;  // Almost always fails
    default: return 10;
  }
}; 