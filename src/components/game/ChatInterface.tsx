'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DiceRoller, { Dice } from '@/components/game/DiceRoller';

export default function ChatInterface() {
  const [action, setAction] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showDice, setShowDice] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSkillsPanel, setShowSkillsPanel] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    gameState, 
    template, 
    aiResponse, 
    diceResult, 
    performAction, 
    loading 
  } = useGame();
  
  // Typing effect for AI responses
  useEffect(() => {
    if (!aiResponse) return;
    
    let currentText = '';
    let currentIndex = 0;
    setIsTyping(true);
    
    // Start with empty text
    setDisplayedText('');
    
    // Add characters one by one with a slight delay
    const typingInterval = setInterval(() => {
      if (currentIndex < aiResponse.length) {
        currentText += aiResponse[currentIndex];
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
  
  // Get attribute badge color based on attribute key
  const getAttributeBadgeColors = (attributeKey: string) => {
    const colorMap: Record<string, { bg: string, text: string }> = {
      // Academic attributes
      'intelligence': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'academic_pressure': { bg: 'bg-blue-100', text: 'text-blue-800' },
      
      // Creative attributes
      'creativity': { bg: 'bg-purple-100', text: 'text-purple-800' },
      
      // Social attributes
      'social_engineering': { bg: 'bg-pink-100', text: 'text-pink-800' },
      
      // Discipline attributes
      'tiger_discipline': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'conformity': { bg: 'bg-orange-100', text: 'text-orange-800' },
      
      // Emotional attributes
      'emotional_tactics': { bg: 'bg-red-100', text: 'text-red-800' },
      
      // Resource attributes
      'resource_management': { bg: 'bg-green-100', text: 'text-green-800' },
      
      // Honor attributes
      'family_honor': { bg: 'bg-amber-100', text: 'text-amber-800' },
      
      // Rebellion attributes
      'rebellion': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      
      // Default
      'default': { bg: 'bg-slate-100', text: 'text-slate-800' }
    };
    
    return colorMap[attributeKey] || colorMap['default'];
  };
  
  // TODO: Add logic for the success chance.
  // Calculate success chance based on attribute value (similar to D20 roll)
  const calculateSuccessChance = (attributeValue: number): number => {
    // Base 50% chance + 5% per attribute point
    const chance = 50 + attributeValue * 5;
    // Cap between 5% and 95%
    return Math.min(95, Math.max(5, chance));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!action.trim() || isTyping) return;
    
    try {
      await performAction(action, selectedSkill || undefined, showDice);
      setAction('');
      setSelectedSkill(null);
      setShowDice(false);
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };
  
  const handleSkillSelect = (skillId: string) => {
    if (selectedSkill === skillId) {
      setSelectedSkill(null);
    } else {
      setSelectedSkill(skillId);
      // TODO: Add dice roll to skill, 老虎机pop up， use DiceRoller.tsx
      setShowDice(true);
      setShowSkillsPanel(false);
    }
  };
  
  const skipTypingEffect = () => {
    if (isTyping && aiResponse) {
      setDisplayedText(aiResponse);
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
        
        {/* Dice roll result */}
        {diceResult && (
          <div className="bg-[var(--game-bg-secondary)] p-4 rounded-lg border border-[var(--game-bg-accent)]">
            <p className="font-medium text-[var(--game-text-primary)]">
              Dice Roll: {diceResult.roll} + {diceResult.modifier} = {diceResult.total}
              {diceResult.success !== undefined && (
                <span className={diceResult.success ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                  {diceResult.success ? "Success!" : "Failure!"}
                </span>
              )}
            </p>
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
                    disabled={isTyping}
                    className={`p-4 rounded-lg text-left transition-all duration-300 border-2 ${
                      selectedSkill === skill.id
                        ? 'bg-[var(--game-mint-light)] border-[var(--game-button-primary)] text-[var(--game-text-accent)] shadow-sm'
                        : 'bg-[var(--game-bg-secondary)] border-transparent hover:bg-[var(--game-bg-accent)] hover:border-[var(--game-divider)] text-[var(--game-text-primary)]'
                    } ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-sm">{skill.name}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getAttributeBadgeColors(skill.attributeKey).bg} ${getAttributeBadgeColors(skill.attributeKey).text}`}>
                        {skill.attributeName}: {skill.attributeValue}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--game-text-secondary)] mb-2">{skill.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--game-text-secondary)]">Success chance:</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        {calculateSuccessChance(skill.attributeValue)}%
                      </span>
                    </div>
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
                      disabled={isTyping}
                      className="w-5 h-5 mr-3 accent-[var(--game-button-primary)] cursor-pointer transition-all duration-200"
                    />
                    <label htmlFor="useDice" className="text-sm text-[var(--game-text-primary)] font-medium cursor-pointer">
                      Roll dice for this skill
                    </label>
                  </div>
                  {showDice && <Dice animate={false} size="sm" />}
                </div>
              )}
              
              <div className="flex justify-between mt-4">
                <Button
                  type="button"
                  className="bg-[var(--game-bg-secondary)] hover:bg-[var(--game-bg-accent)] text-[var(--game-text-primary)] transition-all duration-200 flex-1 mr-2"
                  onClick={() => {
                    setSelectedSkill(null);
                    setShowDice(false);
                  }}
                  disabled={!selectedSkill}
                >
                  Clear
                </Button>
                <Button
                  type="button" 
                  className="game-button-primary flex-1 ml-2"
                  onClick={() => setShowSkillsPanel(false)}
                  disabled={isTyping}
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
                  disabled={loading || isTyping}
                />
                <Button 
                  type="submit" 
                  className="game-button-primary w-full py-2" 
                  disabled={loading || !action.trim() || isTyping}
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
                          {availableSkills.find(s => s.id === selectedSkill)?.attributeName}: {availableSkills.find(s => s.id === selectedSkill)?.attributeValue}
                        </span>
                      )}
                    </div>
                    <Button
                      className="bg-[var(--game-button-secondary)] hover:bg-[var(--game-button-secondary-hover)] text-white transition-all duration-300 px-3"
                      size="sm"
                      onClick={() => {
                        setSelectedSkill(null);
                        setShowDice(false);
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
                        <span className="text-xs text-[var(--game-text-primary)]">Using dice roll</span>
                        <Dice animate={false} size="sm" />
                      </div>
                    )}
                    
                    <div className="flex items-center p-2 bg-[var(--game-bg-secondary)] rounded-md flex-1 ml-2">
                      <span className="text-xs text-[var(--game-text-primary)] mr-2">Success chance:</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        {calculateSuccessChance(availableSkills.find(s => s.id === selectedSkill)?.attributeValue || 0)}%
                      </span>
                    </div>
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