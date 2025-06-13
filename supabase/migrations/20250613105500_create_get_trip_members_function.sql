-- Migration to create a SQL function to fetch trip members with their profiles.

CREATE OR REPLACE FUNCTION get_trip_members_with_profiles(
    p_trip_id UUID,
    p_requester_user_id UUID
)
RETURNS TABLE (
    user_id UUID,
    role TEXT, -- Role in the trip: owner, co-owner, member
    joined_at TIMESTAMPTZ,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Important for accessing tables like profiles if RLS is restrictive
AS $$
BEGIN
    -- First, check if the requester is a member of the trip
    IF NOT EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = p_trip_id AND tm.user_id = p_requester_user_id
    ) THEN
        -- Requester is not a member, return empty set or raise an error
        -- For simplicity, returning empty. Consider raising an exception for clearer error handling.
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TIMESTAMPTZ, NULL::TEXT, NULL::TEXT, NULL::TEXT WHERE FALSE;
        RETURN;
    END IF;

    -- If requester is a member, fetch and return the trip members with their profiles
    RETURN QUERY
    SELECT
        tm.user_id,
        tm.role,
        tm.joined_at,
        p.username,
        p.full_name,
        p.avatar_url
    FROM
        public.trip_members tm
    JOIN
        public.profiles p ON tm.user_id = p.id
    WHERE
        tm.trip_id = p_trip_id;
END;
$$;
