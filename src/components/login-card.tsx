'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NeuLogo from './neu-logo';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { useState } from 'react';

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


export default function LoginCard({ setPersona }: { setPersona: (persona: null) => void }) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  async function handleLogin(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    await signInWithEmail(values.email, values.password);
    setLoading(false);
  }

  async function handleSignUp(values: z.infer<typeof signUpSchema>) {
    setLoading(true);
    await signUpWithEmail(values.fullName, values.email, values.password);
    setLoading(false);
  }
  
  const isSubmitting = loginForm.formState.isSubmitting || signUpForm.formState.isSubmitting;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="relative items-center text-center">
        <Button variant="ghost" size="icon" className="absolute left-2 top-2" onClick={() => setPersona(null)}>
            <ArrowLeft />
            <span className="sr-only">Back</span>
        </Button>
        <NeuLogo className="h-16 w-16 text-primary" />
        <CardTitle className="font-headline text-2xl">NEU Library Visitor Log</CardTitle>
        <CardDescription>{isLoginView ? 'Sign in to continue' : 'Create an account to continue'}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoginView ? (
          <Form {...loginForm} key="login-form">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@neu.edu.ph" {...field} />
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
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
                {(isSubmitting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...signUpForm} key="signup-form">
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
               <FormField
                control={signUpForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Dela Cruz" {...field} />
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
                      <Input placeholder="name@neu.edu.ph" {...field} />
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
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
                {(isSubmitting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
          </Form>
        )}
        <div className="mt-4 text-center text-sm">
          {isLoginView ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLoginView(!isLoginView)} className="font-semibold text-primary underline-offset-4 hover:underline">
            {isLoginView ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
