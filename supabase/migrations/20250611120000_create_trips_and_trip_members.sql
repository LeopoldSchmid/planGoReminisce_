-- Migration: Create trips and trip_members tables for Trip Management MVP
-- Timestamp: 20240609120000

-- 1. Create the 'trips' table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.trips IS 'Stores trip information. Each trip is created by a user.';
COMMENT ON COLUMN public.trips.id IS 'Primary key for the trip.';
COMMENT ON COLUMN public.trips.name IS 'Name of the trip.';
COMMENT ON COLUMN public.trips.description IS 'Optional description of the trip.';
COMMENT ON COLUMN public.trips.start_date IS 'Optional start date.';
COMMENT ON COLUMN public.trips.end_date IS 'Optional end date.';
COMMENT ON COLUMN public.trips.created_by IS 'User ID of the creator.';
COMMENT ON COLUMN public.trips.created_at IS 'Timestamp of trip creation (UTC).';
COMMENT ON COLUMN public.trips.updated_at IS 'Timestamp of last update (UTC).';

-- 2. Create the 'trip_members' table (junction table)
CREATE TABLE public.trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'co-owner', 'member'
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (trip_id, user_id)
);

COMMENT ON TABLE public.trip_members IS 'Junction table for trip membership and roles.';
COMMENT ON COLUMN public.trip_members.trip_id IS 'Trip ID.';
COMMENT ON COLUMN public.trip_members.user_id IS 'User ID.';
COMMENT ON COLUMN public.trip_members.role IS 'Role in the trip: owner, co-owner, member.';
COMMENT ON COLUMN public.trip_members.joined_at IS 'Timestamp when the user joined the trip.';

-- 3. Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for 'trips'
-- Users can select trips they are a member of
CREATE POLICY "Trip members can view their trips"
  ON public.trips FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.trip_members m
    WHERE m.trip_id = id AND m.user_id = auth.uid()
  ));

-- Users can insert trips (any authenticated user)
CREATE POLICY "Authenticated users can create trips"
  ON public.trips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Owners/co-owners can update/delete their trips
CREATE POLICY "Owners/co-owners can update trips"
  ON public.trips FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.trip_members m
    WHERE m.trip_id = id AND m.user_id = auth.uid() AND m.role IN ('owner', 'co-owner')
  ));

CREATE POLICY "Owners/co-owners can delete trips"
  ON public.trips FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.trip_members m
    WHERE m.trip_id = id AND m.user_id = auth.uid() AND m.role IN ('owner', 'co-owner')
  ));

-- 5. RLS Policies for 'trip_members'
-- Users can view their own memberships
CREATE POLICY "Users can view their own trip memberships"
  ON public.trip_members FOR SELECT
  USING (user_id = auth.uid());

-- Owners/co-owners can add members
CREATE POLICY "Owners/co-owners can add trip members"
  ON public.trip_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trip_members m
    WHERE m.trip_id = trip_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'co-owner')
  ));

-- Owners/co-owners can remove members
CREATE POLICY "Owners/co-owners can remove trip members"
  ON public.trip_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.trip_members m
    WHERE m.trip_id = trip_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'co-owner')
  ));

-- Users can remove themselves (unless sole owner)
CREATE POLICY "Users can remove themselves from a trip"
  ON public.trip_members FOR DELETE
  USING (user_id = auth.uid());

-- 6. Grant usage on schema and tables
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_members TO authenticated; 