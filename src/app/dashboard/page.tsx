'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('[DashboardPage] Mounted with auth state:', { user, isLoading });
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading your dashboard...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Hello, {user?.profile?.username || user?.email || 'User'}!</p>
          <p className="text-sm text-muted-foreground mt-2">This is your personal dashboard where you can manage your trips and memories.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">No trips yet. Start by creating your first trip!</p>
          <Button>Create Trip</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/profile" className="text-blue-600 hover:underline block" prefetch={true}>
            Edit your profile
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
