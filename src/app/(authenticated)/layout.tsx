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
  
  // Role-based route protection and redirection
  useEffect(() => {
    if (!loading && userData && typeof window !== 'undefined') {
      const { pathname } = window.location;
      // If a non-admin tries to access /admin, redirect to /dashboard
      if (pathname.startsWith('/admin') && userData.role !== 'admin') {
        router.replace('/dashboard');
      }
      // If an admin is on /dashboard, redirect them to /admin
      if (pathname.startsWith('/dashboard') && userData.role === 'admin') {
        router.replace('/admin');
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
  
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && (!userData || userData.role !== 'admin')) {
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
