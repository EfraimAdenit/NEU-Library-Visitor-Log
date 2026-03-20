'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NeuLogo from './neu-logo';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { useState } from 'react';
import { Separator } from './ui/separator';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signUpSchema = z.object({
    fullName: z.string().min(1, { message: 'Name is required.' }),
    email: z.string().email().refine(email => email.endsWith('@neu.edu.ph'), {
        message: 'Only @neu.edu.ph emails are allowed.',
    }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const passwordResetSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email to reset your password.' }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.658-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.242,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

export default function LoginCard() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset, isSubmitting } = useAuth();
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const passwordResetForm = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: '' },
  });

  async function handleLogin(values: z.infer<typeof loginSchema>) {
    const appUser = await signInWithEmail(values.email, values.password);
    if (appUser) {
      const destination = appUser.role === 'admin' ? '/admin' : '/dashboard';
      router.push(destination);
    }
  }

  async function handleSignUp(values: z.infer<typeof signUpSchema>) {
    const appUser = await signUpWithEmail(values.fullName, values.email, values.password);
    if (appUser) {
      const destination = appUser.role === 'admin' ? '/admin' : '/dashboard';
      router.push(destination);
    }
  }

  async function handleGoogleSignIn() {
    const appUser = await signInWithGoogle();
    if (appUser) {
      const destination = appUser.role === 'admin' ? '/admin' : '/dashboard';
      router.push(destination);
    }
  }

  async function handlePasswordReset(values: z.infer<typeof passwordResetSchema>) {
    await sendPasswordReset(values.email);
    setShowPasswordReset(false);
    passwordResetForm.reset();
  }
  
  const formIsSubmitting = loginForm.formState.isSubmitting || signUpForm.formState.isSubmitting || passwordResetForm.formState.isSubmitting;
  const submitting = formIsSubmitting || isSubmitting;

  if (showPasswordReset) {
      return (
        <Card className="w-full max-w-sm">
            <CardHeader className="items-center text-center">
                <NeuLogo className="h-16 w-16 text-primary" />
                <CardTitle className="font-headline text-2xl">Reset Password</CardTitle>
                <CardDescription>Enter your email to receive a reset link</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...passwordResetForm}>
                    <form onSubmit={passwordResetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                        <FormField
                            control={passwordResetForm.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input placeholder="name@neu.edu.ph" {...field} autoComplete="email" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Reset Link
                        </Button>
                    </form>
                </Form>
                 <div className="mt-4 text-center text-sm">
                    <button onClick={() => setShowPasswordReset(false)} className="font-semibold text-primary underline-offset-4 hover:underline" disabled={submitting}>
                        Back to Sign In
                    </button>
                </div>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <NeuLogo className="h-16 w-16 text-primary" />
        <CardTitle className="font-headline text-2xl">NEU Library Visitor Log</CardTitle>
        <CardDescription>{isLoginView ? 'Sign in to your account' : 'Create an account'}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoginView ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@neu.edu.ph" {...field} autoComplete="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} autoComplete="current-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...signUpForm}>
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
               <FormField
                control={signUpForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Dela Cruz" {...field} autoComplete="name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@neu.edu.ph" {...field} autoComplete="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} autoComplete="new-password"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
          </Form>
        )}
        <div className="mt-2 text-right text-sm">
            <button onClick={() => setShowPasswordReset(true)} className="font-semibold text-primary underline-offset-4 hover:underline" disabled={submitting}>
                Forgot Password?
            </button>
        </div>

        <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">OR</span>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={submitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon className="mr-2 h-4 w-4"/>}
            Sign In with Google
        </Button>
        
        <div className="mt-4 text-center text-sm">
          {isLoginView ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLoginView(!isLoginView)} className="font-semibold text-primary underline-offset-4 hover:underline" disabled={isSubmitting}>
            {isLoginView ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
