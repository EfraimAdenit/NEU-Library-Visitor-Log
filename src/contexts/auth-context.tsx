
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

  const handleUserAuth = useCallback(async (firebaseUser: User): Promise<AppUser> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    let appUserData: AppUser;

    if (userSnap.exists()) {
        appUserData = userSnap.data() as AppUser;
    } else {
        // This logic runs for new users (both email and Google sign-up)
        const displayName = firebaseUser.displayName || '';
        const email = firebaseUser.email;
        // Assign admin role based on email
        const role = email === 'jcesperanza@neu.edu.ph' ? 'admin' : 'user';
        
        appUserData = {
            uid: firebaseUser.uid,
            email: email,
            name: displayName,
            role,
        };
        // Update user profile if display name was missing (e.g., email sign-up)
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

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleUserAuth(userCredential.user);
      toast({
          title: "Welcome Back!",
          description: "You have been successfully signed in.",
          variant: "default",
          className: "bg-accent text-accent-foreground border-accent",
      });
    } catch (error: any) {
      console.error("Login Failed:", error);
      let description = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = 'Invalid email or password. Please check your credentials and try again.';
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
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
          await firebaseSignOut(auth); // Sign out the user immediately
          toast({
              variant: "destructive",
              title: "Login Failed",
              description: "Only @neu.edu.ph accounts are permitted.",
          });
      } else {
        await handleUserAuth(googleUser);
        toast({
            title: 'Welcome!',
            description: 'You have been successfully signed in with Google.',
            variant: 'default',
            className: 'bg-accent text-accent-foreground border-accent',
        });
      }
    } catch (error: any) {
        console.error("Google Sign-In Failed:", error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "An error occurred during Google sign-in. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const signUpWithEmail = async (fullName: string, email: string, password: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (!email.endsWith('@neu.edu.ph')) {
        // This custom error will be caught by the catch block
        throw { code: 'auth/invalid-email', message: 'Only @neu.edu.ph emails are allowed.' };
      }
        
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Manually update profile before calling handleUserAuth
      await updateProfile(userCredential.user, { displayName: fullName });
      // handleUserAuth will now read the updated profile
      await handleUserAuth(userCredential.user);

      toast({
          title: 'Account Created!',
          description: 'Welcome! You have been successfully signed up.',
          variant: 'default',
          className: 'bg-accent text-accent-foreground border-accent',
      });
    } catch (error: any) {
        console.error("Sign Up Failed:", error);
        let description = error.message; // Default to firebase message
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
            title: "Failed to Send Reset Email",
            description: "Could not send reset email. Please check the address and try again.",
        });
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
       console.error("Sign Out Failed:", error);
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
