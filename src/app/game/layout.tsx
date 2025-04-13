'use client';

import React from 'react';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen game-container">
      {children}
    </div>
  );
} 