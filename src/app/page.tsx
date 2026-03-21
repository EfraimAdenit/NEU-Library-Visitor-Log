'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginCard from '@/components/login-card';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export default function Home() {
  const { user, userData, loading } = useAuth();
  const { roleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && userData) {
      if (userData.role === 'admin' && roleTheme === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, userData, loading, router, roleTheme]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <div className="z-10 w-full max-w-md flex flex-col items-center">
        <LoginCard />
      </div>
    </main>
  );
}
