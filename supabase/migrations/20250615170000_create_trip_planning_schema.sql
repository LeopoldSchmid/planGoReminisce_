-- Migration: Create trip planning and availability tables
-- Created: 2025-06-15 17:00:00

-- =====================================================
-- USER AVAILABILITY TABLES
-- =====================================================

-- Central user availability calendar
CREATE TABLE user_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    availability_status TEXT NOT NULL CHECK (availability_status IN ('unavailable', 'available')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Trip-specific availability overrides
CREATE TABLE trip_availability_overrides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    availability_status TEXT NOT NULL CHECK (availability_status IN ('unavailable', 'available')),
    override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, user_id, date)
);

-- =====================================================
-- PROPOSAL TABLES
-- =====================================================

-- Date range proposals for trips
CREATE TABLE date_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    proposed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    is_finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Destination proposals (can be standalone or linked to date proposals)
CREATE TABLE destination_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    date_proposal_id UUID NULL REFERENCES date_proposals(id) ON DELETE CASCADE,
    proposed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination_name TEXT NOT NULL,
    destination_description TEXT,
    destination_notes TEXT,
    is_finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DISCUSSION AND VOTING TABLES
-- =====================================================

-- Discussion threads for proposals and general trip planning
CREATE TABLE proposal_discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    date_proposal_id UUID NULL REFERENCES date_proposals(id) ON DELETE CASCADE,
    destination_proposal_id UUID NULL REFERENCES destination_proposals(id) ON DELETE CASCADE,
    parent_comment_id UUID NULL REFERENCES proposal_discussions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT discussion_scope_check CHECK (
        -- Must be linked to either trip (general discussion), date proposal, or destination proposal
        (trip_id IS NOT NULL AND date_proposal_id IS NULL AND destination_proposal_id IS NULL) OR
        (date_proposal_id IS NOT NULL) OR
        (destination_proposal_id IS NOT NULL)
    )
);

-- Voting system for proposals
CREATE TABLE proposal_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    date_proposal_id UUID NULL REFERENCES date_proposals(id) ON DELETE CASCADE,
    destination_proposal_id UUID NULL REFERENCES destination_proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote', 'neutral')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT vote_scope_check CHECK (
        -- Must vote on either date proposal or destination proposal, not both
        (date_proposal_id IS NOT NULL AND destination_proposal_id IS NULL) OR
        (destination_proposal_id IS NOT NULL AND date_proposal_id IS NULL)
    ),
    UNIQUE(user_id, date_proposal_id),
    UNIQUE(user_id, destination_proposal_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User availability indexes
CREATE INDEX idx_user_availability_user_date ON user_availability(user_id, date);
CREATE INDEX idx_user_availability_date_range ON user_availability(date);

-- Trip availability overrides indexes
CREATE INDEX idx_trip_availability_trip_user ON trip_availability_overrides(trip_id, user_id);
CREATE INDEX idx_trip_availability_trip_date ON trip_availability_overrides(trip_id, date);

-- Date proposals indexes
CREATE INDEX idx_date_proposals_trip_id ON date_proposals(trip_id);
CREATE INDEX idx_date_proposals_date_range ON date_proposals(start_date, end_date);
CREATE INDEX idx_date_proposals_finalized ON date_proposals(trip_id, is_finalized);

-- Destination proposals indexes
CREATE INDEX idx_destination_proposals_trip_id ON destination_proposals(trip_id);
CREATE INDEX idx_destination_proposals_date_link ON destination_proposals(date_proposal_id);

-- Discussion indexes
CREATE INDEX idx_proposal_discussions_trip_id ON proposal_discussions(trip_id);
CREATE INDEX idx_proposal_discussions_date_proposal ON proposal_discussions(date_proposal_id);
CREATE INDEX idx_proposal_discussions_destination_proposal ON proposal_discussions(destination_proposal_id);
CREATE INDEX idx_proposal_discussions_parent ON proposal_discussions(parent_comment_id);

-- Vote indexes
CREATE INDEX idx_proposal_votes_date_proposal ON proposal_votes(date_proposal_id);
CREATE INDEX idx_proposal_votes_destination_proposal ON proposal_votes(destination_proposal_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;

-- User availability policies
CREATE POLICY "Users can view their own availability" ON user_availability
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own availability" ON user_availability
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Trip members can view availability of other members" ON user_availability
    FOR SELECT USING (
        user_id IN (
            SELECT tm.user_id 
            FROM trip_members tm 
            WHERE tm.trip_id IN (
                SELECT tm2.trip_id 
                FROM trip_members tm2 
                WHERE tm2.user_id = auth.uid()
            )
        )
    );

-- Trip availability overrides policies
CREATE POLICY "Trip members can view availability overrides for their trips" ON trip_availability_overrides
    FOR SELECT USING (
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own trip availability overrides" ON trip_availability_overrides
    FOR ALL USING (
        auth.uid() = user_id AND 
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

-- Date proposals policies
CREATE POLICY "Trip members can view date proposals for their trips" ON date_proposals
    FOR SELECT USING (
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip members can create date proposals" ON date_proposals
    FOR INSERT WITH CHECK (
        auth.uid() = proposed_by AND
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Proposal authors can update their own proposals" ON date_proposals
    FOR UPDATE USING (auth.uid() = proposed_by);

CREATE POLICY "Trip owners can finalize proposals" ON date_proposals
    FOR UPDATE USING (
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'co-owner')
        )
    );

-- Destination proposals policies
CREATE POLICY "Trip members can view destination proposals for their trips" ON destination_proposals
    FOR SELECT USING (
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip members can create destination proposals" ON destination_proposals
    FOR INSERT WITH CHECK (
        auth.uid() = proposed_by AND
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Proposal authors can update their own destination proposals" ON destination_proposals
    FOR UPDATE USING (auth.uid() = proposed_by);

-- Discussion policies
CREATE POLICY "Trip members can view discussions for their trips" ON proposal_discussions
    FOR SELECT USING (
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip members can create comments" ON proposal_discussions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own comments" ON proposal_discussions
    FOR UPDATE USING (auth.uid() = user_id);

-- Vote policies
CREATE POLICY "Trip members can view votes for their trips" ON proposal_votes
    FOR SELECT USING (
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Trip members can vote on proposals" ON proposal_votes
    FOR ALL USING (
        auth.uid() = user_id AND
        trip_id IN (
            SELECT tm.trip_id 
            FROM trip_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get effective availability for a user on a specific date for a trip
CREATE OR REPLACE FUNCTION get_effective_availability(
    p_trip_id UUID,
    p_user_id UUID,
    p_date DATE
) RETURNS TEXT AS $$
DECLARE
    override_status TEXT;
    base_status TEXT;
BEGIN
    -- Check for trip-specific override first
    SELECT availability_status INTO override_status
    FROM trip_availability_overrides
    WHERE trip_id = p_trip_id AND user_id = p_user_id AND date = p_date;
    
    IF override_status IS NOT NULL THEN
        RETURN override_status;
    END IF;
    
    -- Fall back to base availability
    SELECT availability_status INTO base_status
    FROM user_availability
    WHERE user_id = p_user_id AND date = p_date;
    
    -- Default to 'available' if no specific availability is set
    RETURN COALESCE(base_status, 'available');
END;
$$ LANGUAGE plpgsql;

-- Function to get availability heatmap for a trip and date range
CREATE OR REPLACE FUNCTION get_trip_availability_heatmap(
    p_trip_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    date DATE,
    total_members INTEGER,
    available_count INTEGER,
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

-- Function to get proposal statistics
CREATE OR REPLACE FUNCTION get_proposal_stats(
    p_date_proposal_id UUID DEFAULT NULL,
    p_destination_proposal_id UUID DEFAULT NULL
) RETURNS TABLE (
    upvotes INTEGER,
    downvotes INTEGER,
    neutral_votes INTEGER,
    total_votes INTEGER,
    net_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END)::INTEGER AS upvotes,
        COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END)::INTEGER AS downvotes,
        COUNT(CASE WHEN vote_type = 'neutral' THEN 1 END)::INTEGER AS neutral_votes,
        COUNT(*)::INTEGER AS total_votes,
        (COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) - 
         COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END))::INTEGER AS net_score
    FROM proposal_votes
    WHERE 
        (p_date_proposal_id IS NOT NULL AND date_proposal_id = p_date_proposal_id) OR
        (p_destination_proposal_id IS NOT NULL AND destination_proposal_id = p_destination_proposal_id);
END;
$$ LANGUAGE plpgsql;