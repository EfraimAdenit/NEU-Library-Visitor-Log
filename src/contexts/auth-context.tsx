
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
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<boolean>;
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

  const handleUserAuth = useCallback(async (firebaseUser: User): Promise<AppUser> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    let appUserData: AppUser;

    if (userSnap.exists()) {
        appUserData = userSnap.data() as AppUser;
    } else {
        const displayName = firebaseUser.displayName || '';
        const email = firebaseUser.email;
        const role = (email === 'jcesperanza@neu.edu.ph' || email?.toLowerCase() === 'efraim.adenit@neu.edu.ph') ? 'admin' : 'user';
        
        appUserData = {
            uid: firebaseUser.uid,
            email: email,
            name: displayName,
            role,
        };
        if (!firebaseUser.displayName && displayName) {
          await updateProfile(firebaseUser, { displayName });
        }
        await setDoc(userRef, appUserData);
    }
    setUser(firebaseUser);
    setUserData(appUserData);
    return appUserData;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // OPTIMIZATION: Set user and stop loading spinner immediately — auth is resolved.
        // Then fetch Firestore user data in the background without blocking the UI.
        setUser(firebaseUser);
        setLoading(false);
        handleUserAuth(firebaseUser).catch((error) => {
          console.error("Error fetching user data:", error);
        });
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [handleUserAuth]);

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (!email.endsWith('@neu.edu.ph')) {
        throw { code: 'auth/invalid-email', message: 'Only @neu.edu.ph emails are allowed.' };
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleUserAuth(userCredential.user);
      if (email === 'jcesperanza@neu.edu.ph' || email?.toLowerCase() === 'efraim.adenit@neu.edu.ph') {
        toast({
            title: "Welcome to NEU Library!",
            description: "You have been successfully signed in as admin.",
        });
      } else {
        toast({
            title: "Welcome back!",
            description: "You have been successfully signed in.",
        });
      }
      return true;
    } catch (error: any) {
      console.error("Login Failed:", error);
      let description = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/invalid-email') {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      if (!googleUser.email?.endsWith('@neu.edu.ph')) {
        await firebaseSignOut(auth);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Only @neu.edu.ph Google accounts are permitted.",
        });
        return;
      }
      await handleUserAuth(googleUser);
      toast({
        title: "Welcome!",
        description: "You have been successfully signed in with Google.",
        variant: 'default',
        className: 'bg-accent text-accent-foreground border-accent',
      });
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Google Sign-In Failed:", error);
        toast({
          variant: "destructive",
          title: "Google Sign-In Failed",
          description: error.message || "An error occurred. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const signUpWithEmail = async (fullName: string, email: string, password: string): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (!email.endsWith('@neu.edu.ph')) {
        throw { code: 'auth/invalid-email', message: 'Only @neu.edu.ph emails are allowed.' };
      }
        
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      await handleUserAuth(userCredential.user);

      toast({
          title: 'Account Created!',
          description: 'Welcome! You have been successfully signed up.',
          variant: 'default',
          className: 'bg-accent text-accent-foreground border-accent',
      });
      return true;
    } catch (error: any) {
        console.error("Sign Up Failed:", error);
        let description = error.message;
        if (error.code === 'auth/email-already-in-use') {
            description = 'An account with this email address already exists. Please sign in instead.';
        } else if (error.code === 'auth/weak-password') {
            description = 'The password is too weak. Please use at least 6 characters.';
        }
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: description,
        });
        return false;
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
            description: `A reset link has been sent to ${email}. Check your inbox.`,
            variant: 'default',
            className: 'bg-accent text-accent-foreground border-accent',
        });
    } catch (error: any) {
         console.error("Password Reset Failed:", error);
         toast({
            variant: "destructive",
            title: "Password Reset Failed",
            description: error.message || "Could not send reset email. Please try again.",
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign Out Failed", description: error.message });
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, isSubmitting, signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
