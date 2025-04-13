'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function AuthStatusPage() {
  const { isAuthenticated, user, loading } = useAuth();
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the server-side authentication status
  useEffect(() => {
    async function checkServerStatus() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/status');
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        const data = await response.json();
        setServerStatus(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkServerStatus();
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Status</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client-side status */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Client Auth Status</h2>
          {loading ? (
            <p>Loading client authentication status...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-medium mr-2">Status:</span> 
                <span className={`px-2 py-1 rounded text-white ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}>
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              
              {user && (
                <div>
                  <h3 className="font-medium mb-2">User Information:</h3>
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                    <pre className="whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-medium mb-2">Storage Status:</h3>
                <p>Local Storage Auth: {typeof window !== 'undefined' && localStorage.getItem('authState') ? 'Present' : 'Not found'}</p>
                <p>Session Storage Auth: {typeof window !== 'undefined' && sessionStorage.getItem('authState') ? 'Present' : 'Not found'}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Server-side status */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Server Auth Status</h2>
          {isLoading ? (
            <p>Loading server authentication status...</p>
          ) : error ? (
            <div className="text-red-500">Error: {error}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-medium mr-2">Status:</span>
                <span className={`px-2 py-1 rounded text-white ${serverStatus?.authenticated ? 'bg-green-500' : 'bg-red-500'}`}>
                  {serverStatus?.authenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              
              {serverStatus?.cookies && (
                <div>
                  <h3 className="font-medium mb-2">Cookies:</h3>
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                    <pre className="whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(serverStatus.cookies, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {serverStatus?.userId && (
                <div>
                  <p><strong>User ID:</strong> {serverStatus.userId}</p>
                  <p><strong>Email:</strong> {serverStatus.email}</p>
                  {serverStatus.sessionExpires && (
                    <p><strong>Session Expires:</strong> {new Date(serverStatus.sessionExpires).toLocaleString()}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex space-x-4">
        <Link href="/api/auth/callback?next=/game" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Refresh Auth Cookies
        </Link>
        
        <Link href="/game" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Try Game Access
        </Link>
        
        <Link href="/login" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Login Page
        </Link>
      </div>
    </div>
  );
} 