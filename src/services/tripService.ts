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

  // 2. Get invitee's user_id from email.
  //    IMPORTANT: This step requires a Supabase Edge Function or RPC call
  //    to securely query auth.users by email.
  //    For now, we'll simulate this and assume we get an ID.
  //    Replace this with a call to your Supabase function, e.g.,
  //    const { data: inviteeUserData, error: inviteeUserError } = await supabase.functions.invoke('get-user-by-email', { email: inviteeEmail });
  
  console.warn("SIMULATING get user_id from email. Replace with secure Supabase function call.");
  // Placeholder: In a real scenario, you'd call a Supabase function here.
  // This is a simplified and insecure way to do it for local testing if RLS allows profile reads.
  // DO NOT use this approach in production for querying users by email from the client.
  const { data: inviteeProfile, error: inviteeProfileError } = await supabase
    .from('profiles') // Assuming email is in profiles and readable by authenticated users for this example
    .select('id')
    .eq('email', inviteeEmail) // This assumes 'email' field exists and is unique in 'profiles'
    .single();

  if (inviteeProfileError || !inviteeProfile) {
    console.error('Error finding user by email or user does not exist:', inviteeProfileError);
    return { member: null, error: { message: `User with email ${inviteeEmail} not found.` } };
  }
  const inviteeUserId = inviteeProfile.id;
  // End of placeholder for getting user_id from email

  // 3. Check if invitee is already a member
  const { data: existingMember, error: existingMemberError } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', inviteeUserId)
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
      user_id: inviteeUserId,
      role: 'member', // Default role for new invites
    } as TripMemberInsert)
    .select()
    .single();

  if (newMemberError) {
    console.error('Error adding new member to trip:', newMemberError);
    return { member: null, error: newMemberError };
  }

  return { member: newMember, error: null };
}