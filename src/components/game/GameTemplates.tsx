'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Template } from '@/types/template';
import { useGame } from '@/context/GameContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function GameTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const { loadTemplates, loading, error } = useGame();
  const router = useRouter();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const loadedTemplates = await loadTemplates();
        setTemplates(loadedTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };

    fetchTemplates();
  }, [loadTemplates]);

  const handleSelectTemplate = (templateId: string) => {
    // Reset template cache between selections to avoid stale data
    // We're using window.location.href here to ensure a complete page reload
    // This prevents issues with stale template data
    window.location.href = `/game/create?template=${templateId}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((_, index) => (
          <Card key={index} className="game-card overflow-hidden">
            <div className="h-40 bg-[var(--game-bg-secondary)]">
              <Skeleton className="h-full w-full bg-[var(--game-bg-accent)]" />
            </div>
            <CardHeader>
              <Skeleton className="h-6 w-2/3 mb-2 bg-[var(--game-bg-accent)]" />
              <Skeleton className="h-4 w-full bg-[var(--game-bg-accent)]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full bg-[var(--game-bg-accent)]" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full bg-[var(--game-bg-accent)]" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border-2 border-red-100">
        <h3 className="text-lg font-bold text-red-800">Error Loading Templates</h3>
        <p className="mt-2 text-red-700">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-red-100 text-red-800 hover:bg-red-200"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="p-6 bg-[var(--game-mint-light)] rounded-lg border border-[var(--game-mint)]">
        <h3 className="text-lg font-bold text-[var(--game-text-primary)]">No Templates Available</h3>
        <p className="mt-2 text-[var(--game-text-secondary)]">
          No game templates have been added yet. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <Card key={template.metadata.id} className="game-card overflow-hidden flex flex-col h-[480px]">
          {template.metadata.imageUrl ? (
            <div 
              className="h-48 bg-cover bg-center" 
              style={{ backgroundImage: `url(${template.metadata.imageUrl})` }}
            />
          ) : (
            <div className="h-48 bg-gradient-to-r from-[var(--game-bg-accent)] to-[var(--game-mint-dark)] flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{template.metadata.name.charAt(0)}</span>
            </div>
          )}
          
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="line-clamp-1 text-[var(--game-text-primary)]">{template.metadata.name}</CardTitle>
              {template.metadata.difficulty && (
                <div className="px-2 py-1 text-xs rounded-full bg-[var(--game-mint-light)] text-[var(--game-text-accent)] whitespace-nowrap">
                  {template.metadata.difficulty}
                </div>
              )}
            </div>
            <CardDescription className="mt-2 line-clamp-2 text-[var(--game-text-secondary)]">
              {template.metadata.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-grow">
            <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
              {template.metadata.tags && template.metadata.tags.length > 0 ? (
                template.metadata.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 text-xs rounded-full bg-[var(--game-bg-secondary)] text-[var(--game-text-accent)]"
                  >
                    {tag}
                  </span>
                ))
              ) : null}
            </div>
            
            {template.metadata.estimatedDuration && (
              <div className="mt-1 text-sm text-[var(--game-text-secondary)]">
                <span className="font-medium">Est. Time:</span> {template.metadata.estimatedDuration}
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={() => handleSelectTemplate(template.metadata.id)}
              className="w-full game-button-primary"
            >
              Select Adventure
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 