'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';

interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, username: string, password: string, fullName?: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  loginWithGithub: () => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/popup-closed-by-user': 'Sign in was cancelled',
    'auth/cancelled-popup-request': 'Sign in was cancelled',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method',
  };
  return messages[code] || 'Authentication failed. Please try again.';
}

async function syncFirebaseUser(
  firebaseUser: FirebaseUser,
  extraData?: { username?: string; fullName?: string }
): Promise<{ user: User; token: string }> {
  const response = await fetch('/api/auth/firebase-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      username: extraData?.username,
      fullName: extraData?.fullName,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync user account');
  }

  const data = await response.json();
  return { user: data.user as User, token: data.token as string };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore from localStorage on mount, then listen for Firebase auth state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Restore cached user immediately so UI doesn't flash
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const { user: syncedUser, token: jwtToken } = await syncFirebaseUser(firebaseUser);
          setUser(syncedUser);
          setToken(jwtToken);
          localStorage.setItem('token', jwtToken);
          localStorage.setItem('user', JSON.stringify(syncedUser));
        } catch {
          // silently fail — user will see loading=false and can re-auth
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const { user: syncedUser, token: jwtToken } = await syncFirebaseUser(credential.user);
      setUser(syncedUser);
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(syncedUser));
      return syncedUser;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      throw new Error(getFirebaseErrorMessage(code));
    }
  };

  const register = async (
    email: string,
    username: string,
    password: string,
    fullName?: string
  ): Promise<User> => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const { user: syncedUser, token: jwtToken } = await syncFirebaseUser(credential.user, {
        username: username.trim().toLowerCase(),
        fullName: fullName?.trim() || username,
      });
      setUser(syncedUser);
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(syncedUser));
      return syncedUser;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      throw new Error(getFirebaseErrorMessage(code));
    }
  };

  const loginWithGoogle = async (): Promise<User> => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const { user: syncedUser, token: jwtToken } = await syncFirebaseUser(credential.user);
      setUser(syncedUser);
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(syncedUser));
      return syncedUser;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      throw new Error(getFirebaseErrorMessage(code));
    }
  };

  const loginWithGithub = async (): Promise<User> => {
    try {
      const credential = await signInWithPopup(auth, githubProvider);
      const { user: syncedUser, token: jwtToken } = await syncFirebaseUser(credential.user);
      setUser(syncedUser);
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(syncedUser));
      return syncedUser;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      throw new Error(getFirebaseErrorMessage(code));
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await fetch(`/api/users/${user?.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    const updated = await response.json();

    if (!response.ok) {
      throw new Error(updated.error || 'Profile update failed.');
    }

    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!user,
      login, register, loginWithGoogle, loginWithGithub, logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}