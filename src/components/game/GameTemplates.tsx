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
          <Card key={index} className="overflow-hidden">
            <div className="h-40 bg-slate-200 dark:bg-slate-700">
              <Skeleton className="h-full w-full" />
            </div>
            <CardHeader>
              <Skeleton className="h-6 w-2/3 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/30 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Error Loading Templates</h3>
        <p className="mt-2 text-red-700 dark:text-red-300">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">No Templates Available</h3>
        <p className="mt-2 text-yellow-700 dark:text-yellow-300">
          No game templates have been added yet. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <Card key={template.metadata.id} className="overflow-hidden flex flex-col">
          {template.metadata.imageUrl ? (
            <div 
              className="h-48 bg-cover bg-center" 
              style={{ backgroundImage: `url(${template.metadata.imageUrl})` }}
            />
          ) : (
            <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{template.metadata.name.charAt(0)}</span>
            </div>
          )}
          
          <CardHeader>
            <CardTitle>{template.metadata.name}</CardTitle>
            <CardDescription>
              {template.metadata.description?.substring(0, 100)}{template.metadata.description?.length > 100 ? '...' : ''}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-grow">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {template.metadata.description}
            </p>
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={() => handleSelectTemplate(template.metadata.id)}
              className="w-full"
            >
              Select Adventure
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 