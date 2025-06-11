'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user and not loading, redirect to login
  if (!user) {
    router.push('/login');
    return null;
  }

  // User is authenticated, show dashboard
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="mb-6 flex gap-4">
        <a href="/dashboard/trips" className="text-blue-600 hover:underline">My Trips</a>
        <a href="/dashboard/profile" className="text-blue-600 hover:underline">Profile</a>
      </nav>
      {children}
    </main>
  );
}
