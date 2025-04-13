import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { GameProvider } from "../context/GameContext";
import './game-theme.css';

export const metadata: Metadata = {
  title: "D&D-Style Interactive Game",
  description: "AI-powered D&D-style interactive storytelling game",
};

// Add this script to handle logout cleanup
const logoutCleanupScript = `
  function getCookie(name) {
    const value = \`; \${document.cookie}\`;
    const parts = value.split(\`; \${name}=\`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  if (getCookie('sb-logout') === 'true') {
    console.log('Logout detected, cleaning up local storage');
    try {
      // Clear all auth-related storage keys
      localStorage.removeItem('sb-auth-token');         // Current standard key
      localStorage.removeItem('supabase.auth.token');   // Alternate key
      localStorage.removeItem('supabase-auth-token');   // Legacy key
      localStorage.removeItem('authState');
      
      // Also clear session storage
      sessionStorage.removeItem('sb-auth-token');
      sessionStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase-auth-token');
      sessionStorage.removeItem('authState');
      
      // Remove the signal cookie
      document.cookie = 'sb-logout=; Max-Age=0; path=/;';
      console.log('Auth storage cleaned successfully');
    } catch (e) {
      console.error('Failed to clean storage on logout:', e);
    }
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Add the logout cleanup script */}
        <script dangerouslySetInnerHTML={{ __html: logoutCleanupScript }} />
      </head>
      <body>
        <AuthProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
