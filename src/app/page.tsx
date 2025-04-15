'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If user is already logged in, redirect to game page
    if (isAuthenticated) {
      router.push('/game');
    }
  }, [isAuthenticated, router]);
  
  return (
    <div className="game-container min-h-screen flex flex-col">
      <header className="p-4 border-b border-[var(--game-divider)]">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-[var(--game-text-primary)]">D&D Interactive Game</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link href="/login">
                  <Button className="game-button-secondary" variant="ghost">Login</Button>
                </Link>
              </li>
              <li>
                <Link href="/register">
                  <Button className="game-button-primary" variant="primary">Sign Up</Button>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 flex flex-col items-center justify-center">
        <div className="game-card max-w-3xl text-center p-8">
          <h2 className="text-4xl font-bold mb-6 game-header">
            Welcome to
            <br />
            D&D-Style Interactive Game
          </h2>
          <p className="text-xl mb-8 text-[var(--game-text-secondary)]">
            Embark on a text-based adventure where your choices shape the story. 
            Sign up now to begin your journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="game-button-primary w-full sm:w-auto">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="game-button-secondary w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="py-8 border-t border-[var(--game-divider)]">
        <div className="container mx-auto text-center text-[var(--game-text-secondary)]">
          <p>&copy; 2025 D&D Interactive Game. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
