'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/header';
import { useTheme } from '@/components/theme-provider';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { user, loading, userData } = useAuth();
  const { roleTheme } = useTheme();
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
      
      const isActuallyAdmin = userData.role === 'admin';
      const wantsAdminView = roleTheme === 'admin';
      
      // If a non-admin tries to access /admin, redirect them strictly to /dashboard
      if (pathname.startsWith('/admin') && !isActuallyAdmin) {
        router.replace('/dashboard');
      }
      
      // If an admin is on /dashboard but they explicitly selected Admin role, redirect to /admin
      if (pathname.startsWith('/dashboard') && isActuallyAdmin && wantsAdminView) {
        router.replace('/admin');
      }
      
      // If an admin is on /admin but they selected Student role, safely redirect to /dashboard
      if (pathname.startsWith('/admin') && isActuallyAdmin && wantsAdminView === false && roleTheme === 'student') {
        router.replace('/dashboard');
      }
    }
  }, [userData, loading, router, roleTheme]);


  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && (!userData || userData.role !== 'admin' || roleTheme === 'student')) {
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
