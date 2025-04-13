import { GameState, GameTemplate } from '../../types/game';

/**
 * Builds a prompt for the AI based on the game state and player action
 * @param template The game template
 * @param state The current game state
 * @param playerAction The player's action
 * @param diceRoll Optional dice roll information
 * @returns A formatted prompt for the AI
 */
export const buildGamePrompt = (
  template: GameTemplate,
  state: GameState,
  playerAction: string,
  diceRoll?: { roll: number; attributeModifier?: number; total?: number }
): string => {
  // Format active relationships
  const relationships = state.relationships || {};
  const formattedRelationships = Object.entries(relationships)
    .map(([npcId, value]) => {
      // Check if template.npcs exists before accessing it
      const npcs = template.npcs || {};
      const npcGroup = Object.entries(npcs).find(([_, npcsArray]) => 
        npcsArray.some(npc => npc.name === npcId)
      );
      
      if (!npcGroup) return `${npcId}: ${value}`;
      
      const npc = npcGroup[1].find(n => n.name === npcId);
      if (!npc) return `${npcId}: ${value}`;
      
      let relationshipStatus = 'neutral';
      if (value >= 75) relationshipStatus = 'very positive';
      else if (value >= 25) relationshipStatus = 'positive';
      else if (value <= -75) relationshipStatus = 'very negative';
      else if (value <= -25) relationshipStatus = 'negative';
      
      return `${npcId} (${relationshipStatus}): ${value}`;
    })
    .join('\n- ');

  // Format player customizations
  const formattedCustomizations = Object.entries(state.playerCustomizations)
    .map(([key, value]) => {
      const customization = template.playerCustomizations[key];
      return customization ? `${customization.name}: ${value}` : `${key}: ${value}`;
    })
    .join('\n- ');

  // Format attributes
  const formattedAttributes = Object.entries(state.attributes)
    .map(([key, value]) => {
      const attributeDesc = template.attributes[key];
      return attributeDesc ? `${key} (${attributeDesc}): ${value}` : `${key}: ${value}`;
    })
    .join('\n- ');

  // Format dice roll information
  const diceRollText = diceRoll
    ? `A D20 dice was rolled with the following result: ${diceRoll.roll}${
        diceRoll.attributeModifier !== undefined
          ? ` (Modified by ${diceRoll.attributeModifier} for a total of ${diceRoll.total})`
          : ''
      }`
    : 'No dice roll was performed for this action.';

  // Format active special skills
  const activeSkills = state.activeSpecialSkills || {};
  const formattedActiveSkills = Object.entries(activeSkills)
    .map(([skill, data]) => `${skill} (${data.remainingTurns} turns remaining)`)
    .join('\n- ');

  // Format previous interaction (if available)
  const lastInteraction = state.history && state.history.length > 0
    ? state.history[state.history.length - 1]
    : null;
  
  const previousInteractionText = lastInteraction
    ? `Previous interaction (Turn ${lastInteraction.turn}):\nPlayer: ${lastInteraction.action}\nResponse: ${lastInteraction.result}`
    : 'This is the first interaction.';

  // Build the complete prompt
  const prompt = `You are the game master for a D&D-style game called "${state.scenario}".

Current game state:
- Character Name: ${state.playerName}
- Customizations:
  - ${formattedCustomizations}
- Attributes:
  - ${formattedAttributes}
- Current scene: ${state.currentScene}
${activeSkills && Object.keys(activeSkills).length > 0 
  ? `- Active effects:\n  - ${formattedActiveSkills}\n` 
  : ''}
${relationships && Object.keys(relationships).length > 0 
  ? `- Relationships:\n  - ${formattedRelationships}\n` 
  : ''}

${previousInteractionText}

The player has chosen to: ${playerAction}

${diceRollText}

Based on this information, narrate what happens next. Include:
1. The outcome of the player's action
2. World/NPC reactions
3. New information or opportunities
4. A question or hook for what the player might want to do next

Keep your response engaging, dramatic, and in the style of a D&D Dungeon Master. Respond with 3-4 paragraphs.`;

  return prompt;
}; 