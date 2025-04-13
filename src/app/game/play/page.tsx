'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '../../../context/GameContext';
import { useAuth } from '../../../context/AuthContext';
import ChatInterface from '../../../components/game/ChatInterface';
import CharacterSheet from '../../../components/game/CharacterSheet';
import UserProfile from '../../../components/auth/UserProfile';
import { Button } from '../../../components/ui/button';
import AuthCheck from '../../../components/auth/AuthCheck';
import { Card, CardContent } from '../../../components/ui/card';

export default function GamePlayPage() {
  const { activeGame, gameState, template, endGame, loading: gameContextLoading, loadGame } = useGame();
  const { user, isAuthenticated, logout } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  
  // Debug output for auth state
  useEffect(() => {
    console.log("GamePlayPage - Auth state:", { 
      isAuthenticated,
      user: user ? `${user.id.substring(0, 8)}...` : "null"
    });
    
    // Mark auth as checked after a short delay
    const timer = setTimeout(() => {
      setAuthChecked(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);
  
  // Debug output for game state
  useEffect(() => {
    console.log("GamePlayPage - Game state:", { 
      activeGame,
      gameState: gameState ? "exists" : "null",
      template: template ? template.metadata.id : "null"
    });
  }, [activeGame, gameState, template]);
  
  useEffect(() => {
    // Don't try to load game state until auth is ready
    if (!authChecked || !isAuthenticated) {
      return;
    }
    
    const checkGameState = async () => {
      try {
        // Check if a game is currently being created
        const gameStarting = localStorage.getItem('gameStarting') === 'true';
        
        if (gameStarting) {
          console.log("Game is currently being created, waiting for state to be ready");
          setIsCreatingGame(true);
          
          // Clear the gameStarting flag
          localStorage.removeItem('gameStarting');
          
          // If we already have a game state, we can proceed
          if (gameState && template && activeGame) {
            console.log("Game state already available, proceeding");
            setInitialLoading(false);
            setIsCreatingGame(false);
            return;
          }
          
          // Allow some time for the game state to be set up
          setTimeout(() => {
            // If we still don't have a game state, check localStorage
            if (!gameState || !template || !activeGame) {
              checkLocalStorage();
            } else {
              setInitialLoading(false);
              setIsCreatingGame(false);
            }
          }, 1500);
          
          return;
        }
        
        // If we already have a game state in context, use it
        if (activeGame && gameState && template) {
          console.log("Active game found in context, proceeding with game");
          setInitialLoading(false);
          return;
        }
        
        // Check localStorage
        checkLocalStorage();
      } catch (error) {
        console.error("Error checking game state:", error);
        setInitialLoading(false);
      }
    };
    
    const checkLocalStorage = async () => {
      // If we don't have game state, check localStorage
      if (typeof window !== 'undefined') {
        const storedSessionId = localStorage.getItem('gameSessionId');
        const storedActiveGame = localStorage.getItem('gameActive');
        
        console.log("Found in localStorage:", { storedSessionId, storedActiveGame });
        
        // If we have a session ID in localStorage, try to load the game
        if (storedSessionId && storedActiveGame === 'true') {
          console.log("Loading game from stored session ID:", storedSessionId);
          try {
            await loadGame(storedSessionId);
            console.log("Game successfully loaded from session ID");
            setInitialLoading(false);
            setIsCreatingGame(false);
            return; // Game loaded successfully
          } catch (error) {
            console.error("Failed to load game from stored session:", error);
            // Clear invalid storage
            localStorage.removeItem('gameSessionId');
            localStorage.removeItem('gameActive');
          }
        } else {
          console.log("No valid game session found in localStorage");
        }
      }
      
      // No stored game or loading failed, redirect to game selection
      console.log("No active game, redirecting to game selection");
      router.push('/game');
    };
    
    // Only check game state when authentication is confirmed
    if (isAuthenticated && user) {
      console.log("Authentication confirmed, checking game state");
      checkGameState();
    }
  }, [activeGame, gameState, template, loadGame, router, isAuthenticated, user, authChecked]);
  
  const handleEndGame = async () => {
    // Clear localStorage on end game
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gameSessionId');
      localStorage.removeItem('gameActive');
      localStorage.removeItem('gameStarting');
    }
    
    await endGame();
    router.push('/game');
  };
  
  // Show loading state before AuthCheck kicks in
  if (!authChecked) {
    return (
      <div className="container mx-auto py-10 game-container">
        <Card className="game-card">
          <CardContent className="flex items-center justify-center p-10">
            <div className="text-center">
              <h2 className="text-xl mb-4 text-[var(--game-text-primary)]">Checking authentication...</h2>
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-[var(--game-bg-accent)] h-10 w-10"></div>
                <div className="rounded-full bg-[var(--game-bg-accent)] h-10 w-10"></div>
                <div className="rounded-full bg-[var(--game-bg-accent)] h-10 w-10"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <AuthCheck>
      {(initialLoading || isCreatingGame) ? (
        <div className="container mx-auto py-10 game-container">
          <Card className="game-card">
            <CardContent className="flex items-center justify-center p-10">
              <div className="text-center">
                <h2 className="text-xl mb-4 text-[var(--game-text-primary)]">
                  {isCreatingGame ? "Creating your adventure..." : "Loading your adventure..."}
                </h2>
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-[var(--game-bg-accent)] h-10 w-10"></div>
                  <div className="rounded-full bg-[var(--game-bg-accent)] h-10 w-10"></div>
                  <div className="rounded-full bg-[var(--game-bg-accent)] h-10 w-10"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : !activeGame || !gameState || !template ? (
        <div className="container mx-auto py-10 game-container">
          <Card className="game-card">
            <CardContent className="p-10">
              <h2 className="text-xl mb-4 text-[var(--game-text-primary)]">No active game found</h2>
              <p className="mb-4 text-[var(--game-text-secondary)]">There doesn't seem to be an active game session.</p>
              <Button className="game-button-primary" onClick={() => router.push('/game')}>
                Go to Game Selection
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="container mx-auto py-6 game-container">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--game-text-primary)]">
              {template.metadata.name}
            </h1>
            <div className="flex space-x-3">
              <Button className="game-button-secondary" onClick={handleEndGame}>
                End Game
              </Button>
              <UserProfile user={user} onLogout={logout} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 game-chat-area rounded-lg shadow-sm h-[70vh] flex flex-col">
              <ChatInterface />
            </div>
            <div className="lg:col-span-1 game-character-sheet rounded-lg h-[70vh] overflow-y-auto pr-2">
              <CharacterSheet />
            </div>
          </div>
        </div>
      )}
    </AuthCheck>
  );
} 