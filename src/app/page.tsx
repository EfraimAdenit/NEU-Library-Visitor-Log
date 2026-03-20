'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoginCard from '@/components/login-card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NeuLogo from '@/components/neu-logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [persona, setPersona] = useState<'student' | 'admin' | null>(null);

  useEffect(() => {
    // Add/remove admin-theme class from html element to dynamically change the theme
    if (persona === 'admin') {
      document.documentElement.classList.add('admin-theme');
    } else {
      document.documentElement.classList.remove('admin-theme');
    }

    // Cleanup on component unmount
    return () => {
      document.documentElement.classList.remove('admin-theme');
    };
  }, [persona]);

  useEffect(() => {
    if (!loading && user && userData) {
      if (userData.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, userData, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!persona) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mx-auto w-fit">
              <NeuLogo className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">
              NEU Library Visitor Log
            </CardTitle>
            <CardDescription>
              Please select your role to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button onClick={() => setPersona('student')} size="lg">
              Student / Visitor
            </Button>
            <Button
              onClick={() => setPersona('admin')}
              size="lg"
              variant="outline"
            >
              Administrator
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <LoginCard setPersona={setPersona} />
    </main>
  );
}
