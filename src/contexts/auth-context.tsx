'use client';

import { createContext, useEffect, useState, type ReactNode, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut, 
  type User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userData: AppUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUser(firebaseUser);
            setUserData(userSnap.data() as AppUser);
          } else {
            const newUserData: AppUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                role: 'user',
            };
            await setDoc(userRef, newUserData);
            setUser(firebaseUser);
            setUserData(newUserData);
          }
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "There was a problem verifying your session. Please try again.",
        });
        setUser(null);
        setUserData(null);
      } finally {
        if (isInitialLoad.current) {
          setLoading(false);
          isInitialLoad.current = false;
        }
      }
    });

    return () => unsubscribe();
  }, [toast]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.code === 'auth/invalid-credential' ? 'Invalid email or password.' : 'An error occurred. Please try again.',
      });
    }
  };

  const signUpWithEmail = async (fullName: string, email: string, password: string) => {
    try {
      if (!email.endsWith('@neu.edu.ph')) {
        throw { code: 'auth/invalid-email', message: 'Only @neu.edu.ph emails are allowed.' };
      }
        
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      await updateProfile(firebaseUser, { displayName: fullName });

      const userRef = doc(db, 'users', firebaseUser.uid);
      const newUserData: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: fullName,
        role: 'user',
      };
      await setDoc(userRef, newUserData);

    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.code === 'auth/email-already-in-use' ? 'This email is already registered.' : error.message,
        });
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
       console.error(error);
       toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "An error occurred during sign-out. Please try again.",
      });
    }
  };

  const value = {
    user,
    userData,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
