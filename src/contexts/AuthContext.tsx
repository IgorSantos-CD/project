import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { auth } from '../lib/auth';
import { Loader2 } from 'lucide-react';

interface AuthResponse {
  user: User | null;
  session: Session | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        console.log('Current user:', currentUser);
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting current user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = auth.onAuthStateChange((user) => {
      console.log('Auth state changed:', user);
      setUser(user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await auth.signIn(email, password);
    setUser(response.user);
    return response;
  };

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await auth.signUp(email, password);
    setUser(response.user);
    return response;
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}