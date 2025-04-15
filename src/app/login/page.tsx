'use client';

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const { login, loading, error, isAuthenticated, message } = useAuth();

  // Debug local storage and auth state
  useEffect(() => {
    console.log('[LoginPage] Auth state:', {
      isAuthenticated,
      loading,
      error,
      message
    });
    
    if (typeof window !== 'undefined') {
      const hasToken = !!localStorage.getItem('sb-auth-token');
      console.log('[LoginPage] Local storage check:', { hasToken });
    }
  }, [isAuthenticated, loading, error, message]);
  
  useEffect(() => {
    // Check for URL parameters
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    
    if (error) setErrorMessage(decodeURIComponent(error))
    if (message) setSuccessMessage(decodeURIComponent(message))
    
    // If already authenticated, redirect to game
    if (isAuthenticated) {
      console.log('[LoginPage] User already authenticated, redirecting to game');
      window.location.href = '/game';
    }
  }, [searchParams, isAuthenticated])
  
  // Check auth context error/message
  useEffect(() => {
    if (error) setErrorMessage(error);
    if (message) setSuccessMessage(message);
  }, [error, message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    console.log('[LoginPage] Attempting login with email:', email);
    
    try {
      await login({ email, password });
      console.log('[LoginPage] Login function completed');
    } catch (err) {
      console.error('[LoginPage] Login error:', err);
      setErrorMessage((err as Error).message || 'Failed to login');
    }
  };

  return (
    <div className="game-container min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-4 flex justify-start">
        <Link href="/">
          <Button variant="ghost" className="game-button-secondary px-2 py-1 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </Button>
        </Link>
      </div>
      
      <Card className="game-card max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl game-header">Sign In</CardTitle>
            <CardDescription className="text-[var(--game-text-secondary)]">
              Sign in to continue your adventure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-[var(--game-text-primary)]">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                className="game-input"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--game-text-primary)]">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="game-input"
              />
            </div>
            
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
                {errorMessage}
              </div>
            )}
            
            {successMessage && (
              <div className="p-3 bg-[var(--game-mint-light)] text-[var(--game-text-accent)] rounded-md text-sm border border-[var(--game-mint)]">
                {successMessage}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button
              type="submit"
              className="game-button-primary w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <p className="mt-4 text-center text-sm text-[var(--game-text-secondary)]">
              Don't have an account?{' '}
              <Link href="/register" className="text-[var(--game-text-accent)] hover:underline">
                Sign up here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 