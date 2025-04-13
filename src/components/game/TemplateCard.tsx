'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { TemplateMetadata } from '../../types/template';

interface TemplateCardProps {
  template: TemplateMetadata;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();

  const handleSelectTemplate = () => {
    console.log(`Selecting template: ${template.id} (${template.name})`);
    router.push(`/game/create?template=${template.id}`);
  };
  
  // Default image if none provided
  const imageUrl = template.imageUrl || '/images/game/default-template.jpg';
  
  return (
    <Card variant="bordered" className="overflow-hidden h-full flex flex-col transition-shadow hover:shadow-md">
      <div className="relative w-full h-48">
        <Image
          src={imageUrl}
          alt={template.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          onError={(e) => {
            // If image fails to load, replace with default
            (e.target as HTMLImageElement).src = '/images/game/default-template.jpg';
          }}
        />
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{template.name}</CardTitle>
          <div className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700">
            {template.difficulty}
          </div>
        </div>
        <CardDescription className="mt-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {template.tags && template.tags.length > 0 ? (
            template.tags.map((tag) => (
              <span 
                key={tag} 
                className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
              >
                {tag}
              </span>
            ))
          ) : null}
        </div>
        <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium">Estimated Time:</span> {template.estimatedDuration}
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button variant="primary" onClick={handleSelectTemplate} className="w-full">
          Choose Adventure
        </Button>
      </CardFooter>
    </Card>
  );
} 