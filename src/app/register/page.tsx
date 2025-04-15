'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { RegisterCredentials } from '../../types/auth';

export default function RegisterPage() {
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    username: '',
    email: '',
    password: '',
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { register, loading, error, isAuthenticated, message } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If user is already logged in, redirect to game page
    if (isAuthenticated) {
      router.push('/game');
    }
  }, [isAuthenticated, router]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear password error when changing passwords
    if (name === 'password') {
      setPasswordError('');
    }
  };
  
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setPasswordError('');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (credentials.password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    // Validate password length
    if (credentials.password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      await register(credentials);
    } catch (error) {
      console.error('Registration error:', error);
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
            <CardTitle className="text-2xl game-header">Create Account</CardTitle>
            <CardDescription className="text-[var(--game-text-secondary)]">
              Register to start your adventure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-[var(--game-text-primary)]">
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                value={credentials.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
                className="game-input"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-[var(--game-text-primary)]">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
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
                value={credentials.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                className="game-input"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--game-text-primary)]">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm your password"
                required
                className="game-input"
              />
              {passwordError && (
                <p className="text-sm text-red-600 mt-1">
                  {passwordError}
                </p>
              )}
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}
            
            {message && (
              <div className="p-3 bg-[var(--game-mint-light)] text-[var(--game-text-accent)] rounded-md text-sm border border-[var(--game-mint)]">
                {message}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button
              type="submit"
              className="game-button-primary w-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            
            <p className="mt-4 text-center text-sm text-[var(--game-text-secondary)]">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--game-text-accent)] hover:underline">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 