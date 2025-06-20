-- Migration: Refactor availability system for clear separation
-- Created: 2025-06-20 13:00:00

-- =====================================================
-- RENAME TABLES FOR CLARITY
-- =====================================================

-- Rename trip_availability_overrides to trip_user_availability for clarity
ALTER TABLE trip_availability_overrides 
RENAME TO trip_user_availability;

-- Update indexes to match new table name
DROP INDEX IF EXISTS idx_trip_availability_trip_user;
DROP INDEX IF EXISTS idx_trip_availability_trip_date;

CREATE INDEX idx_trip_user_availability_trip_user ON trip_user_availability(trip_id, user_id);
CREATE INDEX idx_trip_user_availability_trip_date ON trip_user_availability(trip_id, date);

-- =====================================================
-- ADD SYNC TRACKING FIELDS
-- =====================================================

-- Add sync tracking fields to trip_user_availability
ALTER TABLE trip_user_availability 
ADD COLUMN synced_from_central BOOLEAN DEFAULT FALSE,
ADD COLUMN last_sync_date TIMESTAMP WITH TIME ZONE NULL;

-- Create index for sync queries
CREATE INDEX idx_trip_user_availability_sync ON trip_user_availability(user_id, synced_from_central);

-- =====================================================
-- UPDATE FUNCTIONS FOR NEW TABLE NAME
-- =====================================================

-- Update get_effective_availability function to use new table name
CREATE OR REPLACE FUNCTION get_effective_availability(
    p_trip_id UUID,
    p_user_id UUID,
    p_date DATE
) RETURNS TEXT AS $$
DECLARE
    trip_status TEXT;
    central_status TEXT;
BEGIN
    -- Check for trip-specific availability first
    SELECT availability_status INTO trip_status
    FROM trip_user_availability
    WHERE trip_id = p_trip_id AND user_id = p_user_id AND date = p_date;
    
    IF trip_status IS NOT NULL THEN
        RETURN trip_status;
    END IF;
    
    -- Fall back to central availability
    SELECT availability_status INTO central_status
    FROM user_availability
    WHERE user_id = p_user_id AND date = p_date;
    
    -- Default to 'available' if no specific availability is set
    RETURN COALESCE(central_status, 'available');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- NEW SYNC FUNCTIONS
-- =====================================================

-- Function to sync central availability to trip calendar
CREATE OR REPLACE FUNCTION sync_central_to_trip_availability(
    p_user_id UUID,
    p_trip_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS INTEGER AS $$
DECLARE
    sync_count INTEGER := 0;
    central_record RECORD;
BEGIN
    -- Get all central availability in date range
    FOR central_record IN 
        SELECT date, availability_status, notes
        FROM user_availability
        WHERE user_id = p_user_id 
        AND date >= p_start_date 
        AND date <= p_end_date
    LOOP
        -- Upsert to trip availability
        INSERT INTO trip_user_availability (
            trip_id,
            user_id,
            date,
            availability_status,
            override_reason,
            synced_from_central,
            last_sync_date,
            updated_at
        ) VALUES (
            p_trip_id,
            p_user_id,
            central_record.date,
            central_record.availability_status,
            COALESCE(central_record.notes, 'Synced from central calendar'),
            TRUE,
            NOW(),
            NOW()
        )
        ON CONFLICT (trip_id, user_id, date) DO UPDATE SET
            availability_status = EXCLUDED.availability_status,
            override_reason = EXCLUDED.override_reason,
            synced_from_central = TRUE,
            last_sync_date = NOW(),
            updated_at = NOW()
        WHERE trip_user_availability.synced_from_central = TRUE; -- Only update if previously synced
        
        sync_count := sync_count + 1;
    END LOOP;
    
    RETURN sync_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if trip availability is out of sync
CREATE OR REPLACE FUNCTION check_trip_availability_sync_status(
    p_user_id UUID,
    p_trip_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    needs_sync BOOLEAN,
    central_count INTEGER,
    trip_count INTEGER,
    last_sync TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH central_data AS (
        SELECT COUNT(*) as central_count
        FROM user_availability
        WHERE user_id = p_user_id 
        AND date >= p_start_date 
        AND date <= p_end_date
    ),
    trip_data AS (
        SELECT 
            COUNT(*) as trip_count,
            MAX(last_sync_date) as last_sync
        FROM trip_user_availability
        WHERE user_id = p_user_id 
        AND trip_id = p_trip_id
        AND date >= p_start_date 
        AND date <= p_end_date
        AND synced_from_central = TRUE
    )
    SELECT 
        (cd.central_count > td.trip_count OR td.last_sync IS NULL) as needs_sync,
        cd.central_count::INTEGER,
        COALESCE(td.trip_count, 0)::INTEGER,
        td.last_sync
    FROM central_data cd
    CROSS JOIN trip_data td;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATE RLS POLICIES FOR NEW TABLE NAME
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Trip members can view availability overrides for their trips" ON trip_user_availability;
DROP POLICY IF EXISTS "Users can manage their own trip availability overrides" ON trip_user_availability;

-- Create new policies with better names
CREATE POLICY "Trip members can view trip availability" ON trip_user_availability
    FOR SELECT USING (
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own trip availability" ON trip_user_availability
    FOR ALL USING (
        auth.uid() = user_id AND 
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

-- =====================================================
-- UPDATE HEATMAP FUNCTION FOR BETTER PERFORMANCE
-- =====================================================

-- Drop existing function to change return type
DROP FUNCTION IF EXISTS get_trip_availability_heatmap(UUID, DATE, DATE);

-- Enhanced heatmap function that shows maybe status
CREATE OR REPLACE FUNCTION get_trip_availability_heatmap(
    p_trip_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    date DATE,
    total_members INTEGER,
    available_count INTEGER,
    maybe_count INTEGER,
    unavailable_count INTEGER,
    availability_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH trip_members_list AS (
        SELECT user_id 
        FROM trip_members 
        WHERE trip_id = p_trip_id
    ),
    date_series AS (
        SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS date
    ),
    availability_data AS (
        SELECT 
            ds.date,
            tml.user_id,
            get_effective_availability(p_trip_id, tml.user_id, ds.date) AS status
        FROM date_series ds
        CROSS JOIN trip_members_list tml
    )
    SELECT 
        ad.date,
        COUNT(*)::INTEGER AS total_members,
        COUNT(CASE WHEN ad.status = 'available' THEN 1 END)::INTEGER AS available_count,
        COUNT(CASE WHEN ad.status = 'maybe' THEN 1 END)::INTEGER AS maybe_count,
        COUNT(CASE WHEN ad.status = 'unavailable' THEN 1 END)::INTEGER AS unavailable_count,
        ROUND(
            (COUNT(CASE WHEN ad.status = 'available' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
            2
        ) AS availability_percentage
    FROM availability_data ad
    GROUP BY ad.date
    ORDER BY ad.date;
END;
$$ LANGUAGE plpgsql;