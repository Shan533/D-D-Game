'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CharacterCreationForm from '../../../components/game/CharacterCreationForm';
import AuthCheck from '../../../components/auth/AuthCheck';

export default function CharacterCreationPage() {
  const router = useRouter();
  
  return (
    <AuthCheck>
      <div className="container mx-auto py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create Your Character</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Customize your character to begin your adventure
          </p>
        </div>
        
        <CharacterCreationForm />
      </div>
    </AuthCheck>
  );
} 