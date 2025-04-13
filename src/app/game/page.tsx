'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GameTemplates from '@/components/game/GameTemplates';
import AuthCheck from '@/components/auth/AuthCheck';
import UserProfile from '@/components/auth/UserProfile';
import { useAuth } from '@/context/AuthContext';

export default function GamePage() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Check for localStorage tokens on initial load
  useEffect(() => {
    const checkLocalTokens = () => {
      // Look for the special cookie that middleware sets when no session is found
      const checkLocalCookie = document.cookie.split(';').some(c => 
        c.trim().startsWith('check_local_tokens=')
      );
      
      console.log('[GamePage] Initial load checks:', { 
        isAuthenticated, 
        loading,
        checkLocalCookie,
        hasLocalToken: typeof localStorage !== 'undefined' && !!localStorage.getItem('sb-auth-token')
      });
      
      // If we have the check cookie but AuthContext says we're not authenticated,
      // check if localStorage has tokens that could be used
      if (!isAuthenticated && !loading && checkLocalCookie) {
        console.log('[GamePage] Cookie suggested checking localStorage tokens');
        
        // Check if we have an auth token in localStorage that could be used
        const localToken = localStorage.getItem('sb-auth-token');
        
        if (!localToken) {
          console.log('[GamePage] No localStorage token found, redirecting to login');
          window.location.href = '/login';
        } else {
          console.log('[GamePage] Found localStorage token, refreshing page to try using it');
          // Force a full page refresh to try using the localStorage token
          window.location.reload();
        }
      }
    };
    
    // Run the check
    checkLocalTokens();
  }, [isAuthenticated, loading]);

  const handleLogout = async () => {
    try {
      // Use the logout function from AuthContext instead of duplicating logic
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Only as a fallback, force redirect to login
      window.location.href = '/login';
    }
  };
  
  return (
    <AuthCheck>
      <div className="game-container p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold game-header">Adventure Selection</h1>
            <UserProfile user={user} onLogout={handleLogout} />
          </div>
          
          <div className="mb-8">
            <Card className="game-card p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl text-[var(--game-text-primary)]">Welcome, {user?.username || 'Adventurer'}</CardTitle>
                <CardDescription className="text-[var(--game-text-secondary)]">Choose an adventure template to begin your journey</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <GameTemplates />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="game-card">
              <CardHeader>
                <CardTitle className="text-[var(--game-text-primary)]">Continue Adventure</CardTitle>
                <CardDescription className="text-[var(--game-text-secondary)]">Load a previously saved game</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--game-text-secondary)]">
                  Your saved games will appear here once you've started playing.
                </p>
              </CardContent>
              <CardFooter className="border-t border-[var(--game-divider)] pt-4">
                <Button className="game-button-primary w-full" disabled>No Saved Games</Button>
              </CardFooter>
            </Card>
            
            <Card className="game-card">
              <CardHeader>
                <CardTitle className="text-[var(--game-text-primary)]">Game History</CardTitle>
                <CardDescription className="text-[var(--game-text-secondary)]">View your completed adventures</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--game-text-secondary)]">
                  Your adventure history will appear here once you've completed games.
                </p>
              </CardContent>
              <CardFooter className="border-t border-[var(--game-divider)] pt-4">
                <Button className="game-button-secondary w-full" disabled>No Game History</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
} 