'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DiceProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  value?: number;
  onRollComplete?: (value: number) => void;
}

export function Dice({ 
  size = 'md', 
  animate = true,
  value: initialValue,
  onRollComplete
}: DiceProps) {
  const [rolling, setRolling] = useState(false);
  const [value, setValue] = useState(initialValue || 1);
  const [faces, setFaces] = useState<number[]>([]);
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-lg',
    lg: 'h-16 w-16 text-2xl'
  };
  
  useEffect(() => {
    if (initialValue && initialValue >= 1 && initialValue <= 20) {
      setValue(initialValue);
    }
  }, [initialValue]);
  
  const rollDice = () => {
    if (rolling) return;
    
    setRolling(true);
    
    // Generate a sequence of random faces for animation
    const rollSequence: number[] = [];
    const rollDuration = 1000; // 1 second
    const framesPerSecond = 12;
    const totalFrames = rollDuration / (1000 / framesPerSecond);
    
    for (let i = 0; i < totalFrames; i++) {
      rollSequence.push(Math.floor(Math.random() * 20) + 1);
    }
    
    // Add the final value
    const finalValue = Math.floor(Math.random() * 20) + 1;
    rollSequence.push(finalValue);
    
    setFaces(rollSequence);
    
    // Schedule updates to show animation
    let frame = 0;
    const animateRoll = () => {
      if (frame < rollSequence.length) {
        setValue(rollSequence[frame]);
        frame++;
        setTimeout(animateRoll, 1000 / framesPerSecond);
      } else {
        setRolling(false);
        onRollComplete?.(finalValue);
      }
    };
    
    animateRoll();
  };
  
  return (
    <button
      className={cn(
        'bg-indigo-600 text-white font-bold flex items-center justify-center rounded-md transition-transform',
        rolling && 'animate-bounce',
        sizeClasses[size]
      )}
      onClick={animate ? rollDice : undefined}
      disabled={rolling}
    >
      {value}
    </button>
  );
}

interface DiceRollerProps {
  onRoll?: (result: number) => void;
  className?: string;
}

export default function DiceRoller({ onRoll, className }: DiceRollerProps) {
  const [result, setResult] = useState<number | null>(null);
  
  const handleRollComplete = (value: number) => {
    setResult(value);
    onRoll?.(value);
  };
  
  return (
    <div className={cn('flex flex-col items-center space-y-3', className)}>
      <Dice size="lg" onRollComplete={handleRollComplete} />
      
      {result !== null && (
        <div className="text-center">
          <div className="text-2xl font-bold">{result}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {result === 20 ? 'Critical Success!' : result === 1 ? 'Critical Failure!' : ''}
          </div>
        </div>
      )}
    </div>
  );
} 