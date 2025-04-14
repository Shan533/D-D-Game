'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useGame } from '../../context/GameContext';
import { Template } from '../../types/template';
import { useAuth } from '../../context/AuthContext';

export default function CharacterCreationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  
  const [playerName, setPlayerName] = useState('');
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const { loadTemplate, createGame, loading, error, template } = useGame();
  const { user, forceRefresh } = useAuth();
  
  useEffect(() => {
    if (!templateId) {
      router.push('/game');
      return;
    }
    
    // Keep track of whether we've already fetched this template
    let isFetching = false;
    
    const fetchTemplate = async () => {
      try {
        // Avoid multiple concurrent fetches
        if (isFetching) return;
        isFetching = true;
        
        // Only load the template if it's not already loaded or if it's a different template
        if (!template || template.metadata.id !== templateId) {
          console.log(`Loading template ${templateId} (current: ${template?.metadata.id || 'none'})`);
          await loadTemplate(templateId);
        } else {
          console.log(`Template ${templateId} already loaded, skipping fetch`);
        }
      } catch (error) {
        console.error('Error loading template:', error);
      } finally {
        isFetching = false;
      }
    };
    
    fetchTemplate();
    
    // Add cleanup function
    return () => {
      isFetching = false;
    };
  }, [templateId, router, template, loadTemplate]);
  
  useEffect(() => {
    // Initialize customizations when template changes
    if (template) {
      const initialCustomizations: Record<string, string> = {};
      Object.entries(template.playerCustomizations).forEach(([key, customization]) => {
        if (customization.options.length > 0) {
          initialCustomizations[key] = customization.options[0];
        }
      });
      
      setCustomizations(initialCustomizations);
    }
  }, [template]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template || !playerName.trim()) return;
    
    try {
      console.log("Starting game creation process...");
      
      // Debug current auth state
      console.log("CURRENT AUTH STATE:", { 
        user: user ? { id: user.id, username: user.username } : null,
        isAuthenticated: !!user,
        localStorage: typeof window !== 'undefined' ? !!localStorage.getItem('authState') : false,
        sessionStorage: typeof window !== 'undefined' ? !!sessionStorage.getItem('authState') : false
      });
      
      // Verify template has required fields
      if (!template.metadata?.id) {
        throw new Error("Invalid template: missing ID");
      }
      
      if (!template.scenario) {
        throw new Error("Invalid template: missing scenario");
      }
      
      if (!template.startingPoint) {
        throw new Error("Invalid template: missing starting point");
      }
      
      console.log("Game creation parameters:", {
        templateId: template.metadata.id,
        playerName: playerName.trim(),
        customizationsCount: Object.keys(customizations).length
      });
      
      // Force refresh authentication to ensure we have a valid user
      if (forceRefresh) {
        console.log("Refreshing authentication before creating game...");
        await forceRefresh();
        
        // Debug auth state after refresh
        console.log("AUTH STATE AFTER REFRESH:", { 
          user: user ? { id: user.id, username: user.username } : null,
          isAuthenticated: !!user,
          localStorage: typeof window !== 'undefined' ? !!localStorage.getItem('authState') : false,
          sessionStorage: typeof window !== 'undefined' ? !!sessionStorage.getItem('authState') : false
        });
      } else {
        console.warn("forceRefresh function is not available!");
      }
      
      // Verify that we have a valid user after refresh
      if (!user) {
        console.error("No user found after authentication refresh!");
        throw new Error("Authentication is required to start an adventure. Please try logging in again.");
      }
      
      console.log("Authentication verified, creating game with user ID:", user.id);
      
      // Set a flag in localStorage to track that we're starting a game
      localStorage.setItem('gameStarting', 'true');
      
      // Try to create the game with increased timeout/retries if necessary
      let gameCreated = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!gameCreated && attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`Game creation attempt ${attempts}/${maxAttempts}`);
          await createGame(template.metadata.id, playerName.trim(), customizations);
          gameCreated = true;
          console.log("Game created successfully!");
        } catch (error) {
          console.error(`Game creation attempt ${attempts} failed:`, error);
          
          if (attempts >= maxAttempts) {
            throw error; // Re-throw after max attempts
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // If the createGame function doesn't navigate automatically, do it manually
      console.log("Game creation completed, verifying navigation");
      
      // Add a longer timeout to allow for state updates
      setTimeout(() => {
        const currentPath = window.location.pathname;
        
        // If we're still on the character creation page, navigate manually
        if (currentPath.includes('/game/create')) {
          console.log("Still on character creation page, navigating manually to game play");
          window.location.href = '/game/play'; // Use direct navigation for a full page reload
        } else {
          console.log("Navigation already happened to:", currentPath);
        }
      }, 2000); // Increased timeout to 2 seconds
    } catch (error) {
      console.error('Error creating game:', error);
      
      // Display error to user (you might want to add a UI element for this)
      alert(`Failed to create game: ${(error as Error).message}`);
      
      // Clear gameStarting flag
      localStorage.removeItem('gameStarting');
    }
  };
  
  const handleCustomizationChange = (key: string, value: string) => {
    setCustomizations(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  // Add a handler for the back button
  const handleBackButton = () => {
    // Clear template state to prevent loading loops
    if (template) {
      // We need to use window.location here to ensure template state is reset
      window.location.href = '/game';
    } else {
      router.back();
    }
  };
  
  if (!template) {
    return (
      <Card className="game-card max-w-md mx-auto">
        <CardContent className="py-10 text-center">
          <p className="text-[var(--game-text-primary)]">Loading template...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="game-card max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-[var(--game-text-primary)]">Create Your Character</CardTitle>
          <CardDescription className="text-[var(--game-text-secondary)]">
            Customize your character for the "{template.metadata.name}" adventure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="playerName" className="block text-sm font-medium text-[var(--game-text-primary)]">
              Character Name
            </label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your character's name"
              className="game-input w-full border-0 shadow-none focus:ring-0"
              required
            />
          </div>
          
          {Object.entries(template.playerCustomizations).map(([key, customization]) => (
            <div key={key} className="space-y-2">
              <label htmlFor={key} className="block text-sm font-medium text-[var(--game-text-primary)]">
                {customization.name}
              </label>
              <p className="text-xs text-[var(--game-text-secondary)] mb-2">
                {customization.description}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {customization.options.map((option) => (
                  <label
                    key={option}
                    className={`
                      rounded-md p-3 cursor-pointer transition-all duration-200
                      ${customizations[key] === option 
                        ? 'bg-[var(--game-bg-secondary)] border-2 border-[var(--game-button-primary)] shadow-sm' 
                        : 'bg-[var(--game-card-bg)] border-2 border-[var(--game-divider)] hover:bg-[var(--game-mint-light)]'}
                    `}
                  >
                    <input
                      type="radio"
                      name={key}
                      value={option}
                      checked={customizations[key] === option}
                      onChange={() => handleCustomizationChange(key, option)}
                      className="sr-only"
                    />
                    <span className="text-[var(--game-text-primary)] block text-center font-medium">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border-2 border-red-200 font-medium">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex space-x-2 w-full">
            <Button
              type="button"
              className="flex-1 !bg-[var(--game-bg-primary)] !text-[var(--game-mint-dark)] hover:!bg-[var(--game-card-bg)] rounded-md py-2 px-4 font-medium transition-all duration-200"
              onClick={handleBackButton}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 game-button-primary rounded-md py-2 px-4 font-medium transition-all duration-200"
              isLoading={loading}
              disabled={loading || !playerName.trim()}
            >
              Start Adventure
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
} 