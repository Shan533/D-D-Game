'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DiceRoller, { SingleDice, TripleDice } from '@/components/game/DiceRoller';
import { StageGoal } from '@/types/game'; // Import StageGoal type

// Function to remove [STATS] blocks from AI responses
const cleanResponse = (response: string): string => {
  return response.replace(/\[STATS\][\s\S]*?\[\/STATS\]/g, '');
};

export default function ChatInterface() {
  const [action, setAction] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showDice, setShowDice] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSkillsPanel, setShowSkillsPanel] = useState(false);
  const [diceValues, setDiceValues] = useState<number[] | null>(null);
  const [showDiceHistory, setShowDiceHistory] = useState(true);  // Controls whether to show dice results
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    gameState, 
    template, 
    aiResponse, 
    diceResult, 
    performAction, 
    loading,
    clearDiceResult  // Get the clearDiceResult function from context
  } = useGame();
  
  // Typing effect for AI responses
  useEffect(() => {
    if (!aiResponse) return;
    
    // Clean the AI response to remove [STATS] blocks
    const cleanedResponse = cleanResponse(aiResponse);
    
    let currentText = '';
    let currentIndex = 0;
    setIsTyping(true);
    
    // Start with empty text
    setDisplayedText('');
    
    // Add characters one by one with a slight delay
    const typingInterval = setInterval(() => {
      if (currentIndex < cleanedResponse.length) {
        currentText += cleanedResponse[currentIndex];
        setDisplayedText(currentText);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 20); // adjust the speed here (lower = faster)
    
    return () => {
      clearInterval(typingInterval);
    };
  }, [aiResponse]);
  
  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedText]);
  
  // Get available skills from the template with attribute values
  const availableSkills = template && gameState ? 
    Object.entries(template.baseSkills).map(([id, skill]) => {
      const attrKey = skill.attributeKey || skill.attributeModifier || 'default';
      const attrValue = gameState.attributes[attrKey] || 0;
      
      return {
        id,
        name: skill.name,
        description: skill.description,
        attributeKey: attrKey,
        attributeName: template.attributes[attrKey] || attrKey,
        attributeValue: attrValue
      };
    }) : [];
  
  // Get attribute badge color
  const getAttributeBadgeColors = (attributeKey: string) => {
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-800'
    };
  };
  
  // UseEffect to clear dice result after a new response
  useEffect(() => {
    if (aiResponse) {
      // Hide previous dice results when a new response is received
      setShowDiceHistory(false);
    }
  }, [aiResponse]);

  // Show dice history again when user starts a new action
  useEffect(() => {
    if (action.trim() || selectedSkill) {
      setShowDiceHistory(true);
    }
  }, [action, selectedSkill]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!action.trim() || isTyping) return;
    
    try {
      // Clear any previous dice results before submitting a new action
      if (!showDice || !diceValues) {
        clearDiceResult();
      }
      
      // Pass the selectedSkill to performAction so it can apply attribute modifiers
      await performAction(action, diceValues || undefined, selectedSkill || undefined);
      setAction('');
      setSelectedSkill(null);
      setShowDice(false);
      setDiceValues(null);
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };
  
  const handleSkillSelect = (skillId: string) => {
    if (selectedSkill === skillId) {
      setSelectedSkill(null);
    } else {
      setSelectedSkill(skillId);
      setShowDice(true);
      setShowSkillsPanel(false);
    }
  };
  
  const handleDiceRoll = (values: number[]) => {
    setDiceValues(values);
  };
  
  const skipTypingEffect = () => {
    if (isTyping && aiResponse) {
      // Clean the response when skipping the typing effect too
      setDisplayedText(cleanResponse(aiResponse));
      setIsTyping(false);
    }
  };
  
  // Scroll to bottom utility function
  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Render error if no gameState or template
  if (!gameState || !template) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-red-500">Game state not initialized properly.</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat display area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {/* Initial game start message */}
        <div className="bg-[var(--game-mint-light)] p-4 rounded-lg border border-[var(--game-mint)]">
          <p className="font-medium text-[var(--game-text-accent)]">Game Start: {template.scenario}</p>
          <p className="mt-2 text-[var(--game-text-primary)]">{template.startingPoint}</p>
        </div>

        {/* Display Current Stage Information */}
        {template.stages && gameState.currentStageId && template.stages[gameState.currentStageId] && (
          <div className="bg-[var(--game-bg-secondary)] p-4 rounded-lg border border-[var(--game-bg-accent)] text-sm">
            <p className="font-semibold text-[var(--game-text-primary)] mb-2">Current Stage: {template.stages[gameState.currentStageId].name}</p>
            <p className="text-[var(--game-text-secondary)] mb-3 italic">{template.stages[gameState.currentStageId].description}</p>
            <p className="font-medium text-[var(--game-text-primary)] mb-1">Goals:</p>
            <ul className="list-disc list-inside space-y-1 text-[var(--game-text-secondary)]">
              {template.stages[gameState.currentStageId].goals.map((goal: StageGoal) => { // Add type StageGoal
                const isCompleted = gameState.completedGoals[gameState.currentStageId]?.includes(goal.id);
                return (
                  <li key={goal.id} className={`${isCompleted ? 'line-through text-green-600' : ''}`}>
                    {goal.name} {isCompleted ? '(Completed)' : '(Pending)'}: {goal.description}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* AI Response with typing effect */}
        {aiResponse && (
          <div 
            className="game-message p-4 rounded-lg relative"
            onClick={skipTypingEffect}
          >
            <p className="whitespace-pre-line text-[var(--game-text-primary)]">{displayedText}</p>
            {isTyping && (
              <span className="inline-block w-2 h-4 bg-[var(--game-text-secondary)] ml-1 animate-pulse"></span>
            )}
          </div>
        )}
        
        {/* Dice roll result - Only shown if showDiceHistory is true */}
        {diceResult && showDiceHistory && (
          <div className="bg-[var(--game-bg-secondary)] p-4 rounded-lg border border-[var(--game-bg-accent)]">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="font-medium text-[var(--game-text-primary)] flex flex-wrap items-center">
                  <span>Dice Roll: [{diceResult.values.join(', ')}]</span>
                  {diceResult.isMatch ? (
                    <span className="text-pink-500 ml-2 font-bold animate-pulse">
                      Match! {diceResult.specialEvent?.name || `Triple ${diceResult.matchedValue}s`}
                    </span>
                  ) : (
                    <>
                      <span className="mx-2">Sum: {diceResult.sum}</span>
                      {diceResult.modifier !== 0 && diceResult.attributeKey && (
                        <span>
                          + <span className="text-green-500 font-medium">{diceResult.modifier}</span> 
                          <span className="text-xs ml-1">
                            (from {diceResult.attributeKey}: {diceResult.attributeValue})
                          </span> 
                          = <span className="font-bold">{diceResult.total}</span>
                        </span>
                      )}
                      {diceResult.success !== undefined && (
                        <span className={diceResult.success ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                          {diceResult.success ? "Success!" : "Failure!"}
                        </span>
                      )}
                    </>
                  )}
                </p>
                {diceResult.isMatch && diceResult.specialEvent && (
                  <p className="text-sm text-[var(--game-text-secondary)] mt-1">
                    {diceResult.specialEvent.description}
                  </p>
                )}
                {/* Show attribute modifier explanation */}
                {diceResult.modifier !== 0 && !diceResult.isMatch && (
                  <p className="text-xs text-[var(--game-text-secondary)] mt-1">
                    Every 5 points in {diceResult.attributeKey} provides a +1 modifier to your roll.
                  </p>
                )}
              </div>
              <Button 
                onClick={() => setShowDiceHistory(false)} 
                size="sm" 
                variant="ghost" 
                className="text-[var(--game-text-secondary)] hover:text-[var(--game-text-primary)]"
              >
                Hide
              </Button>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="bg-[var(--game-bg-secondary)] p-4 rounded-lg animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-[var(--game-bg-accent)] rounded-full animate-bounce"></div>
              <div className="h-3 w-3 bg-[var(--game-bg-accent)] rounded-full animate-bounce delay-100"></div>
              <div className="h-3 w-3 bg-[var(--game-bg-accent)] rounded-full animate-bounce delay-200"></div>
              <p className="text-sm text-[var(--game-text-secondary)]">Thinking...</p>
            </div>
          </div>
        )}
        
        {/* Game Ending Message */}
        {gameState.isGameEnded && (
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-lg border border-purple-700 shadow-lg text-center">
                <p className="text-2xl font-bold text-white mb-2">Game Over</p>
                <p className="text-lg text-purple-100">{gameState.gameEnding || "The story concludes."}</p>
            </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={chatEndRef} />
      </div>
      
      {/* Action input area */}
      <div className="border-t border-[var(--game-divider)] p-4">
        <div className="flex mb-2">
          <button
            type="button"
            className={`game-tab flex-1 ${!showSkillsPanel ? 'game-tab-active' : ''}`}
            onClick={() => setShowSkillsPanel(false)}
            aria-selected={!showSkillsPanel}
            role="tab"
            aria-controls="action-panel"
            id="action-tab"
          >
            Action
          </button>
          <button
            type="button"
            className={`game-tab flex-1 ${showSkillsPanel ? 'game-tab-active' : ''}`}
            onClick={() => setShowSkillsPanel(true)}
            aria-selected={showSkillsPanel}
            role="tab"
            aria-controls="skills-panel"
            id="skills-tab"
          >
            Skills
          </button>
        </div>

        <div className="w-full transition-all duration-300">
          {showSkillsPanel ? (
            <div id="skills-panel" role="tabpanel" aria-labelledby="skills-tab">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                {availableSkills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => handleSkillSelect(skill.id)}
                    disabled={isTyping || gameState.isGameEnded} // Disable on game end
                    className={`p-4 rounded-lg text-left transition-all duration-300 border-2 ${
                      selectedSkill === skill.id
                        ? 'bg-[var(--game-mint-light)] border-[var(--game-button-primary)] text-[var(--game-text-accent)] shadow-sm'
                        : 'bg-[var(--game-bg-secondary)] border-transparent hover:bg-[var(--game-bg-accent)] hover:border-[var(--game-divider)] text-[var(--game-text-primary)]'
                    } ${(isTyping || gameState.isGameEnded) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-sm">{skill.name}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getAttributeBadgeColors(skill.attributeKey).bg} ${getAttributeBadgeColors(skill.attributeKey).text}`}>
                        {skill.attributeKey}: {skill.attributeValue}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--game-text-secondary)] mb-2">{skill.description}</p>
                  </button>
                ))}
              </div>
              {selectedSkill && (
                <div className="mt-4 p-3 bg-[var(--game-bg-secondary)] rounded-lg border border-[var(--game-divider)] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center w-full sm:w-auto">
                    <input
                      type="checkbox"
                      id="useDice"
                      checked={showDice}
                      onChange={(e) => setShowDice(e.target.checked)}
                      disabled={isTyping || gameState.isGameEnded} // Disable on game end
                      className="w-5 h-5 mr-3 accent-[var(--game-button-primary)] cursor-pointer transition-all duration-200"
                    />
                    <label htmlFor="useDice" className="text-sm text-[var(--game-text-primary)] font-medium cursor-pointer">
                      Roll dice for this skill
                    </label>
                  </div>
                  {showDice && (
                    diceValues ? 
                    <div className="flex items-center">
                      <div className="flex space-x-1">
                        {diceValues.map((value, index) => (
                          <SingleDice key={index} value={value} size="sm" animate={false} />
                        ))}
                      </div>
                      <Button 
                        onClick={() => setDiceValues(null)} 
                        size="sm" 
                        className="ml-2 !bg-[var(--game-bg-primary)] !text-[var(--game-mint-dark)] hover:!bg-[var(--game-card-bg)]"
                        disabled={gameState.isGameEnded} // Disable on game end
                      >
                        Reset
                      </Button>
                    </div>
                    : 
                    <div className="flex items-center">
                      <DiceRoller 
                        onRoll={handleDiceRoll} 
                        className="scale-50 origin-left"
                        specialEvents={template?.specialDiceEvents}
                      />
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between mt-4">
                <Button
                  type="button"
                  className="!bg-[var(--game-bg-primary)] !text-[var(--game-mint-dark)] hover:!bg-[var(--game-card-bg)] flex-1 mr-2"
                  onClick={() => {
                    setSelectedSkill(null);
                    setShowDice(false);
                  }}
                  disabled={!selectedSkill || gameState.isGameEnded} // Disable on game end
                >
                  Clear
                </Button>
                <Button
                  type="button" 
                  className="game-button-primary flex-1 ml-2"
                  onClick={() => setShowSkillsPanel(false)}
                  disabled={isTyping || gameState.isGameEnded} // Disable on game end
                >
                  {selectedSkill ? 'Apply Skill' : 'Back to Action'}
                </Button>
              </div>
            </div>
          ) : (
            <div id="action-panel" role="tabpanel" aria-labelledby="action-tab">
              <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                <Input
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder={selectedSkill ? `What do you want to do with ${availableSkills.find(s => s.id === selectedSkill)?.name}?` : "What do you want to do?"}
                  className="game-input w-full border-0 shadow-none focus:ring-0"
                  disabled={loading || isTyping || gameState.isGameEnded} // Disable on game end
                />
                <Button 
                  type="submit" 
                  className="game-button-primary w-full py-2" 
                  disabled={loading || !action.trim() || isTyping || gameState.isGameEnded} // Disable on game end
                >
                  {loading ? 'Sending...' : 'Send'}
                </Button>
              </form>
              
              {selectedSkill && (
                <div className="mt-3 p-3 bg-[var(--game-mint-light)] rounded-lg border-2 border-[var(--game-mint)] flex flex-col gap-2 transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-[var(--game-text-accent)]">
                        Using skill: {availableSkills.find(s => s.id === selectedSkill)?.name}
                      </span>
                      {selectedSkill && (
                        <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                          getAttributeBadgeColors(availableSkills.find(s => s.id === selectedSkill)?.attributeKey || 'default').bg
                        } ${
                          getAttributeBadgeColors(availableSkills.find(s => s.id === selectedSkill)?.attributeKey || 'default').text
                        }`}>
                          {availableSkills.find(s => s.id === selectedSkill)?.attributeKey}: {availableSkills.find(s => s.id === selectedSkill)?.attributeValue}
                        </span>
                      )}
                    </div>
                    <Button
                      className="!bg-[var(--game-bg-primary)] !text-[var(--game-mint-dark)] hover:!bg-[var(--game-card-bg)]"
                      size="sm"
                      onClick={() => {
                        setSelectedSkill(null);
                        setShowDice(false);
                        setDiceValues(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                  
                  <p className="text-xs text-[var(--game-text-secondary)]">
                    {availableSkills.find(s => s.id === selectedSkill)?.description}
                  </p>
                  
                  <div className="flex justify-between items-center mt-1">
                    {showDice && (
                      <div className="flex items-center justify-between p-2 bg-[var(--game-bg-secondary)] rounded-md flex-1 mr-2">
                        <span className="text-xs text-[var(--game-text-primary)]">
                          {diceValues ? `Rolled: ${diceValues.join(', ')}` : 'Roll dice:'}
                        </span>
                        {diceValues ? 
                          <div className="flex items-center">
                            <div className="flex space-x-1">
                              {diceValues.map((value, index) => (
                                <SingleDice key={index} value={value} size="sm" animate={false} />
                              ))}
                            </div>
                            <Button 
                              onClick={() => setDiceValues(null)} 
                              size="sm" 
                              className="ml-2 !bg-[var(--game-bg-primary)] !text-[var(--game-mint-dark)] hover:!bg-[var(--game-card-bg)]"
                              disabled={gameState.isGameEnded} // Disable on game end
                            >
                              Reset
                            </Button>
                          </div>
                          : 
                          <div className="flex items-center">
                            <DiceRoller 
                              onRoll={handleDiceRoll} 
                              className="scale-70 origin-left"
                              specialEvents={template?.specialDiceEvents}
                            />
                          </div>
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 