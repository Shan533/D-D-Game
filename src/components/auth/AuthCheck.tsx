'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/spinner';

interface AuthCheckProps {
  children: React.ReactNode;
}

/**
 * AuthCheck component that verifies user authentication before rendering children
 */
export default function AuthCheck({ children }: AuthCheckProps) {
  const { isAuthenticated, loading, user, forceRefresh } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Debug auth state
  useEffect(() => {
    console.log('AuthCheck state:', { 
      isAuthenticated, 
      loading, 
      hasUser: !!user,
      path: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });
    
    // Check local storage
    if (typeof window !== 'undefined') {
      const hasAuthState = !!localStorage.getItem('authState');
      const hasToken = !!localStorage.getItem('sb-auth-token');
      console.log('AuthCheck localStorage:', { hasAuthState, hasToken });
    }
  }, [isAuthenticated, loading, user]);

  // Try to refresh authentication if needed
  useEffect(() => {
    const attemptRefresh = async () => {
      if (!isAuthenticated && !loading && !isRefreshing && typeof window !== 'undefined') {
        const hasToken = !!localStorage.getItem('sb-auth-token');
        
        if (hasToken) {
          console.log('Found auth token in localStorage but not authenticated, refreshing auth...');
          setIsRefreshing(true);
          
          try {
            await forceRefresh();
            console.log('Auth refresh completed');
          } catch (error) {
            console.error('Auth refresh failed:', error);
          } finally {
            setIsRefreshing(false);
          }
        }
      }
    };
    
    attemptRefresh();
  }, [isAuthenticated, loading, forceRefresh, isRefreshing]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated && !isRefreshing) {
      console.log('AuthCheck: Not authenticated, redirecting to login');
      
      // Small delay to allow any pending auth operations to complete
      const redirectTimer = setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [loading, isAuthenticated, isRefreshing]);

  // Show spinner while loading or refreshing
  if (loading || isRefreshing) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-600">
            {isRefreshing ? "Refreshing authentication..." : "Verifying login status..."}
          </p>
        </div>
      </div>
    );
  }

  // Show children if authenticated
  if (isAuthenticated) {
    console.log('AuthCheck: User is authenticated, showing content');
    return <>{children}</>;
  }
  
  // Show redirect message
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-3 text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
} 