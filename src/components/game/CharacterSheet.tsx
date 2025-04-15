'use client';

import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import DiceRoller from './DiceRoller';

export default function CharacterSheet() {
  const { gameState, template, rollDiceForSkill } = useGame();
  const [attributeChanges, setAttributeChanges] = useState<Record<string, number>>({});
  const [relationshipChanges, setRelationshipChanges] = useState<Record<string, number>>({});
  
  // Reset changes after 2 seconds
  useEffect(() => {
    if (Object.keys(attributeChanges).length > 0 || Object.keys(relationshipChanges).length > 0) {
      const timer = setTimeout(() => {
        setAttributeChanges({});
        setRelationshipChanges({});
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [attributeChanges, relationshipChanges]);
  
  // Update changes when gameState changes
  useEffect(() => {
    if (gameState?.history && gameState.history.length > 0) {
      const lastEntry = gameState.history[gameState.history.length - 1];
      
      // Extract stats changes from the result text
      const statsMatch = lastEntry.result.match(/\[STATS\]([\s\S]*?)\[\/STATS\]/);
      if (statsMatch) {
        const statsText = statsMatch[1];
        
        // Parse attribute changes
        const attributeMatch = statsText.match(/Attribute changes: (.*)/);
        if (attributeMatch) {
          const attributeChanges = attributeMatch[1].split(',').map(change => change.trim());
          const newAttributeChanges: Record<string, number> = {};
          attributeChanges.forEach(change => {
            const match = change.match(/([^+-]+)([+-])(\d+)/);
            if (match) {
              const [, attr, operator, value] = match;
              const attributeName = attr.trim().toLowerCase().replace(/\s+/g, '_');
              const changeValue = parseInt(value) * (operator === '+' ? 1 : -1);
              if (!isNaN(changeValue)) {
                newAttributeChanges[attributeName] = changeValue;
              }
            }
          });
          setAttributeChanges(newAttributeChanges);
        }
        
        // Parse relationship changes
        const relationshipMatch = statsText.match(/Relationship changes: (.*)/);
        if (relationshipMatch) {
          const relationshipChanges = relationshipMatch[1].split(',').map(change => change.trim());
          const newRelationshipChanges: Record<string, number> = {};
          relationshipChanges.forEach(change => {
            const match = change.match(/([^+-]+)([+-])(\d+)/);
            if (match) {
              const [, npc, operator, value] = match;
              const npcName = npc.trim();
              const changeValue = parseInt(value) * (operator === '+' ? 1 : -1);
              if (!isNaN(changeValue)) {
                newRelationshipChanges[npcName] = changeValue;
              }
            }
          });
          setRelationshipChanges(newRelationshipChanges);
        }
      }
    }
  }, [gameState]);
  
  if (!gameState || !template) {
    return (
      <Card className="game-card w-full">
        <CardContent className="p-6 text-center">
          <p className="text-[var(--game-text-secondary)]">No active game</p>
        </CardContent>
      </Card>
    );
  }
  
  const handleRollDice = async (skill: string) => {
    try {
      await rollDiceForSkill(skill);
    } catch (error) {
      console.error('Error rolling dice:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Character Info */}
      <Card className="game-card">
        <CardHeader>
          <CardTitle className="text-[var(--game-text-primary)]">{gameState.playerName}</CardTitle>
          <CardDescription className="text-[var(--game-text-secondary)]">
            {Object.entries(gameState.playerCustomizations)
              .map(([key, value]) => value)
              .join(' • ')}
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Attributes */}
      <Card className="game-card">
        <CardHeader>
          <CardTitle className="text-base text-[var(--game-text-primary)]">Attributes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {Object.entries(template.attributes).map(([attrKey, attrDesc]) => {
            const baseValue = 5;
            
            // Calculate modifier from customizations
            let modifier = 0;
            Object.entries(gameState.playerCustomizations).forEach(([customKey, selectedOption]) => {
              const customization = template.playerCustomizations[customKey];
              if (customization?.impact?.[selectedOption]?.[attrKey]) {
                modifier += customization.impact[selectedOption][attrKey];
              }
            });
            
            // Get current value from game state
            const currentValue = gameState.attributes[attrKey] || 0;
            const change = attributeChanges[attrKey];
            const totalValue = currentValue;
            
            return (
              <div 
                key={attrKey}
                className="flex items-center p-2 rounded-md game-attribute relative"
              >
                <div className="flex-grow">
                  <div className="font-medium text-[var(--game-text-primary)]">{attrKey}</div>
                  <div className="text-sm text-[var(--game-text-secondary)]">
                    <p>Base: {baseValue}</p>
                    <p>Modifier: {modifier >= 0 ? '+' : ''}{modifier}</p>
                    
                  </div>
                </div>
                <div className="text-xl font-bold w-10 h-10 flex items-center justify-center rounded-full bg-[var(--game-bg-accent)] text-white relative">
                  {totalValue}
                  {change !== undefined && (
                    <div className={`absolute -top-2 -right-2 text-xs font-bold px-1 rounded-full ${
                      change != 0 ? 'bg-green-500' : 'bg-red-500'
                    } text-white animate-bounce`}>
                      {change > 0 ? '+' : ''}{change}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      {/* Relationships (if applicable) */}
      {gameState.relationships && Object.keys(gameState.relationships).length > 0 && (
        <Card className="game-card">
          <CardHeader>
            <CardTitle className="text-base text-[var(--game-text-primary)]">Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(gameState.relationships).map(([npcId, value]) => {
              // Find NPC description from template
              const npcDescription = template.npcs ? 
                Object.values(template.npcs)
                  .flat()
                  .find(npc => npc.name === npcId)?.description || '' : '';
              
              // Calculate relationship level (0-100 scale)
              const level = Math.max(-100, Math.min(100, value));
              const percentage = `${Math.abs(level)}%`;
              
              // Determine relationship status and color
              let status = 'Neutral';
              let color = 'bg-[var(--game-mint)]';
              
              if (level >= 75) {
                status = 'Very Positive';
                color = 'bg-[var(--game-button-primary)]';
              } else if (level >= 25) {
                status = 'Positive';
                color = 'bg-[var(--game-button-primary)] opacity-75';
              } else if (level <= -75) {
                status = 'Very Negative';
                color = 'bg-red-500';
              } else if (level <= -25) {
                status = 'Negative';
                color = 'bg-red-500 opacity-75';
              }
              
              const change = relationshipChanges[npcId];
              
              return (
                <div key={npcId} className="space-y-2">
                  <div className="flex justify-between text-sm text-[var(--game-text-primary)]">
                    <span className="font-medium">{npcId}</span>
                    <span className="text-[var(--game-text-secondary)]">
                      (val:{level}): {status}
                      {change !== undefined && (
                        <span className={`ml-2 px-1 rounded-full text-xs ${
                          change > 0 ? 'bg-green-500' : 'bg-red-500'
                        } text-white animate-bounce`}>
                          {change > 0 ? '+' : ''}{change}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--game-bg-secondary)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${color}`} 
                      style={{ width: percentage }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 