'use client';

import { createContext, useEffect, useState, type ReactNode } from 'react';
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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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

  const handleUserAuth = async (firebaseUser: User) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        setUser(firebaseUser);
        setUserData(userSnap.data() as AppUser);
    } else {
        const role = firebaseUser.email === 'jcesperanza@neu.edu.ph' ? 'admin' : 'user';
        const newUserData: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            role,
        };
        await setDoc(userRef, newUserData);
        setUser(firebaseUser);
        setUserData(newUserData);
    }
  }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.code === 'auth/invalid-credential' ? 'Invalid email or password.' : 'An error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      if (!googleUser.email?.endsWith('@neu.edu.ph')) {
          await firebaseSignOut(auth);
          toast({
              variant: "destructive",
              title: "Sign in failed",
              description: "Only @neu.edu.ph accounts are permitted.",
          });
          return;
      }
      // handleUserAuth will be triggered by onAuthStateChanged
    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Sign in with Google failed",
            description: "An error occurred. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const signUpWithEmail = async (fullName: string, email: string, password: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (!email.endsWith('@neu.edu.ph')) {
        throw { code: 'auth/invalid-email', message: 'Only @neu.edu.ph emails are allowed.' };
      }
        
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      await updateProfile(firebaseUser, { displayName: fullName });
      
      const role = firebaseUser.email === 'jcesperanza@neu.edu.ph' ? 'admin' : 'user';
      const userRef = doc(db, 'users', firebaseUser.uid);
      const newUserData: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: fullName,
        role,
      };
      await setDoc(userRef, newUserData);

    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.code === 'auth/email-already-in-use' ? 'This email is already registered.' : error.message,
        });
    } finally {
      setIsSubmitting(false);
    }
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
