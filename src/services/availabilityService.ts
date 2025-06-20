import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const supabase = createSupabaseBrowserClient();

export type AvailabilityStatus = 'available' | 'unavailable' | 'maybe';

export interface UserAvailability {
  id: string;
  user_id: string;
  date: string;
  availability_status: AvailabilityStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TripUserAvailability {
  id: string;
  trip_id: string;
  user_id: string;
  date: string;
  availability_status: AvailabilityStatus;
  override_reason?: string;
  synced_from_central: boolean;
  last_sync_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityHeatmapData {
  date: string;
  total_members: number;
  available_count: number;
  maybe_count: number;
  unavailable_count: number;
  availability_percentage: number;
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

// =====================================================
// USER AVAILABILITY FUNCTIONS (MOVED TO COMPATIBILITY SECTION)
// =====================================================
// Note: The main getUserAvailability and setUserAvailability functions 
// are now in the compatibility section to support both central and trip-specific usage

// =====================================================
// CENTRAL AVAILABILITY FUNCTIONS (USER'S PERSONAL CALENDAR)
// =====================================================

/**
 * Get user's central availability for a date range (personal calendar)
 */
export async function getUserCentralAvailability(
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
      console.error('Error fetching central user availability:', error);
      return { availability: null, error };
    }

    const mappedData = data.map(d => ({ ...d, availability_status: d.availability_status as AvailabilityStatus, notes: d.notes ?? undefined }));
    
    return { availability: mappedData, error: null };
  } catch (err) {
    console.error('Unexpected error in getUserCentralAvailability:', err);
    return { availability: null, error: err };
  }
}

/**
 * Set user's central availability (personal calendar)
 */
export async function setUserCentralAvailability(
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
      console.error('Error setting central user availability:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in setUserCentralAvailability:', err);
    return { success: false, error: err };
  }
}

// =====================================================
// TRIP-SPECIFIC AVAILABILITY FUNCTIONS
// =====================================================

/**
 * Get trip-specific availability for a user
 */
export async function getTripUserAvailability(
  tripId: string,
  userId: string,
  dateRange: DateRange
): Promise<{ availability: TripUserAvailability[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('trip_user_availability')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .gte('date', dateRange.start_date)
      .lte('date', dateRange.end_date)
      .order('date');

    if (error) {
      console.error('Error fetching trip user availability:', error);
      return { availability: null, error };
    }

    return { 
      availability: data.map(d => ({ 
        ...d, 
        availability_status: d.availability_status as AvailabilityStatus, 
        override_reason: d.override_reason ?? undefined,
        last_sync_date: d.last_sync_date ?? undefined
      })), 
      error: null 
    };
  } catch (err) {
    console.error('Unexpected error in getTripUserAvailability:', err);
    return { availability: null, error: err };
  }
}

/**
 * Set trip-specific availability
 */
export async function setTripUserAvailability(
  tripId: string,
  userId: string,
  availability: Array<{
    date: string;
    availability_status: AvailabilityStatus;
    override_reason?: string;
    synced_from_central?: boolean;
  }>
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('trip_user_availability')
      .upsert(
        availability.map(a => ({
          trip_id: tripId,
          user_id: userId,
          date: a.date,
          availability_status: a.availability_status,
          override_reason: a.override_reason,
          synced_from_central: a.synced_from_central ?? false,
          updated_at: new Date().toISOString()
        })),
        {
          onConflict: 'trip_id,user_id,date',
          ignoreDuplicates: false
        }
      );

    if (error) {
      console.error('Error setting trip user availability:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in setTripUserAvailability:', err);
    return { success: false, error: err };
  }
}

/**
 * Clear trip-specific availability
 */
export async function clearTripUserAvailability(
  tripId: string,
  userId: string,
  dates: string[]
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('trip_user_availability')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .in('date', dates);

    if (error) {
      console.error('Error clearing trip user availability:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in clearTripUserAvailability:', err);
    return { success: false, error: err };
  }
}

// =====================================================
// SYNC FUNCTIONS
// =====================================================

/**
 * Sync central availability to trip calendar
 */
export async function syncCentralToTripAvailability(
  userId: string,
  tripId: string,
  dateRange: DateRange
): Promise<{ syncedCount: number; error: any }> {
  try {
    const { data, error } = await supabase
      .rpc('sync_central_to_trip_availability', {
        p_user_id: userId,
        p_trip_id: tripId,
        p_start_date: dateRange.start_date,
        p_end_date: dateRange.end_date
      })
      .single();

    if (error) {
      console.error('Error syncing central to trip availability:', error);
      return { syncedCount: 0, error };
    }

    return { syncedCount: data || 0, error: null };
  } catch (err) {
    console.error('Unexpected error in syncCentralToTripAvailability:', err);
    return { syncedCount: 0, error: err };
  }
}

/**
 * Check if trip availability needs sync with central calendar
 */
export async function checkTripAvailabilitySyncStatus(
  userId: string,
  tripId: string,
  dateRange: DateRange
): Promise<{ 
  needsSync: boolean; 
  centralCount: number; 
  tripCount: number; 
  lastSync?: string;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .rpc('check_trip_availability_sync_status', {
        p_user_id: userId,
        p_trip_id: tripId,
        p_start_date: dateRange.start_date,
        p_end_date: dateRange.end_date
      })
      .single();

    if (error) {
      console.error('Error checking sync status:', error);
      return { needsSync: false, centralCount: 0, tripCount: 0, error };
    }

    return { 
      needsSync: data.needs_sync,
      centralCount: data.central_count,
      tripCount: data.trip_count,
      lastSync: data.last_sync,
      error: null 
    };
  } catch (err) {
    console.error('Unexpected error in checkTripAvailabilitySyncStatus:', err);
    return { needsSync: false, centralCount: 0, tripCount: 0, error: err };
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

    // Get trip-specific availability
    const { data: tripAvailability, error: tripError } = await supabase
      .from('trip_user_availability')
      .select('user_id, date, availability_status, override_reason')
      .eq('trip_id', tripId)
      .gte('date', dateRange.start_date)
      .lte('date', dateRange.end_date);

    if (tripError) {
      return { availability: null, error: tripError };
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
        const tripSpecific = tripAvailability?.find(t => t.user_id === member.user_id && t.date === date);
        const central = baseAvailability?.find(b => b.user_id === member.user_id && b.date === date);

        if (tripSpecific) {
          result.push({
            user_id: member.user_id,
            date,
            status: tripSpecific.availability_status as AvailabilityStatus,
            is_override: true,
            override_reason: tripSpecific.override_reason ?? undefined
          });
        } else if (central) {
          result.push({
            user_id: member.user_id,
            date,
            status: central.availability_status as AvailabilityStatus,
            is_override: false,
            notes: central.notes ?? undefined
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

// =====================================================
// COMPATIBILITY FUNCTIONS FOR EXISTING COMPONENTS
// =====================================================

/**
 * Backward compatibility function - maps to trip-specific availability
 * @deprecated Use getTripUserAvailability instead
 */
export async function getUserAvailability(
  userId: string,
  dateRange: DateRange,
  tripId?: string
): Promise<{ availability: UserAvailability[] | null; error: any }> {
  if (tripId) {
    // If tripId provided, get trip-specific availability
    const result = await getTripUserAvailability(tripId, userId, dateRange);
    if (result.error) return { availability: null, error: result.error };
    
    // Map to old format
    const mapped = result.availability?.map(a => ({
      id: a.id,
      user_id: a.user_id,
      date: a.date,
      availability_status: a.availability_status,
      notes: a.override_reason,
      created_at: a.created_at,
      updated_at: a.updated_at
    })) || null;
    
    return { availability: mapped, error: null };
  } else {
    // Otherwise get central availability
    return getUserCentralAvailability(userId, dateRange);
  }
}

/**
 * Backward compatibility function - maps to trip-specific availability setting
 * @deprecated Use setTripUserAvailability instead
 */
export async function setUserAvailability(
  userId: string,
  dates: Array<{
    date: string;
    availability_status: AvailabilityStatus;
    notes?: string;
  }>,
  tripId?: string
): Promise<{ success: boolean; error: any }> {
  if (tripId) {
    // If tripId provided, set trip-specific availability
    const mapped = dates.map(d => ({
      date: d.date,
      availability_status: d.availability_status,
      override_reason: d.notes,
      synced_from_central: false
    }));
    
    return setTripUserAvailability(tripId, userId, mapped);
  } else {
    // Otherwise set central availability
    return setUserCentralAvailability(userId, dates);
  }
}

/**
 * Clear user's availability for specific dates
 * @deprecated Use clearTripUserAvailability or clear central availability directly
 */
export async function clearUserAvailability(
  userId: string,
  dates: string[],
  tripId?: string
): Promise<{ success: boolean; error: any }> {
  if (tripId) {
    return clearTripUserAvailability(tripId, userId, dates);
  } else {
    // Clear from central availability
    try {
      const { error } = await supabase
        .from('user_availability')
        .delete()
        .eq('user_id', userId)
        .in('date', dates);

      if (error) {
        console.error('Error clearing central user availability:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('Unexpected error in clearUserAvailability:', err);
      return { success: false, error: err };
    }
  }
}