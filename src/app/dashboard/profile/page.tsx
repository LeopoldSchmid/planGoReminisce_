'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Assuming Avatar is added via Shadcn

import { EditProfileForm } from "@/app/dashboard/profile/EditProfileForm";

export default function ProfilePage() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the DashboardLayout, 
    // but as a fallback:
    return (
      <div className="flex justify-center items-center h-full">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  // Helper to get initials for AvatarFallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">User Profile</CardTitle>
          <CardDescription>
            View and manage your profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || user.email} />
              <AvatarFallback>
                {getInitials(profile?.full_name || profile?.username || user.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">
                {profile?.full_name || profile?.username || 'User'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Profile Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-semibold">Username:</span> {profile?.username || 'Not set'}
              </div>
              <div>
                <span className="font-semibold">Full Name:</span> {profile?.full_name || 'Not set'}
              </div>
              <div>
                <span className="font-semibold">User ID:</span> {user.id}
              </div>
               <div>
                <span className="font-semibold">Profile Last Updated:</span> {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <EditProfileForm profile={profile} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
