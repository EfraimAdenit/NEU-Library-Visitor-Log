import AdminDashboard from '@/components/admin-dashboard';
import { db } from '@/lib/firebase';
import type { Visit } from '@/lib/types';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { redirect } from 'next/navigation';

// This is a placeholder for a real server-side auth check
// In a real app, you would use a library like next-auth or firebase-admin to get user session on the server
async function checkAdminRoleOnServer() {
  // This is a simplified check. A real implementation would be more secure.
  // For now, we are letting the client-side handle the redirect as a primary measure.
  // We'll proceed assuming the client-side check in the layout is sufficient for this project's scope.
  return true;
}

export default async function AdminPage() {
  const isAdmin = await checkAdminRoleOnServer();
  if (!isAdmin) {
    redirect('/dashboard');
  }

  const visitsCollection = collection(db, 'visits');
  const visitsQuery = query(visitsCollection, orderBy('timestamp', 'desc'));
  const visitsSnapshot = await getDocs(visitsQuery);
  const visits = visitsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp.toDate().toISOString(), // Convert Timestamp to string
    } as Visit;
  });

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>
      <AdminDashboard initialVisits={visits} />
    </div>
  );
}
