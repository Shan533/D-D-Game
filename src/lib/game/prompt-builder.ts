import { GameState, GameTemplate, GameHistoryEntry, StageDefinition } from '../../types/game';

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
  diceRoll?: { 
    values: number[]; 
    isSpecialEvent?: boolean;
    specialEventName?: string;
    specialEventDescription?: string;
    sum?: number;
    modifier?: number;
    total?: number;
  }
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
      
      return `${npcId} (${relationshipStatus}): ${value} - ${npc.description}`;
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
  } else {
    availableNPCs = "None defined in template.";
  }

  // Format dice roll information
  let diceRollText = 'No dice roll was performed for this action.';
  
  if (diceRoll) {
    if (diceRoll.isSpecialEvent && diceRoll.specialEventName && diceRoll.specialEventDescription) {
      diceRollText = `Three dice were rolled with the following results: [${diceRoll.values.join(', ')}]\n` +
        `SPECIAL EVENT TRIGGERED! All dice showing ${diceRoll.values[0]}\n` +
        `Event: ${diceRoll.specialEventName} - ${diceRoll.specialEventDescription}\n` +
        `This special event affects the character's attributes and the story. Incorporate this event into your narration in a dramatic and meaningful way that impacts the current situation. The triple ${diceRoll.values[0]}s represent a ${
          diceRoll.values[0] === 1 ? 'major negative event (Bad Luck)' :
          diceRoll.values[0] === 2 ? 'minor negative event (Minor Misfortune)' :
          diceRoll.values[0] === 3 ? 'balanced event with mixed outcomes (Balanced Fate)' :
          diceRoll.values[0] === 4 ? 'minor positive event (Minor Fortune)' :
          diceRoll.values[0] === 5 ? 'significant positive event (Good Fortune)' :
          diceRoll.values[0] === 6 ? 'extraordinary positive event (Critical Success)' :
          'special event'
        }.`;
    } else {
      diceRollText = `Three dice were rolled with the following results: [${diceRoll.values.join(', ')}]\n` +
        `Regular roll with a sum of ${diceRoll.sum || (diceRoll.values?.reduce((a, b) => a + b, 0))}${
          diceRoll.modifier !== undefined
            ? ` (Modified by ${diceRoll.modifier} for a final total of ${diceRoll.total})`
            : ''
        }`;
    }
  }

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
When there is uncertainty in an outcome or a challenge, determine the attribute being tested, difficulty (DC), and potential outcomes. When narrating, describe challenges naturally without using the [DICE_CHECK] format.

Example: Instead of "[DICE_CHECK: Strength check, DC 15]", write "The heavy door looks challenging to move. Your strength will be tested if you try to force it open, please roll a dice with a skill."
`;

  // Add explanation about how dice results affect the narrative
  const diceResultsExplanation = `
TRIPLE DICE SYSTEM:
Three dice (1-6) are rolled simultaneously:

1. Matching dice (e.g., three 4s): Triggers a special event based on the value
   - These events add unexpected twists and affect attributes
   - Each value (1-6) triggers a different type of special event defined in the template.

2. Non-matching dice: Values summed (3-18) for skill checks
   - Attribute modifiers: +1 bonus for every 5 points in the relevant attribute
   - Success: sum + attribute modifier ≥ DC
   - Failure: sum + attribute modifier < DC
   - Margin affects outcome intensity (±2: minor, ±3-5: moderate, ±6+: major)

3. Attribute impact on skills:
   - Each skill is tied to a specific attribute (e.g., 舞蹈, 颜值, 唱功, etc.)
   - Higher attribute values make skill checks more likely to succeed
   - Example: A 舞蹈 (Dance) skill check with 舞蹈 attribute of 12 gives +2 modifier (12 ÷ 5 = 2.4, rounded down to 2)

Difficulty scale (3-18 range): Very Easy: DC 5, Easy: DC 7, Medium: DC 10, Hard: DC 13, Very Hard: DC 16
`;

  // NPC interaction guidelines
  const npcInstructions = `
1. Include NPCs regularly to make the world feel alive and interactive
2. Maintain consistent NPC personalities based on their descriptions
3. Relationship values affect NPC reactions:
   - Very Positive (≥75): Close ally, loyal, may develop into romantic relationship if appropriate
   - Positive (≥25): Friendly, helpful, may show romantic interest if appropriate
   - Neutral (-25 to 25): Professional attitude, neither helpful nor difficult
   - Negative (≤-25): Unfriendly, resistant, difficult to work with
   - Very Negative (≤-75): Hostile, may sabotage
4. Show relationships through dialogue and actions, never mention numerical values
5. Relationship changes should feel natural and justified by player actions
`;

  // Format key events from history
  const formatKeyEvents = (history: GameHistoryEntry[] = []) => {
    const keyEvents = history.filter(entry => entry.isKeyEvent);
    if (keyEvents.length === 0) return 'None yet.';

    return keyEvents.map(entry => {
      const eventDetails = [
        `Turn ${entry.turn}: ${entry.eventDescription || entry.action}`,
        entry.eventType ? `Type: ${entry.eventType}` : '',
        entry.relatedNPCs?.length ? `NPCs: ${entry.relatedNPCs.join(', ')}` : '',
        entry.impact ? 'Impact:' : '',
        entry.impact?.attributes ? Object.entries(entry.impact.attributes)
          .map(([attr, value]) => `  - ${attr}: ${value > 0 ? '+' : ''}${value}`)
          .join('\n') : '',
        entry.impact?.relationships ? Object.entries(entry.impact.relationships)
          .map(([npc, value]) => `  - ${npc}: ${value > 0 ? '+' : ''}${value}`)
          .join('\n') : '',
        entry.impact?.unlocks?.length ? `  - Unlocked: ${entry.impact.unlocks.join(', ')}` : ''
      ].filter(Boolean).join('\n');

      return eventDetails;
    }).join('\n\n');
  };

  // --- Stage Information Section ---
  let stageInfoText = "No stage information available.";

  if (template.stages && state.currentStageId && template.stages[state.currentStageId]) {
    const currentStage: StageDefinition = template.stages[state.currentStageId];
    const completedGoalsForStage = state.completedGoals[state.currentStageId] || [];

    const formattedGoals = currentStage.goals.map(goal => {
      const isCompleted = completedGoalsForStage.includes(goal.id);
      const requirementsText = Object.entries(goal.requirements)
        .map(([attr, value]) => `${attr} ≥ ${value}`)
        .join(', ');
      return `  - ${goal.name} (${isCompleted ? 'Completed' : 'Pending'}): ${goal.description} (Requires: ${requirementsText})`;
    }).join('\n');

    stageInfoText = `Current Stage: "${currentStage.name}"
Stage Description: ${currentStage.description}
Stage Goals:
${formattedGoals}`;
  }
  // --- End Stage Information Section ---

  // Build the complete prompt
  const prompt = `ROLE: Game master for "${state.scenario}" - Create an engaging narrative that responds to player actions.

LANGUAGE: ${languageInstruction} Match your tone to "${templateTitle}".

GAME STATE:
- Character: ${state.playerName}
- Customizations: ${formattedCustomizations}
- Attributes: ${formattedAttributes}
- Current scene: ${state.currentScene}
${activeSkills && Object.keys(activeSkills).length > 0 ? `- Active effects: ${formattedActiveSkills}\n` : ''}
${relationships && Object.keys(relationships).length > 0 ? `- Relationships: ${formattedRelationships}\n` : ''}
- Turn: ${state.turn}

${availableNPCs !== "None defined in template." ? `AVAILABLE NPCs:\n${availableNPCs}\n` : ''}
${stageInfoText}

KEY EVENTS SO FAR:
${formatKeyEvents(state.history)}

PREVIOUS INTERACTION:
${previousInteractionText}

PLAYER ACTION (Turn ${state.turn + 1}): ${playerAction}

DICE ROLL RESULTS:
${diceRollText}

GAME MECHANICS TO FOLLOW:
1. Dice System: ${diceInstructions}
${diceResultsExplanation}
2. NPC Rules: ${npcInstructions}
3. Stage Progression: Incorporate the current stage context and goals into the narrative. Acknowledge goal progress if relevant.

RESPONSE REQUIREMENTS:
1. Narrate the outcome of the player's action based on game state, dice rolls, and stage context.
2. Include world/NPC reactions, ensuring NPCs behave according to their descriptions and relationship levels.
3. Provide new information, challenges, or opportunities relevant to the current stage.
4. End with a hook or question for the player's next action.
5. Ensure the narrative reflects the current stage context and goals.

IMPORTANT:
- Never use [DICE_CHECK] format in your response. Request rolls narratively.
- Always incorporate relevant NPCs from the available list if appropriate.
- Maintain consistent tone and language (${isChinese ? 'Chinese' : 'English'}).
- Reference key events or stage goals when relevant to the story.

ATTRIBUTE AND RELATIONSHIP UPDATES:
If the action or event directly causes attribute or relationship changes, list them clearly at the very end in this exact format (use only if changes occur):
[STATS]
Attribute changes: [attribute_name]+[value], [another_attribute]-[value]
Relationship changes: [npc_name]+[value], [another_npc_name]-[value]
[/STATS]

Keep your response engaging, dramatic, and typically 3-4 paragraphs long.`;

  return prompt;
}; 