import { GameState, GameTemplate, GameHistoryEntry, StageDefinition } from '../../types/game';

/**
 * Builds a prompt for the AI based on the game state and player action
 * @param template The game template
 * @param state The current game state
 * @param playerAction The player's action
 * @param diceRoll Optional dice roll information
 * @param stageTransition Optional information about a stage transition that just occurred
 * @param forceEndingRequested Optional flag indicating player has requested to end the game
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
  },
  stageTransition?: {
    previousStageId: string;
    previousStageName: string;
    newStageId: string;
    newStageName: string;
    newStageDescription: string;
  },
  forceEndingRequested?: boolean
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
  // Enhanced visibility: Stage information is now prominently displayed at the top of the prompt
  // with additional emphasis to ensure the AI clearly incorporates stage context in all responses.
  let stageInfoText = "No stage information available.";
  
  // Stage transition notification text
  let stageTransitionText = "";

  // Overall game progression information
  let gameProgressionText = "";

  // Check if we have a forced ending request - this should work REGARDLESS of stage structure
  if (forceEndingRequested) {
    // Special ending message for games without proper stage structure
    stageInfoText = `PLAYER-REQUESTED ENDING
The player has explicitly requested to conclude the story.

FORCED ENDING REQUIRED:
Provide a satisfying conclusion to the story based on the current situation.
Create a believable and appropriate ending that:
1. Acknowledges the journey so far and major accomplishments
2. Provides closure to important relationships and plot threads
3. Gives a sense of what happens to the character after this point
4. Respects the player's desire to conclude the story now
5. Ends with "THE END" to signal the story's completion

The ending should reflect the player's current attributes, relationships, and situation.`;
  }

  if (template.stages) {
    // Format the overall stage progression information
    const stageIds = Object.keys(template.stages);
    if (stageIds.length > 0) {
      const currentStageIndex = stageIds.indexOf(state.currentStageId);
      const stageProgressList = stageIds.map((stageId, index) => {
        const stage = template.stages?.[stageId];
        if (!stage) return ` Unknown Stage`;
        
        const stageName = stage.name;
        let prefix = " ";
        if (stageId === state.currentStageId) {
          prefix = "→"; // Current stage indicator
        } else if (index < currentStageIndex) {
          prefix = "✓"; // Completed stage
        }
        return `${prefix} ${stageName}${stageId === stageIds[stageIds.length - 1] ? " (Final Stage)" : ""}`;
      }).join('\n');

      const progressPercentage = currentStageIndex >= 0 
        ? Math.round((currentStageIndex / (stageIds.length - 1)) * 100) 
        : 0;

      gameProgressionText = `Game Progression (${progressPercentage}% complete):
${stageProgressList}`;
    }
  }

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

    // Check if this is the final stage
    const stageIds = Object.keys(template.stages);
    const isFinalStage = state.currentStageId === stageIds[stageIds.length - 1];
    const allGoalsCompleted = currentStage.goals.every(goal => 
      completedGoalsForStage.includes(goal.id)
    );
    
    // Special handling for final stage with completed goals or forced ending
    if (forceEndingRequested) {
      // Player has explicitly requested to end the game (override earlier basic ending)
      stageInfoText = `PLAYER-REQUESTED ENDING (Current Stage: "${currentStage.name}")
The player has explicitly requested to conclude the story.
Stage Description: ${currentStage.description}
Current Goals:
${formattedGoals}

FORCED ENDING REQUIRED:
The player wishes to end the game at this point. Provide a satisfying conclusion based on their current situation.
Even though they haven't completed the full game, create a believable and appropriate ending that:
1. Acknowledges their journey so far and major accomplishments
2. Provides closure to important relationships and plot threads
3. Gives a sense of what happens to their character after this point
4. Respects their desire to conclude the story now
5. Ends with "THE END" to signal the story's completion

The ending should reflect the player's current attributes, relationships, and situation.`;
    } else if (isFinalStage && allGoalsCompleted) {
      stageInfoText = `FINAL STAGE: "${currentStage.name}" (ALL GOALS COMPLETED)
The player has completed all goals in the final stage and is ready for the story conclusion.
Stage Description: ${currentStage.description}
Completed Goals:
${formattedGoals}

STORY CONCLUSION REQUIRED:
As this is the final stage with all goals completed, your response should work toward bringing the story to a satisfying conclusion.
Create a sense of closure while honoring the player's choices and achievements throughout their journey.

Conclusion Guidelines:
1. Reflect on key decisions and accomplishments throughout all stages
2. Reference important relationships developed with NPCs
3. Highlight character growth based on attribute changes
4. Provide a sense of the character's future beyond the story
5. For games with >20 turns, create an epilogue summarizing long-term outcomes
6. End with a clear "THE END" marker to signal story completion

The player's attributes and relationships should influence the nature of the ending (e.g., high charisma might lead to a socially successful ending).`;
    } else if (isFinalStage && state.turn >= 30) {
      // Special handling for very long games in final stage, even if not all goals completed
      stageInfoText = `FINAL STAGE: "${currentStage.name}" (EXTENDED GAMEPLAY)
The player has been in the final stage for an extended time (${state.turn} turns).
Stage Description: ${currentStage.description}
Stage Goals:
${formattedGoals}

EXTENDED GAMEPLAY GUIDANCE:
As this game has continued for ${state.turn} turns, consider guiding it toward a natural conclusion.
The player may not complete all goals, but should still receive a satisfying ending.
Provide opportunities to resolve major plot threads and relationships.
If the player takes an action that could reasonably conclude the story, respond with an appropriate ending.`;
    } else {
      stageInfoText = `Current Stage: "${currentStage.name}"${isFinalStage ? " (FINAL STAGE)" : ""}
Stage Description: ${currentStage.description}
Stage Goals:
${formattedGoals}`;
    }

    // Add stage transition notification if provided
    if (stageTransition) {
      stageTransitionText = `
STAGE TRANSITION NOTICE:
The player has completed the "${stageTransition.previousStageName}" stage and is now entering the "${stageTransition.newStageName}" stage.

Required narrative elements for this transition:
1. Acknowledge their achievement in completing the previous stage
2. Introduce the concept and challenges of the new stage: ${stageTransition.newStageDescription}
3. Establish appropriate tension or excitement for this new phase
4. Highlight how the character's growth so far prepares them for new challenges

This transition should be treated as a significant narrative moment that marks clear progression in the story.
`;
    }
  }
  // --- End Stage Information Section ---

  // Build the complete prompt
  const prompt = `ROLE: Game master for "${state.scenario}" - Create an engaging narrative that responds to player actions.

LANGUAGE: ${languageInstruction} Match your tone to "${templateTitle}".
${forceEndingRequested ? `\n*** ENDING INSTRUCTION (CRITICAL) ***\nThis is the FINAL response in this conversation. The player has requested to END THE STORY.\nYour response MUST provide a satisfying conclusion and end with "THE END".\n` : ''}
${stageTransition ? `\n${stageTransitionText}` : ''}
CURRENT STAGE FOCUS:
${stageInfoText}
=== YOUR PRIMARY NARRATIVE CONTEXT ===
The player's experience should be strongly guided by the current stage description and goals.
All narration, challenges, and opportunities should align with and contribute to this stage context.

${gameProgressionText ? `OVERALL GAME PROGRESSION:\n${gameProgressionText}\n\n` : ''}
GAME STATE:
- Character: ${state.playerName}
- Customizations: ${formattedCustomizations}
- Attributes: ${formattedAttributes}
- Current scene: ${state.currentScene}
${activeSkills && Object.keys(activeSkills).length > 0 ? `- Active effects: ${formattedActiveSkills}\n` : ''}
${relationships && Object.keys(relationships).length > 0 ? `- Relationships: ${formattedRelationships}\n` : ''}
- Turn: ${state.turn}

${availableNPCs !== "None defined in template." ? `AVAILABLE NPCs:\n${availableNPCs}\n` : ''}

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
3. Stage Progression: The stage context is CRUCIAL. Your narrative MUST clearly reflect the current stage description, and explicitly acknowledge any progress toward stage goals. Connect the player's actions to their stage goals whenever possible.

RESPONSE REQUIREMENTS:
1. Start by acknowledging the CURRENT STAGE situation and relevant goals, stating the stage name and short concise description.
2. Narrate the outcome of the player's action based on game state, dice rolls, and stage context.
3. Include world/NPC reactions, ensuring NPCs behave according to their descriptions and relationship levels.
4. Provide new information, challenges, or opportunities DIRECTLY RELEVANT to current stage goals.
5. End with a hook or question for the player's next action that encourages progress in the current stage.

IMPORTANT:
- Always make it CRYSTAL CLEAR to the player which stage they are in and what goals they're working toward.
- Refer to stage goals explicitly when the player makes progress or faces relevant challenges.
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