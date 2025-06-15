import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import type { TablesInsert, Database } from '@/types/supabase';

const supabase = createSupabaseBrowserClient();

type TripInsert = TablesInsert<'trips'>;
type TripMemberInsert = TablesInsert<'trip_members'>;

type TripRow = Database['public']['Tables']['trips']['Row'];

type CreateTripParams = {
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    user_id: string;
};

export async function createTrip({ name, description, start_date, end_date, user_id }: CreateTripParams): Promise<{ trip: TripRow | null; error: any }> {
    // Debug log
    console.log('Creating trip with:', { name, description, start_date, end_date, created_by: user_id });

    // 1. Create the trip
    const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert([
            {
                name,
                description: description ?? null,
                start_date: start_date ?? null,
                end_date: end_date ?? null,
                created_by: user_id,
            } as TripInsert,
        ])
        .select()
        .single();

    if (tripError) {
        console.error('Trip creation error:', tripError);
        return { error: tripError, trip: null };
    }

    // 2. Add the creator as owner in trip_members
    const { error: memberError } = await supabase
        .from('trip_members')
        .insert([
            {
                trip_id: trip.id,
                user_id,
                role: 'owner',
            } as TripMemberInsert,
        ]);

    if (memberError) {
        // Optionally: Rollback trip creation if needed
        console.error('Trip member creation error:', memberError);
        return { error: memberError, trip: null };
    }

    return { trip, error: null };
}

export async function getUserTrips(user_id: string): Promise<{ trips: TripRow[] | null; error: any }> {
    // Get all trips where the user is a member
    const { data, error } = await supabase
        .from('trips')
        .select('*')
        .in('id',
            (await supabase
                .from('trip_members')
                .select('trip_id')
                .eq('user_id', user_id)
            ).data?.map((m) => m.trip_id) || []
        );
    return { trips: data, error };
}

// Define a type for the trip details, which might include members in the future
export type TripDetails = TripRow & {
  // members?: any[]; // Placeholder for future member details
};

export async function getTripById(
  tripId: string,
  userId: string
): Promise<{ trip: TripDetails | null; error: any }> {
  // First, verify the user is a member of the trip
  const { data: memberData, error: memberError } = await supabase
    .from('trip_members')
    .select('user_id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle();

  if (memberError) {
    console.error('Error checking trip membership:', memberError);
    return { trip: null, error: memberError };
  }

  if (!memberData) {
    console.warn(`User ${userId} is not a member of trip ${tripId} or trip does not exist.`);
    return { trip: null, error: { message: 'Access denied or trip not found.', code: '404' } };
  }

  // If user is a member, fetch the trip details
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*') // In the future, you might want to select specific columns or join with other tables
    .eq('id', tripId)
    .single();

  if (tripError) {
    console.error('Error fetching trip details:', tripError);
    return { trip: null, error: tripError };
  }

  return { trip, error: null };
}

type TripMemberRow = Database['public']['Tables']['trip_members']['Row'];

export type TripMemberWithProfile = {
  user_id: string;
  role: string; // Matches TEXT from SQL function
  joined_at: string;
  username: string | null; // Directly from profiles table via SQL function
  full_name: string | null; // Directly from profiles table via SQL function
  avatar_url: string | null; // Directly from profiles table via SQL function
};

export async function getTripMembers(
  tripId: string,
  requesterUserId: string
): Promise<{ members: TripMemberWithProfile[] | null; error: any }> {
  // Call the RPC function to get trip members with profiles.
  // The SQL function itself handles the authorization check (requester is a member).
  const { data: members, error } = await supabase.rpc('get_trip_members_with_profiles', {
    p_trip_id: tripId,
    p_requester_user_id: requesterUserId,
  });

  if (error) {
    console.error('Error fetching trip members via RPC:', error);
    // Check if the error indicates 'access denied' which our SQL function might return as empty or via specific error handling
    // For now, we just return the generic error.
    // If the SQL function returns an empty array for non-members, 'members' would be [] and error would be null.
    return { members: null, error };
  }

  // If the SQL function returns an empty array when the requester is not a member (as currently designed),
  // and data is an empty array with no error, this indicates either no members or access denied by the function logic.
  // We might want to distinguish this from a general error if the SQL function were to raise specific errors.
  if (members && members.length === 0) {
    // This could mean no members, or the SQL function returned empty due to auth check.
    // The SQL function currently returns an empty set if the requester is not a member.
    // To provide a more specific error, the SQL function would need to RAISE an exception for '403 Forbidden'.
    // For now, an empty array is a valid result (no members or access implicitly denied by empty result).
  }

  return { members: members as TripMemberWithProfile[], error: null };
}

export async function inviteMemberByEmail(
  tripId: string,
  inviterUserId: string,
  inviteeEmail: string
): Promise<{ member: TripMemberRow | null; error: any }> {
  // 1. Verify inviter has permission (owner or co-owner)
  const { data: inviterMembership, error: inviterError } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', inviterUserId)
    .single();

  if (inviterError || !inviterMembership) {
    console.error('Error fetching inviter role or inviter not a member:', inviterError);
    return { member: null, error: { message: 'Permission denied: Inviter not found or not a member of the trip.' } };
  }

  if (inviterMembership.role !== 'owner' && inviterMembership.role !== 'co-owner') {
    return { member: null, error: { message: 'Permission denied: Only trip owners or co-owners can invite members.' } };
  }

  // 2. Get invitee's user_id from email using RPC call.
  // The return type of `data` from `supabase.rpc` will be inferred from your generated types.
  // If `get_user_id_by_email` is correctly typed in `supabase.ts` to return `string | null` (or `UUID | null`),
  // then `inviteeUserIdFromRpc` should have that type.
  const { data: inviteeUserIdFromRpc, error: rpcError } = await supabase.rpc(
    'get_user_id_by_email',
    { user_email: inviteeEmail } 
  );

  if (rpcError) {
    console.error('Error calling get_user_id_by_email RPC:', rpcError);
    // It's good practice to check the specific error type if Supabase provides one for RPC not found vs. other errors.
    return { member: null, error: { message: `Error looking up user: ${rpcError.message}` } };
  }

  // `inviteeUserIdFromRpc` will be null if the function returns NULL (email not found), or the UUID string if found.
  if (!inviteeUserIdFromRpc) {
    console.log(`User with email ${inviteeEmail} not found in auth.users.`);
    return { member: null, error: { message: `User with email ${inviteeEmail} not found. Consider sending an invitation link.` } };
  }
  
  // Ensure inviteeUserId is treated as a string for subsequent Supabase client calls.
  const finalInviteeUserId: string = inviteeUserIdFromRpc as string;

  // 3. Check if invitee is already a member
  const { data: existingMember, error: existingMemberError } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', finalInviteeUserId) // Use the correctly typed and non-null user ID
    .maybeSingle();

  if (existingMemberError) {
    console.error('Error checking existing membership:', existingMemberError);
    return { member: null, error: existingMemberError };
  }

  if (existingMember) {
    return { member: null, error: { message: 'User is already a member of this trip.' } };
  }

  // 4. Add invitee to trip_members
  const { data: newMember, error: newMemberError } = await supabase
    .from('trip_members')
    .insert({
      trip_id: tripId,
      user_id: finalInviteeUserId, // Use the correctly typed and non-null user ID
      role: 'member', // Default role for new invites
    } as TripMemberInsert) // The cast to TripMemberInsert might need adjustment if types are very strict
    .select()
    .single();

  if (newMemberError) {
    console.error('Error adding new member to trip:', newMemberError);
    return { member: null, error: newMemberError };
  }

  return { member: newMember, error: null };
}

// New type for the return of generateTripInvitationLink
export type TripInvitationLinkResult = {
  invitationLink: string | null; // e.g., https://yourdomain.com/join-trip?token=THE_TOKEN
  error: any;
};

/**
 * Generates a trip invitation link by calling the create_trip_invitation RPC.
 * @param tripId The ID of the trip for which to generate an invitation.
 * @param invitedEmail Optional email of the person being invited (for tracking).
 * @returns An object containing the full invitationLink or an error.
 */
export async function generateTripInvitationLink(
  tripId: string,
  invitedEmail?: string
): Promise<TripInvitationLinkResult> {
  const { data: token, error: rpcError } = await supabase.rpc('create_trip_invitation', {
    p_trip_id: tripId,
    p_invited_email: invitedEmail || null, // Ensure null is passed if undefined
  });

  if (rpcError) {
    console.error('Error calling create_trip_invitation RPC:', rpcError);
    return { invitationLink: null, error: { message: `Failed to create invitation: ${rpcError.message}` } };
  }

  if (!token) {
    // This case should ideally be handled by the RPC raising an exception if token generation fails
    console.error('Create_trip_invitation RPC returned no token without an error.');
    return { invitationLink: null, error: { message: 'Failed to generate invitation token.' } };
  }

  // Construct the full URL. Replace 'http://localhost:3000' with your actual app URL,
  // possibly from an environment variable.
  // For now, we'll hardcode a common local development URL structure.
  // In a real app, this base URL should be configurable.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const invitationLink = `${baseUrl}/join-trip?token=${token}`;

  return { invitationLink, error: null };
}

// New type for the return of acceptTripInvitation
export type AcceptInvitationResult = {
  tripId: string | null; // The ID of the trip joined
  error: any;
};

/**
 * Accepts a trip invitation by calling the consume_trip_invitation RPC.
 * @param token The invitation token from the URL.
 * @returns An object containing the tripId if successful, or an error.
 */
export async function acceptTripInvitation(token: string): Promise<AcceptInvitationResult> {
  if (!token) {
    return { tripId: null, error: { message: 'Invitation token is required.' } };
  }

  const { data: tripId, error: rpcError } = await supabase.rpc('consume_trip_invitation', {
    p_token: token,
  });

  if (rpcError) {
    console.error('Error calling consume_trip_invitation RPC:', rpcError);
    return { tripId: null, error: { message: `Failed to accept invitation: ${rpcError.message}` } };
  }

  if (!tripId) {
    // This might happen if the RPC returns null for some reason instead of raising an error for invalid token
    console.error('Consume_trip_invitation RPC returned no tripId without an error.');
    return { tripId: null, error: { message: 'Invitation is invalid or could not be processed.' } };
  }

  return { tripId, error: null };
}

/**
 * Deletes a trip. Only owners and co-owners can delete trips.
 * @param tripId The ID of the trip to delete
 * @param userId The ID of the user attempting to delete the trip
 * @returns An object indicating success or error
 */
export async function deleteTrip(tripId: string, userId: string): Promise<{ success: boolean; error: any }> {
  try {
    // First, verify the user has permission to delete (owner or co-owner)
    const { data: memberData, error: memberError } = await supabase
      .from('trip_members')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    if (memberError || !memberData) {
      console.error('Error checking user permissions:', memberError);
      return { success: false, error: { message: 'You do not have permission to delete this trip.' } };
    }

    if (memberData.role !== 'owner' && memberData.role !== 'co-owner') {
      return { success: false, error: { message: 'Only trip owners and co-owners can delete trips.' } };
    }

    // Delete the trip (cascade will handle trip_members and other related data)
    const { error: deleteError } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (deleteError) {
      console.error('Error deleting trip:', deleteError);
      return { success: false, error: { message: `Failed to delete trip: ${deleteError.message}` } };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Unexpected error deleting trip:', err);
    return { success: false, error: { message: err.message || 'An unexpected error occurred.' } };
  }
}