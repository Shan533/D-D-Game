/**
 * D&D-style dice rolling system
 */

// Roll a single D20 die
export const rollD20 = (): number => {
  return Math.floor(Math.random() * 20) + 1;
};

// Check if roll is a critical success (20) or failure (1)
export const isCriticalSuccess = (roll: number): boolean => roll === 20;
export const isCriticalFailure = (roll: number): boolean => roll === 1;

// Roll with advantage (roll twice, take the higher value)
export const rollWithAdvantage = (): { rolls: [number, number]; result: number } => {
  const roll1 = rollD20();
  const roll2 = rollD20();
  return {
    rolls: [roll1, roll2],
    result: Math.max(roll1, roll2)
  };
};

// Roll with disadvantage (roll twice, take the lower value)
export const rollWithDisadvantage = (): { rolls: [number, number]; result: number } => {
  const roll1 = rollD20();
  const roll2 = rollD20();
  return {
    rolls: [roll1, roll2],
    result: Math.min(roll1, roll2)
  };
};

// Calculate total for a skill check (base roll + attribute modifier)
export const calculateTotal = (roll: number, modifier: number): number => {
  return roll + modifier;
};

// Determine success of skill check against difficulty class (DC)
export const isSuccessful = (total: number, difficultyClass: number): boolean => {
  return total >= difficultyClass;
};

// Get the outcome description based on the roll
export const getDiceOutcomeDescription = (
  roll: number,
  total: number,
  difficultyClass: number
): string => {
  if (isCriticalSuccess(roll)) {
    return 'Critical Success! You performed exceptionally well.';
  } else if (isCriticalFailure(roll)) {
    return 'Critical Failure! Your attempt went horribly wrong.';
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