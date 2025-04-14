'use client';

import React from 'react';
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
  
  // Calculate attribute modifiers
  const getModifier = (value: number) => {
    if (value >= 8) return "+2";
    if (value >= 6) return "+1";
    if (value >= 4) return "0";
    if (value >= 2) return "-1";
    return "-2";
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
        <CardContent>
          <div className="text-sm text-[var(--game-text-secondary)]">
            <p><span className="font-medium">Scenario:</span> {template.scenario}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Attributes */}
      <Card className="game-card">
        <CardHeader>
          <CardTitle className="text-base text-[var(--game-text-primary)]">Attributes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {Object.entries(template.attributes).map(([attrKey, attrDesc]) => (
            <div 
              key={attrKey}
              className="flex items-center p-2 rounded-md game-attribute"
            >
              <div className="flex-grow">
                <div className="font-medium text-[var(--game-text-primary)]">{attrKey}</div>
                <div className="text-sm text-[var(--game-text-secondary)]">
                  Base: {gameState.attributes[attrKey] || 0}
                </div>
              </div>
              <div className="text-xl font-bold w-10 h-10 flex items-center justify-center rounded-full bg-[var(--game-bg-accent)] text-white">
                {getModifier(gameState.attributes[attrKey] || 0)}
              </div>
            </div>
          ))}
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
              const level = Math.max(0, Math.min(100, value));
              const percentage = `${level}%`;
              
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
              
              return (
                <div key={npcId} className="space-y-2">
                  <div className="flex justify-between text-sm text-[var(--game-text-primary)]">
                    <span className="font-medium">{npcId}</span>
                    <span className="text-[var(--game-text-secondary)]">{status}</span>
                  </div>
                  <div className="h-2 bg-[var(--game-bg-secondary)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${color}`} 
                      style={{ width: percentage }}
                    />
                  </div>
                  {npcDescription && (
                    <p className="text-xs text-[var(--game-text-secondary)]">{npcDescription}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 