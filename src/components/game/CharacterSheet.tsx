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
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-slate-500 dark:text-slate-400">No active game</p>
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
      <Card>
        <CardHeader>
          <CardTitle>{gameState.playerName}</CardTitle>
          <CardDescription>
            {Object.entries(gameState.playerCustomizations)
              .map(([key, value]) => value)
              .join(' • ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <p><span className="font-medium">Scenario:</span> {template.scenario}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Attributes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attributes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {Object.entries(template.attributes).map(([attrKey, attrName]) => (
            <div 
              key={attrKey}
              className="flex items-center p-2 rounded-md bg-slate-50 dark:bg-slate-800"
            >
              <div className="flex-grow">
                <div className="font-medium">{attrName}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Base: {gameState.attributes[attrKey] || 0}
                </div>
              </div>
              <div className="text-xl font-bold w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                {getModifier(gameState.attributes[attrKey] || 0)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(template.baseSkills).map(([skillId, skill]) => {
              // Get the attribute this skill is based on (try both attributeKey and attributeModifier)
              const attributeKey = skill.attributeKey || skill.attributeModifier || 'default';
              const attributeValue = gameState.attributes[attributeKey] || 0;
              
              return (
                <div 
                  key={skillId}
                  className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={() => handleRollDice(skillId)}
                >
                  <div>
                    <div className="font-medium">{skill.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {skill.description}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {attributeKey} {getModifier(attributeValue)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Dice Roller */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roll Dice</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <DiceRoller />
        </CardContent>
      </Card>
      
      {/* Relationships (if applicable) */}
      {gameState.relationships && Object.keys(gameState.relationships).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(gameState.relationships).map(([npcId, value]) => {
              // Calculate relationship level (0-100 scale)
              const level = Math.max(0, Math.min(100, value));
              const percentage = `${level}%`;
              
              // Determine color
              let color;
              if (level < 33) color = 'bg-red-500';
              else if (level < 66) color = 'bg-yellow-500';
              else color = 'bg-green-500';
              
              return (
                <div key={npcId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{npcId}</span>
                    <span>{level}/100</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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