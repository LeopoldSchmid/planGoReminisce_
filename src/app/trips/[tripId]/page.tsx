'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTripById, getTripMembers, TripDetails, TripMemberWithProfile } from '@/services/tripService';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'; // For getting current user
import { User } from '@supabase/supabase-js';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Added for future use (e.g., invite member)
import { Separator } from '@/components/ui/separator'; // For visual separation

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [members, setMembers] = useState<TripMemberWithProfile[] | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (tripId && currentUser) {
      // currentUser is confirmed non-null here.
      const confirmedUserId: string = currentUser.id; // Assign to a new, explicitly typed const.

      // Use an async IIFE. Pass `confirmedUserId` to it.
      (async (userIdForFetch: string) => { // Parameter name distinct from outer scope variables.
        setLoading(true);
        setError(null);
        try {
          // userIdForFetch is the non-null string passed to this IIFE.
          const [{ trip: tripData, error: tripError }, { members: membersData, error: membersError }] = await Promise.all([
            getTripById(tripId, userIdForFetch),
            getTripMembers(tripId, userIdForFetch)
          ]);

          if (tripError) {
            console.error('Error fetching trip details:', tripError);
            setError(tripError.message || 'Failed to load trip details.');
            setTrip(null);
          } else {
            setTrip(tripData);
          }

          if (membersError) {
            console.error('Error fetching trip members:', membersError);
            setError(prevError => prevError ? `${prevError}\n${membersError.message || 'Failed to load trip members.'}` : (membersError.message || 'Failed to load trip members.'));
            setMembers(null);
          } else {
            setMembers(membersData);
          }
        } catch (e: any) {
          console.error('Unexpected error fetching trip data:', e);
          setError(e.message || 'An unexpected error occurred.');
          setTrip(null);
          setMembers(null);
        }
        setLoading(false);
      })(confirmedUserId); // Immediately invoke with confirmedUserId.

    } else {
      // Conditions for fetching are not met (no tripId or no currentUser).
      setLoading(false);
      setTrip(null);
      setMembers(null);
      if (tripId && !currentUser) {
        // Optionally, set an error if tripId is present but user is not authenticated.
        // setError("Please log in to view trip details.");
      }
    }
  }, [tripId, currentUser]); // Dependencies

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 ml-auto" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 ml-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!trip) {
    // This case should ideally be covered by the error state if getTripById returns an error for not found/access denied.
    // If getTripById returns { trip: null, error: null } for some reason, this will catch it.
    return (
      <div className="container mx-auto p-4">
        <Alert variant="default">
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Trip not found or you do not have access.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{trip.name}</CardTitle>
          <CardDescription>
            {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : 'N/A'} - 
            {trip.end_date ? new Date(trip.end_date).toLocaleDateString() : 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>{trip.description || 'No description provided.'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Members ({members?.length || 0})</CardTitle>
          {/* TODO: Add Invite Member Button here, visible to owners/co-owners */}
          {/* <Button size="sm">Invite Member</Button> */}
        </CardHeader>
        <CardContent>
          {members && members.length > 0 ? (
            <ul className="space-y-4">
              {members.map((member, index) => (
                <li key={member.user_id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.avatar_url || undefined} alt={member.full_name || member.username || 'User avatar'} />
                        <AvatarFallback>
                          {member.full_name ? member.full_name.substring(0, 2).toUpperCase() : (member.username ? member.username.substring(0, 2).toUpperCase() : '??')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.full_name || member.username || 'Unnamed User'}</p>
                        <p className="text-xs text-gray-500">{member.username || 'No username'}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>{member.role}</Badge>
                  </div>
                  {index < members.length - 1 && <Separator className="my-3" />} {/* Add separator between members */}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No members found for this trip, or you may not have permission to view them.</p>
          )}
        </CardContent>
      </Card>
      {/* TODO: Add Invite Member Modal/Dialog here */}
    </div>
  );
}
