'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/header';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { user, loading, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);
  
  // Specific admin route protection
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      if (!loading && userData && userData.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [userData, loading, router]);


  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (typeof window !== 'undefined' && window.location.pathname === '/admin' && (!userData || userData.role !== 'admin')) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 bg-background p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
