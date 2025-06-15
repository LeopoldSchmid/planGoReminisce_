-- supabase/migrations/20250615124802_create_trip_invitations_table.sql

CREATE TABLE public.trip_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    invited_email TEXT, -- Optional: if the invite was targeted at a specific email
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_trip_invitations_trip_id ON public.trip_invitations(trip_id);
CREATE INDEX idx_trip_invitations_token ON public.trip_invitations(token); -- Already unique, but good for lookups
CREATE INDEX idx_trip_invitations_created_by ON public.trip_invitations(created_by);
CREATE INDEX idx_trip_invitations_used_by_user_id ON public.trip_invitations(used_by_user_id);

-- Trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
DECLARE
  _new RECORD;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_trip_invitations_updated_at
BEFORE UPDATE ON public.trip_invitations
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

COMMENT ON TABLE public.trip_invitations IS 'Stores invitation tokens for users to join trips.';
COMMENT ON COLUMN public.trip_invitations.token IS 'Unique token for the invitation link.';
COMMENT ON COLUMN public.trip_invitations.invited_email IS 'Email address the invitation was specifically sent to, if any.';
COMMENT ON COLUMN public.trip_invitations.expires_at IS 'Timestamp when the invitation token is no longer valid.';
COMMENT ON COLUMN public.trip_invitations.used_at IS 'Timestamp when the invitation was successfully used.';
COMMENT ON COLUMN public.trip_invitations.used_by_user_id IS 'User who accepted and used this invitation.';

-- Enable RLS
ALTER TABLE public.trip_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Allow trip owners/co-owners or the creator of the invite to read invitations for their trips.
CREATE POLICY "Allow read access for trip owners/co-owners or invite creator"
ON public.trip_invitations
FOR SELECT
USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = trip_invitations.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);

-- Policy: Allow authenticated users to insert (create) invitations.
-- The actual permission to create an invite for a specific trip will be enforced by the RPC function.
CREATE POLICY "Allow authenticated users to create invitations"
ON public.trip_invitations
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow update for specific conditions (e.g., marking as used).
-- This will primarily be handled by SECURITY DEFINER functions (RPCs).
-- For direct updates, let's restrict to the creator or trip owner/co-owner for now.
CREATE POLICY "Allow update by creator or trip owner/co-owner"
ON public.trip_invitations
FOR UPDATE
USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = trip_invitations.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
)
WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = trip_invitations.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);


-- Policy: Allow trip owners/co-owners or the creator to delete (revoke) invitations.
CREATE POLICY "Allow delete by trip owners/co-owners or invite creator"
ON public.trip_invitations
FOR DELETE
USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = trip_invitations.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);
