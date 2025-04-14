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

  // Format attributes with descriptions
  const formattedAttributes = Object.entries(state.attributes)
    .map(([key, value]) => {
      const attributeDesc = template.attributes[key];
      return attributeDesc ? `${key} (${attributeDesc}): ${value}` : `${key}: ${value}`;
    })
    .join('\n- ');

  // Format available NPCs with descriptions
  let availableNPCs = '';
  if (template.npcs && Object.keys(template.npcs).length > 0) {
    availableNPCs = Object.entries(template.npcs)
      .map(([category, npcList]) => {
        const formattedNPCs = npcList
          .map(npc => `  - ${npc.name}: ${npc.description}`)
          .join('\n');
        return `${category}:\n${formattedNPCs}`;
      })
      .join('\n');
  }

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

  // Determine template language
  const templateTitle = state.scenario || template.scenario || '';
  const isChinese = /[\u4e00-\u9fa5]/.test(templateTitle);
  const languageInstruction = isChinese ? 
    "Your responses should be in Chinese to match the template's language." : 
    "Your responses should be in English to match the template's language.";

  // Instructions for requesting dice rolls
  const diceInstructions = `
IMPORTANT: The following is for your internal decision-making ONLY. DO NOT include the [DICE_CHECK] format in your actual response to the player. Instead, describe the need for a check narratively.

When there is uncertainty in the outcome or a challenge that requires testing the player's abilities, you should internally determine:

1. The appropriate attribute or skill being tested
2. The difficulty (DC) of the challenge
3. The potential outcomes based on success or failure

In your narrative, suggest when a dice roll might be appropriate by describing the challenge, but DO NOT use the [DICE_CHECK] format in your response.

For example, instead of writing "[DICE_CHECK: Strength check, DC 15]", write something like "The heavy door looks challenging to move. Your strength will be tested if you try to force it open."

EXTREMELY IMPORTANT: NEVER use the internal attribute or skill names (like "social_engineering", "public_appeal", etc.) directly in your narrative. Instead, use natural language descriptions of these abilities. For example, instead of mentioning "public_appeal" attribute, say something like "your ability to appeal to the audience" or "your charisma with the public".
`;

  // Language and style guidelines
  const languageStyleInstructions = `
LANGUAGE AND STYLE GUIDELINES:

1. ${languageInstruction}
2. Match your tone and style to the theme of the template: "${templateTitle}"
3. Use vocabulary and expressions appropriate for the scenario and setting.
4. If the scenario has a specific cultural context (e.g., Asian parenting, corporate setting), use language that reflects this context.
5. Maintain consistency in language style throughout your responses.
6. If the player switches languages in their input, adapt and respond in the same language they used.
`;

  // NPC interaction guidelines
  const npcInstructions = `
IMPORTANT NPC GUIDELINES:

1. Include NPCs in your narrative regularly to make the world feel alive and interactive.
2. NPCs should have consistent personalities based on their descriptions.
3. When the player interacts with an NPC, consider how the relationship value affects their reaction.
4. NPCs can provide information, challenges, assistance, or obstacles based on their relationship with the player.
5. Incorporate NPC relationships meaningfully into the narrative outcomes.
6. NPCs should react to both successes and failures in ways consistent with their character.
7. Never mention the numerical relationship values directly - show the relationship through dialogue tone and actions.
`;

  // Add explanation about how dice results affect the narrative
  const diceResultsExplanation = `
If a dice roll was provided in the input, use these guidelines:
- Success (roll + modifier ≥ DC): Describe a successful outcome
- Critical Success (natural 20): Describe an exceptionally positive outcome
- Failure (roll + modifier < DC): Describe a setback or complication
- Critical Failure (natural 1): Describe a significant failure or negative consequence

The degree of success or failure should influence the magnitude of the outcome:
- Barely succeeded/failed (within 2 of DC): Minor effect
- Solidly succeeded/failed (3-5 from DC): Moderate effect
- Greatly succeeded/failed (6+ from DC): Major effect
`;

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

${template.npcs && Object.keys(template.npcs).length > 0 
  ? `Available NPCs in this world:\n${availableNPCs}\n` 
  : ''}

${previousInteractionText}

The player has chosen to: ${playerAction}

${diceRollText}

${languageStyleInstructions}

${diceInstructions}

${npcInstructions}

${diceResultsExplanation}

Based on this information, narrate what happens next. Include:
1. The outcome of the player's action, suggesting when a dice roll might be appropriate by describing the challenge narratively
2. World/NPC reactions and interactions (include at least one NPC in your response)
3. New information or opportunities
4. A question or hook for what the player might want to do next

IMPORTANT: 
- NEVER include the [DICE_CHECK] format directly in your response.
- NEVER use internal attribute or skill names (like "public_appeal", "social_engineering", etc.) in your narrative.
- Instead, describe these attributes in natural language that fits the story context.
- This formatting is only for your internal understanding of the game mechanics.
- Always incorporate NPCs from the available list to create a rich, interactive story.
- Respond in the language that matches the template title (${isChinese ? 'Chinese' : 'English'}).

Keep your response engaging, dramatic, and in the style of a D&D Dungeon Master. Respond with 3-4 paragraphs.`;

  return prompt;
}; 