'use client';

import { useState, useRef, useEffect } from 'react';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';

interface UserProfileProps {
  user: User | null;
  onLogout: () => Promise<void>;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Get user's initials for the avatar
  const initials = user.username
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="h-8 w-8 game-avatar rounded-full flex items-center justify-center text-sm font-medium">
          {initials}
        </div>
        <span className="hidden md:inline text-[var(--game-text-primary)]">
          {user.username}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 game-card rounded-md shadow-lg py-1 z-10 border border-[var(--game-card-border)]">
          <div className="px-4 py-2 border-b border-[var(--game-divider)]">
            <p className="text-sm font-medium text-[var(--game-text-primary)]">{user.username}</p>
            <p className="text-xs text-[var(--game-text-secondary)] truncate">{user.email}</p>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full text-left block px-4 py-2 text-sm text-[var(--game-text-primary)] hover:bg-[var(--game-bg-secondary)]"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
} 