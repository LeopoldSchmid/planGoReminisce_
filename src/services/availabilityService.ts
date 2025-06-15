import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const supabase = createSupabaseBrowserClient();

export type AvailabilityStatus = 'available' | 'unavailable';

export interface UserAvailability {
  id: string;
  user_id: string;
  date: string;
  availability_status: AvailabilityStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TripAvailabilityOverride {
  id: string;
  trip_id: string;
  user_id: string;
  date: string;
  availability_status: AvailabilityStatus;
  override_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityHeatmapData {
  date: string;
  total_members: number;
  available_count: number;
  unavailable_count: number;
  availability_percentage: number;
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

// =====================================================
// USER AVAILABILITY FUNCTIONS
// =====================================================

/**
 * Get user's general availability for a date range
 */
export async function getUserAvailability(
  userId: string,
  dateRange: DateRange
): Promise<{ availability: UserAvailability[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('user_availability')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateRange.start_date)
      .lte('date', dateRange.end_date)
      .order('date');

    if (error) {
      console.error('Error fetching user availability:', error);
      return { availability: null, error };
    }

    return { availability: data, error: null };
  } catch (err) {
    console.error('Unexpected error in getUserAvailability:', err);
    return { availability: null, error: err };
  }
}

/**
 * Set user's availability for specific dates
 */
export async function setUserAvailability(
  userId: string,
  dates: Array<{
    date: string;
    availability_status: AvailabilityStatus;
    notes?: string;
  }>
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('user_availability')
      .upsert(
        dates.map(d => ({
          user_id: userId,
          date: d.date,
          availability_status: d.availability_status,
          notes: d.notes,
          updated_at: new Date().toISOString()
        })),
        { 
          onConflict: 'user_id,date',
          ignoreDuplicates: false 
        }
      );

    if (error) {
      console.error('Error setting user availability:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in setUserAvailability:', err);
    return { success: false, error: err };
  }
}

/**
 * Clear user's availability for specific dates
 */
export async function clearUserAvailability(
  userId: string,
  dates: string[]
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('user_availability')
      .delete()
      .eq('user_id', userId)
      .in('date', dates);

    if (error) {
      console.error('Error clearing user availability:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in clearUserAvailability:', err);
    return { success: false, error: err };
  }
}

// =====================================================
// TRIP AVAILABILITY OVERRIDE FUNCTIONS
// =====================================================

/**
 * Get trip-specific availability overrides for a user
 */
export async function getTripAvailabilityOverrides(
  tripId: string,
  userId: string,
  dateRange: DateRange
): Promise<{ overrides: TripAvailabilityOverride[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('trip_availability_overrides')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .gte('date', dateRange.start_date)
      .lte('date', dateRange.end_date)
      .order('date');

    if (error) {
      console.error('Error fetching trip availability overrides:', error);
      return { overrides: null, error };
    }

    return { overrides: data, error: null };
  } catch (err) {
    console.error('Unexpected error in getTripAvailabilityOverrides:', err);
    return { overrides: null, error: err };
  }
}

/**
 * Set trip-specific availability overrides
 */
export async function setTripAvailabilityOverrides(
  tripId: string,
  userId: string,
  overrides: Array<{
    date: string;
    availability_status: AvailabilityStatus;
    override_reason?: string;
  }>
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('trip_availability_overrides')
      .upsert(
        overrides.map(o => ({
          trip_id: tripId,
          user_id: userId,
          date: o.date,
          availability_status: o.availability_status,
          override_reason: o.override_reason,
          updated_at: new Date().toISOString()
        })),
        { 
          onConflict: 'trip_id,user_id,date',
          ignoreDuplicates: false 
        }
      );

    if (error) {
      console.error('Error setting trip availability overrides:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in setTripAvailabilityOverrides:', err);
    return { success: false, error: err };
  }
}

/**
 * Clear trip-specific availability overrides
 */
export async function clearTripAvailabilityOverrides(
  tripId: string,
  userId: string,
  dates: string[]
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('trip_availability_overrides')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .in('date', dates);

    if (error) {
      console.error('Error clearing trip availability overrides:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in clearTripAvailabilityOverrides:', err);
    return { success: false, error: err };
  }
}

// =====================================================
// AVAILABILITY HEATMAP FUNCTIONS
// =====================================================

/**
 * Get availability heatmap data for a trip and date range
 */
export async function getTripAvailabilityHeatmap(
  tripId: string,
  dateRange: DateRange
): Promise<{ heatmap: AvailabilityHeatmapData[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .rpc('get_trip_availability_heatmap', {
        p_trip_id: tripId,
        p_start_date: dateRange.start_date,
        p_end_date: dateRange.end_date
      });

    if (error) {
      console.error('Error fetching trip availability heatmap:', error);
      return { heatmap: null, error };
    }

    return { heatmap: data, error: null };
  } catch (err) {
    console.error('Unexpected error in getTripAvailabilityHeatmap:', err);
    return { heatmap: null, error: err };
  }
}

/**
 * Get effective availability for a specific user on specific dates for a trip
 */
export async function getEffectiveAvailability(
  tripId: string,
  userId: string,
  dates: string[]
): Promise<{ availability: Array<{ date: string; status: AvailabilityStatus }> | null; error: any }> {
  try {
    const results = await Promise.all(
      dates.map(async (date) => {
        const { data, error } = await supabase
          .rpc('get_effective_availability', {
            p_trip_id: tripId,
            p_user_id: userId,
            p_date: date
          });

        if (error) {
          throw error;
        }

        return { date, status: data as AvailabilityStatus };
      })
    );

    return { availability: results, error: null };
  } catch (err) {
    console.error('Unexpected error in getEffectiveAvailability:', err);
    return { availability: null, error: err };
  }
}

// =====================================================
// BULK AVAILABILITY OPERATIONS
// =====================================================

/**
 * Get availability for all trip members for a date range
 */
export async function getTripMembersAvailability(
  tripId: string,
  dateRange: DateRange
): Promise<{ 
  availability: Array<{
    user_id: string;
    date: string;
    status: AvailabilityStatus;
    is_override: boolean;
    notes?: string;
    override_reason?: string;
  }> | null; 
  error: any 
}> {
  try {
    // Get all trip members
    const { data: members, error: membersError } = await supabase
      .from('trip_members')
      .select('user_id')
      .eq('trip_id', tripId);

    if (membersError || !members) {
      return { availability: null, error: membersError };
    }

    // Get base availability for all members
    const { data: baseAvailability, error: baseError } = await supabase
      .from('user_availability')
      .select('user_id, date, availability_status, notes')
      .in('user_id', members.map(m => m.user_id))
      .gte('date', dateRange.start_date)
      .lte('date', dateRange.end_date);

    if (baseError) {
      return { availability: null, error: baseError };
    }

    // Get trip-specific overrides
    const { data: overrides, error: overridesError } = await supabase
      .from('trip_availability_overrides')
      .select('user_id, date, availability_status, override_reason')
      .eq('trip_id', tripId)
      .gte('date', dateRange.start_date)
      .lte('date', dateRange.end_date);

    if (overridesError) {
      return { availability: null, error: overridesError };
    }

    // Generate all date combinations and merge data
    const dates = generateDateRange(dateRange.start_date, dateRange.end_date);
    const result: Array<{
      user_id: string;
      date: string;
      status: AvailabilityStatus;
      is_override: boolean;
      notes?: string;
      override_reason?: string;
    }> = [];

    for (const member of members) {
      for (const date of dates) {
        const override = overrides?.find(o => o.user_id === member.user_id && o.date === date);
        const base = baseAvailability?.find(b => b.user_id === member.user_id && b.date === date);

        if (override) {
          result.push({
            user_id: member.user_id,
            date,
            status: override.availability_status as AvailabilityStatus,
            is_override: true,
            override_reason: override.override_reason
          });
        } else if (base) {
          result.push({
            user_id: member.user_id,
            date,
            status: base.availability_status as AvailabilityStatus,
            is_override: false,
            notes: base.notes
          });
        } else {
          // Default to available if no specific availability is set
          result.push({
            user_id: member.user_id,
            date,
            status: 'available',
            is_override: false
          });
        }
      }
    }

    return { availability: result, error: null };
  } catch (err) {
    console.error('Unexpected error in getTripMembersAvailability:', err);
    return { availability: null, error: err };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate an array of date strings between start and end dates (inclusive)
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Get the next N days from today
 */
export function getNextNDays(days: number): DateRange {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);

  return {
    start_date: today.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0]
  };
}

/**
 * Get date range for a specific month
 */
export function getMonthDateRange(year: number, month: number): DateRange {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0]
  };
}