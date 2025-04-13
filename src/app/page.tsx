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
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">D&D Interactive Game</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
              </li>
              <li>
                <Link href="/register">
                  <Button variant="primary">Sign Up</Button>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 flex flex-col items-center justify-center">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
            Welcome to the D&D-Style Interactive Game
          </h2>
          <p className="text-xl mb-8 text-slate-700 dark:text-slate-300">
            Embark on a text-based adventure where your choices shape the story. 
            Sign up now to begin your journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="py-8 border-t border-slate-200 dark:border-slate-700">
        <div className="container mx-auto text-center text-slate-500 dark:text-slate-400">
          <p>&copy; 2023 D&D Interactive Game. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
