'use client';

import { createContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut, 
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userData: AppUser | null;
  loading: boolean;
  isSubmitting: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AppUser | null>;
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<AppUser | null>;
  signInWithGoogle: () => Promise<AppUser | null>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleUserAuth = useCallback(async (firebaseUser: User): Promise<AppUser | null> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    let appUserData: AppUser;

    if (userSnap.exists()) {
        appUserData = userSnap.data() as AppUser;
    } else {
        const role = firebaseUser.email === 'jcesperanza@neu.edu.ph' ? 'admin' : 'user';
        appUserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            role,
        };
        await setDoc(userRef, appUserData);
    }
    setUser(firebaseUser);
    setUserData(appUserData);
    return appUserData;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await handleUserAuth(firebaseUser);
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
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [handleUserAuth, toast]);

  const signInWithEmail = async (email: string, password: string): Promise<AppUser | null> => {
    setIsSubmitting(true);
    let appUser: AppUser | null = null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      appUser = await handleUserAuth(userCredential.user);
      if (appUser) {
        toast({
            title: "Welcome Back!",
            description: "You have been successfully signed in.",
            variant: "default",
            className: "bg-accent text-accent-foreground border-accent",
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.code === 'auth/invalid-credential' ? 'Invalid email or password.' : 'An error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
    return appUser;
  };

  const signInWithGoogle = async (): Promise<AppUser | null> => {
    setIsSubmitting(true);
    let appUser: AppUser | null = null;
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      if (!googleUser.email?.endsWith('@neu.edu.ph')) {
          await firebaseSignOut(auth);
          toast({
              variant: "destructive",
              title: "Login Failed",
              description: "Only @neu.edu.ph accounts are permitted.",
          });
      } else {
        appUser = await handleUserAuth(googleUser);
        if (appUser) {
           toast({
                title: 'Welcome!',
                description: 'You have been successfully signed in with Google.',
                variant: 'default',
                className: 'bg-accent text-accent-foreground border-accent',
            });
        }
      }
    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "An error occurred during Google sign-in. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
    return appUser;
  }

  const signUpWithEmail = async (fullName: string, email: string, password: string): Promise<AppUser | null> => {
    setIsSubmitting(true);
    let appUser: AppUser | null = null;
    try {
      if (!email.endsWith('@neu.edu.ph')) {
        throw { code: 'auth/invalid-email', message: 'Only @neu.edu.ph emails are allowed.' };
      }
        
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      await updateProfile(firebaseUser, { displayName: fullName });
      appUser = await handleUserAuth(firebaseUser);

      if(appUser) {
        toast({
            title: 'Account Created!',
            description: 'Welcome! You have been successfully signed up.',
            variant: 'default',
            className: 'bg-accent text-accent-foreground border-accent',
        });
      }
    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.code === 'auth/email-already-in-use' ? 'This email is already registered.' : error.message,
        });
    } finally {
      setIsSubmitting(false);
    }
    return appUser;
  };

  const sendPasswordReset = async (email: string) => {
    setIsSubmitting(true);
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: "Password Reset Email Sent",
            description: `A reset link has been sent to ${email}.`,
        });
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Failed to Send Reset Email",
            description: "Please check the email address and try again.",
        });
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  }

  const signOut = async () => {
    setIsSubmitting(true);
    try {
      await firebaseSignOut(auth);
       toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
       console.error(error);
       toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "An error occurred during sign-out. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = {
    user,
    userData,
    loading,
    isSubmitting,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
