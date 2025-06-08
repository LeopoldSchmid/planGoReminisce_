'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  // Placeholder for loading state, can be improved with a proper spinner
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If no user and not loading, redirect to login (basic protection)
  // More robust protection will be added in Task 10
  if (!user) {
    // To prevent redirect loops during initial load or if user becomes null unexpectedly
    // before AuthContext has a chance to redirect, ensure this runs client-side effectively.
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return <div>Redirecting to login...</div>; // Or a loading spinner
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Plangoreminisce</h1>
          {user && (
            <div className="flex items-center space-x-4">
              <span>Welcome, {user.email}</span>
              <Button onClick={handleLogout} variant="destructive" size="sm">
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-gray-200 text-center p-4 text-sm text-gray-600">
        © {new Date().getFullYear()} Plangoreminisce. All rights reserved.
      </footer>
    </div>
  );
}
