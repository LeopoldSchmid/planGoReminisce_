-- supabase/migrations/20250615125146_create_trip_invitation_rpc_functions.sql

-- Function to create a new trip invitation token
CREATE OR REPLACE FUNCTION public.create_trip_invitation(
    p_trip_id UUID,
    p_invited_email TEXT DEFAULT NULL
)
RETURNS TEXT -- Returns the generated token
LANGUAGE plpgsql
SECURITY DEFINER -- Important for checking inviter's role and inserting into trip_invitations
AS $$
DECLARE
    v_inviter_user_id UUID := auth.uid();
    v_inviter_role TEXT;
    v_token TEXT;
    v_expires_at TIMESTAMPTZ := now() + interval '7 days'; -- Invitation valid for 7 days
BEGIN
    -- Check if the inviter is an owner or co-owner of the trip
    SELECT role INTO v_inviter_role
    FROM public.trip_members
    WHERE trip_id = p_trip_id AND user_id = v_inviter_user_id;

    IF v_inviter_role IS NULL OR (v_inviter_role <> 'owner' AND v_inviter_role <> 'co-owner') THEN
        RAISE EXCEPTION 'User does not have permission to create an invitation for this trip. Must be an owner or co-owner.';
    END IF;

    -- Generate a unique token (simple approach: use gen_random_uuid)
    v_token := gen_random_uuid()::TEXT;

    -- Insert the new invitation
    INSERT INTO public.trip_invitations (
        trip_id,
        token,
        invited_email,
        created_by,
        expires_at
    )
    VALUES (
        p_trip_id,
        v_token,
        p_invited_email,
        v_inviter_user_id,
        v_expires_at
    );

    RETURN v_token;
END;
$$;

COMMENT ON FUNCTION public.create_trip_invitation(UUID, TEXT) IS 'Creates a new invitation token for a given trip, callable by trip owners or co-owners. Returns the generated token.';


-- Function to consume a trip invitation token
CREATE OR REPLACE FUNCTION public.consume_trip_invitation(
    p_token TEXT
)
RETURNS UUID -- Returns the trip_id if successful, or raises an exception
LANGUAGE plpgsql
SECURITY DEFINER -- Important for updating trip_invitations and inserting into trip_members
AS $$
DECLARE
    v_consumer_user_id UUID := auth.uid();
    v_invitation RECORD;
    v_trip_id UUID;
BEGIN
    -- Find the invitation by token
    SELECT * INTO v_invitation
    FROM public.trip_invitations
    WHERE token = p_token;

    -- Validate invitation
    IF v_invitation IS NULL THEN
        RAISE EXCEPTION 'Invitation token not found.';
    END IF;

    IF v_invitation.used_at IS NOT NULL THEN
        RAISE EXCEPTION 'Invitation token has already been used.';
    END IF;

    IF v_invitation.expires_at <= now() THEN
        RAISE EXCEPTION 'Invitation token has expired.';
    END IF;

    v_trip_id := v_invitation.trip_id;

    -- Check if user is already a member of the trip
    IF EXISTS (
        SELECT 1
        FROM public.trip_members
        WHERE trip_id = v_trip_id AND user_id = v_consumer_user_id
    ) THEN
        -- User is already a member, consider this a success for joining via link
        -- Update the token as used if it wasn't this user who used it before (edge case)
        IF v_invitation.used_by_user_id IS NULL OR v_invitation.used_by_user_id <> v_consumer_user_id THEN
             UPDATE public.trip_invitations
             SET used_at = now(), used_by_user_id = v_consumer_user_id
             WHERE id = v_invitation.id;
        END IF;
        RETURN v_trip_id; -- Return trip_id as they are already part of it
    END IF;

    -- Add the consumer to trip_members with 'member' role
    INSERT INTO public.trip_members (trip_id, user_id, role)
    VALUES (v_trip_id, v_consumer_user_id, 'member')
    ON CONFLICT (trip_id, user_id) DO NOTHING; -- Should not happen due to the check above, but good practice

    -- Mark the invitation as used
    UPDATE public.trip_invitations
    SET used_at = now(), used_by_user_id = v_consumer_user_id
    WHERE id = v_invitation.id;

    RETURN v_trip_id;
END;
$$;

COMMENT ON FUNCTION public.consume_trip_invitation(TEXT) IS 'Consumes an invitation token, adds the calling user to the trip, and marks the token as used. Returns the trip_id.';