export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  authProvider?: string;
  lastLogin?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  message: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
} 