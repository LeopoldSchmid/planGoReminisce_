-- Migration: Fix availability status to support 'maybe' option
-- Created: 2025-06-20 12:00:00

-- Update user_availability table to support 'maybe' status
ALTER TABLE user_availability 
DROP CONSTRAINT user_availability_availability_status_check;

ALTER TABLE user_availability 
ADD CONSTRAINT user_availability_availability_status_check 
CHECK (availability_status IN ('unavailable', 'available', 'maybe'));

-- Update trip_availability_overrides table to support 'maybe' status  
ALTER TABLE trip_availability_overrides 
DROP CONSTRAINT trip_availability_overrides_availability_status_check;

ALTER TABLE trip_availability_overrides 
ADD CONSTRAINT trip_availability_overrides_availability_status_check 
CHECK (availability_status IN ('unavailable', 'available', 'maybe'));

-- Update get_effective_availability function to handle 'maybe' status
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

-- Update proposal votes to use availability-based voting instead of upvote/downvote
-- This aligns the voting system with how users think about availability
ALTER TABLE proposal_votes 
DROP CONSTRAINT proposal_votes_vote_type_check;

ALTER TABLE proposal_votes 
ADD CONSTRAINT proposal_votes_vote_type_check 
CHECK (vote_type IN ('available', 'maybe', 'unavailable'));

-- Update get_proposal_stats function to work with new vote types
CREATE OR REPLACE FUNCTION get_proposal_stats(
    p_date_proposal_id UUID DEFAULT NULL,
    p_destination_proposal_id UUID DEFAULT NULL
) RETURNS TABLE (
    upvotes INTEGER,           -- maps to 'available' votes 
    downvotes INTEGER,         -- maps to 'unavailable' votes
    neutral_votes INTEGER,     -- maps to 'maybe' votes
    total_votes INTEGER,
    net_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN vote_type = 'available' THEN 1 END)::INTEGER AS upvotes,
        COUNT(CASE WHEN vote_type = 'unavailable' THEN 1 END)::INTEGER AS downvotes,
        COUNT(CASE WHEN vote_type = 'maybe' THEN 1 END)::INTEGER AS neutral_votes,
        COUNT(*)::INTEGER AS total_votes,
        (COUNT(CASE WHEN vote_type = 'available' THEN 1 END) - 
         COUNT(CASE WHEN vote_type = 'unavailable' THEN 1 END))::INTEGER AS net_score
    FROM proposal_votes
    WHERE 
        (p_date_proposal_id IS NOT NULL AND date_proposal_id = p_date_proposal_id) OR
        (p_destination_proposal_id IS NOT NULL AND destination_proposal_id = p_destination_proposal_id);
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create vote when user creates a date proposal
-- This represents their availability for the dates they're proposing
CREATE OR REPLACE FUNCTION auto_vote_on_date_proposal()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert an 'available' vote for the user who created the proposal
    INSERT INTO proposal_votes (
        trip_id,
        date_proposal_id,
        user_id,
        vote_type
    ) VALUES (
        NEW.trip_id,
        NEW.id,
        NEW.proposed_by,
        'available'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-vote when date proposal is created
DROP TRIGGER IF EXISTS auto_vote_on_date_proposal_trigger ON date_proposals;
CREATE TRIGGER auto_vote_on_date_proposal_trigger
    AFTER INSERT ON date_proposals
    FOR EACH ROW
    EXECUTE FUNCTION auto_vote_on_date_proposal();