'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SingleDiceProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  value?: number;
  maxValue?: number;
  onRollComplete?: (value: number) => void;
  delay?: number;
}

export function SingleDice({ 
  size = 'md', 
  animate = true,
  value: initialValue,
  maxValue = 2, // Now using 6-sided dice by default
  onRollComplete,
  delay = 0
}: SingleDiceProps) {
  const [rolling, setRolling] = useState(false);
  const [value, setValue] = useState(initialValue || 1);
  
  const sizeClasses = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-14 w-14 text-lg',
    lg: 'h-20 w-20 text-3xl'
  };
  
  // Colors for dice faces to match the game theme
  const diceColors = {
    1: 'bg-[var(--game-mint)]',
    2: 'bg-[var(--game-mint-dark)]',
    3: 'bg-[var(--game-button-primary)]',
    4: 'bg-[var(--game-button-secondary)]',
    5: 'bg-[var(--game-mint-light)]',
    6: 'bg-[var(--game-text-accent)]'
  };
  
  useEffect(() => {
    if (initialValue && initialValue >= 1 && initialValue <= maxValue) {
      setValue(initialValue);
    }
  }, [initialValue, maxValue]);
  
  const rollDice = () => {
    if (rolling) return;
    
    setRolling(true);
    
    // Delay the start of rolling based on the prop
    setTimeout(() => {
      // Generate a sequence of random faces for animation
      const rollSequence: number[] = [];
      const rollDuration = 1500; // longer duration for more dramatic effect
      const framesPerSecond = 15;
      const totalFrames = rollDuration / (1000 / framesPerSecond);
      
      // Start with faster cycling, then slow down
      for (let i = 0; i < totalFrames; i++) {
        // Add more randomness at the beginning, gradually reducing to show "slowing down"
        if (i < totalFrames * 0.7) {
          // Fast spinning
          rollSequence.push(Math.floor(Math.random() * maxValue) + 1);
        } else {
          // Slow down gradually - repeat numbers more frequently
          const slowingFactor = Math.floor((i - totalFrames * 0.7) / 2) + 1;
          const slowValue = Math.floor(Math.random() * maxValue) + 1;
          for (let j = 0; j < slowingFactor && rollSequence.length < totalFrames; j++) {
            rollSequence.push(slowValue);
          }
        }
      }
      
      // Add the final value
      const finalValue = Math.floor(Math.random() * maxValue) + 1;
      
      // Schedule updates to show animation
      let frame = 0;
      const animateRoll = () => {
        if (frame < rollSequence.length) {
          setValue(rollSequence[frame]);
          frame++;
          const frameDelay = frame < rollSequence.length * 0.7 
            ? 1000 / framesPerSecond  // Fast at first
            : (1000 / framesPerSecond) * (1 + (frame - rollSequence.length * 0.7) / 5); // Then slow down
          setTimeout(animateRoll, frameDelay);
        } else {
          setValue(finalValue);
          setRolling(false);
          onRollComplete?.(finalValue);
        }
      };
      
      animateRoll();
    }, delay);
  };
  
  // Define the dice symbols (themed symbols that match the game aesthetic)
  const getDiceSymbol = (val: number) => {
    switch(val) {
      case 1: return '★'; // Star
      case 2: return '◆'; // Diamond
      case 3: return '✦'; // Four-pointed star
      case 4: return '❋'; // Flower
      case 5: return '✧'; // White star
      case 6: return '✤'; // Four petalled outlined flower
      default: return val.toString();
    }
  };
  
  return (
    <div 
      className={cn(
        'relative cursor-pointer overflow-hidden', 
        sizeClasses[size]
      )}
      onClick={animate ? rollDice : undefined}
      data-single-dice
    >
      {/* Reel background */}
      <div className="absolute inset-0 bg-[var(--game-bg-primary)] border border-[var(--game-divider)] rounded-md overflow-hidden shadow-inner">
        {/* Top shadow gradient to simulate a reel */}
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-[var(--game-bg-secondary)] to-transparent opacity-30 z-10"></div>
        {/* Bottom shadow gradient to simulate a reel */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-[var(--game-bg-secondary)] to-transparent opacity-30 z-10"></div>
      </div>
      
      {/* The actual dice value */}
      <div 
        className={cn(
          'absolute inset-0 flex items-center justify-center font-bold transition-all duration-300',
          rolling && 'animate-pulse',
          diceColors[value as keyof typeof diceColors] || 'bg-[var(--game-bg-accent)]'
        )}
      >
        <span className="text-white drop-shadow-md transform scale-110">
          {getDiceSymbol(value)}
        </span>
      </div>
    </div>
  );
}

interface TripleDiceProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  values?: number[];
  onRollComplete?: (values: number[]) => void;
}

export function TripleDice({ 
  size = 'md', 
  animate = true,
  values: initialValues,
  onRollComplete
}: TripleDiceProps) {
  const [rolling, setRolling] = useState(false);
  const [values, setValues] = useState<number[]>(initialValues || [1, 1, 1]);
  const [completedDice, setCompletedDice] = useState<number>(0);
  const [isMatch, setIsMatch] = useState(false);
  
  useEffect(() => {
    // Check if all dice match when values change
    if (values[0] === values[1] && values[1] === values[2]) {
      setIsMatch(true);
    } else {
      setIsMatch(false);
    }
  }, [values]);
  
  const rollDice = () => {
    if (rolling) return;
    
    setRolling(true);
    setCompletedDice(0);
    setIsMatch(false);
    
    // We'll collect results as each dice completes its animation
    // Reset values to trigger the SingleDice components to start rolling
    const diceElements = document.querySelectorAll('[data-single-dice]');
    diceElements.forEach((dice) => {
      dice.dispatchEvent(new Event('click'));
    });
  };
  
  const handleSingleDiceComplete = (index: number, value: number) => {
    const newCompletedDice = completedDice + 1;
    
    // Update the result array
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);
    
    setCompletedDice(newCompletedDice);
    
    // Check if all dice have completed rolling
    if (newCompletedDice === 3) {
      setRolling(false);
      onRollComplete?.(newValues);
    }
  };
  
  return (
    <div 
      className={cn(
        "flex space-x-2 p-1 rounded-md transition-all duration-300",
        rolling && "animate-pulse",
        isMatch && !rolling && "animate-bounce bg-[var(--game-mint-light)] bg-opacity-20"
      )} 
      data-triple-dice 
      onClick={rollDice}
    >
      <SingleDice 
        size={size} 
        animate={true}
        value={values[0]}
        delay={0}
        onRollComplete={(value) => handleSingleDiceComplete(0, value)} 
      />
      <SingleDice 
        size={size} 
        animate={true}
        value={values[1]}
        delay={200} // Stagger the animation
        onRollComplete={(value) => handleSingleDiceComplete(1, value)} 
      />
      <SingleDice 
        size={size} 
        animate={true}
        value={values[2]}
        delay={400} // Stagger the animation even more
        onRollComplete={(value) => handleSingleDiceComplete(2, value)} 
      />
    </div>
  );
}

interface DiceRollerProps {
  onRoll?: (result: number[]) => void;
  className?: string;
  specialEvents?: Record<string, any>;
}

export default function DiceRoller({ onRoll, className, specialEvents }: DiceRollerProps) {
  const [result, setResult] = useState<number[] | null>(null);
  const [isMatch, setIsMatch] = useState(false);
  const [specialEvent, setSpecialEvent] = useState<string | null>(null);
  
  const handleRollComplete = (values: number[]) => {
    setResult(values);
    
    // Check for triple match (all dice showing the same value)
    if (values[0] === values[1] && values[1] === values[2]) {
      setIsMatch(true);
      
      // Get special event for this match if available
      if (specialEvents && specialEvents[values[0]]) {
        setSpecialEvent(`${specialEvents[values[0]].name}: ${specialEvents[values[0]].description}`);
      } else {
        setSpecialEvent(`Triple ${values[0]}s!`);
      }
    } else {
      setIsMatch(false);
      setSpecialEvent(null);
    }
    
    // Pass the result back to the parent component
    onRoll?.(values);
  };
  
  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Slot machine frame */}
      <div className="bg-[var(--game-bg-secondary)] p-4 rounded-lg shadow-md border border-[var(--game-mint)] w-fit transition-all duration-300 hover:shadow-lg">
        <div className="text-center text-[var(--game-mint-dark)] font-bold mb-2 text-lg">
          Fortune Dice
        </div>
        
        {/* Dice container styled like slot machine reels */}
        <div className="bg-[var(--game-bg-primary)] p-3 rounded-lg mb-3 border border-[var(--game-divider)]">
          <TripleDice 
            size="lg" 
            onRollComplete={handleRollComplete} 
          />
        </div>
      </div>
      
      {/* Results display */}
      {result !== null && (
        <div className="text-center mt-2 p-3 bg-[var(--game-bg-secondary)] rounded-lg border border-[var(--game-divider)] w-full max-w-sm transition-all duration-300">
          {isMatch ? (
            <div className="text-lg font-bold text-[var(--game-mint-dark)] animate-pulse flex flex-col items-center">
              <div className="text-xl mb-1 flex items-center">
                <span className="mr-2">✨</span>
                <span>Special Event!</span>
                <span className="ml-2">✨</span>
              </div>
              <div className="text-md text-[var(--game-text-primary)]">{specialEvent}</div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-lg font-medium text-[var(--game-text-primary)]">
                Total: {result.reduce((sum, val) => sum + val, 0)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 