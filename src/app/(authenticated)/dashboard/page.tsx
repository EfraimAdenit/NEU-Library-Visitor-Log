'use client';

import VisitLogForm from '@/components/visit-log-form';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const { userData } = useAuth();

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = userData?.name?.split(' ')[0] || 'Visitor';

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        {getGreeting()}, {displayName}!
      </h1>
      <p className="text-muted-foreground">Welcome to the NEU Library. Please log your visit below.</p>
      <div className="mt-8 max-w-2xl">
        <VisitLogForm />
      </div>
    </div>
  );
}
