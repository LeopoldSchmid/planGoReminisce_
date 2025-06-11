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