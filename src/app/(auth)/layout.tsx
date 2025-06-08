'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated and not loading, redirect from auth pages to dashboard
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // If user is authenticated and still loading or redirecting, show a loading or blank state
  // to prevent flashing the auth page content briefly.
  if (user && isLoading) {
    return <div>Loading...</div>; // Or a blank page, or a spinner
  }
  if (user && !isLoading) { // Already logged in, redirecting
      return <div>Redirecting to dashboard...</div>; // Or null/spinner
  }

  // If not authenticated, show the auth page (login/signup)
  return <>{children}</>;
}
