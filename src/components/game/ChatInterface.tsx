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
  const chatEndRef = useRef<HTMLDivElement>(null);
  
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
  
  // Scroll to the bottom of the chat when new characters are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedText]);
  
  // Get available skills from the template
  const availableSkills = template ? 
    Object.entries(template.baseSkills).map(([id, skill]) => ({
      id,
      name: skill.name,
      description: skill.description,
      attributeKey: skill.attributeKey || skill.attributeModifier || 'default'
    })) : [];
  
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
      setShowDice(true);
    }
  };
  
  const skipTypingEffect = () => {
    if (isTyping && aiResponse) {
      setDisplayedText(aiResponse);
      setIsTyping(false);
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
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="font-medium">Game Start: {template.scenario}</p>
          <p className="mt-2">{template.startingPoint}</p>
        </div>
        
        {/* AI Response with typing effect */}
        {aiResponse && (
          <div 
            className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg relative"
            onClick={skipTypingEffect}
          >
            <p className="whitespace-pre-line">{displayedText}</p>
            {isTyping && (
              <span className="inline-block w-2 h-4 bg-slate-700 dark:bg-slate-300 ml-1 animate-pulse"></span>
            )}
          </div>
        )}
        
        {/* Dice roll result */}
        {diceResult && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="font-medium">
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
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce"></div>
              <div className="h-3 w-3 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce delay-100"></div>
              <div className="h-3 w-3 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce delay-200"></div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Thinking...</p>
            </div>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={chatEndRef} />
      </div>
      
      {/* Action input area */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <Tabs defaultValue="action" className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="action">Action</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>
          <TabsContent value="action" className="p-2">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="What do you want to do?"
                className="flex-grow"
                disabled={loading || isTyping}
              />
              <Button type="submit" disabled={loading || !action.trim() || isTyping}>
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </form>
            
            {selectedSkill && (
              <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-md flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">
                    Using skill: {availableSkills.find(s => s.id === selectedSkill)?.name}
                  </span>
                  {showDice && <span className="ml-2 text-sm">with dice roll</span>}
                </div>
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedSkill(null);
                    setShowDice(false);
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="skills" className="p-2">
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {availableSkills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => handleSkillSelect(skill.id)}
                  disabled={isTyping}
                  className={`p-2 rounded-md text-left transition-colors ${
                    selectedSkill === skill.id
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500'
                      : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                  } ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <p className="font-medium text-sm">{skill.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{skill.description}</p>
                </button>
              ))}
            </div>
            {selectedSkill && (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useDice"
                    checked={showDice}
                    onChange={(e) => setShowDice(e.target.checked)}
                    disabled={isTyping}
                    className="mr-2"
                  />
                  <label htmlFor="useDice" className="text-sm">
                    Roll dice for this skill
                  </label>
                </div>
                {showDice && <Dice animate={false} size="sm" />}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 