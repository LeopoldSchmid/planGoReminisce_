# Feature: Trip Management (Phase 1 MVP)

**Status:** Not Started
**Last Updated:** 2025-06-08

## 1. Overview
Allow users to create new trips, view a list of their trips, invite members, and implement role-based deletion (Owner/Co-Owner only).

## 2. Sub-Tasks & Implementation Details

### 2.1. Supabase Setup - Tables & RLS
- [ ] **Task 1:** Design `trips` table.
  - [ ] Schema: `id` (UUID, primary key), `name` (TEXT, not null), `description` (TEXT, optional), `start_date` (DATE, optional), `end_date` (DATE, optional), `created_by` (UUID, references `auth.users(id)`), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
  - [ ] RLS: Users can create trips. Users can view trips they are members of. Users who are 'owner' or 'co-owner' of a trip can update it. Only 'owner' or 'co-owner' can delete.
- [ ] **Task 2:** Design `trip_members` table (junction table).
  - [ ] Schema: `id` (UUID, primary key), `trip_id` (UUID, references `trips(id)` on delete cascade), `user_id` (UUID, references `auth.users(id)` on delete cascade), `role` (TEXT, e.g., 'owner', 'co-owner', 'member', default 'member'), `joined_at` (TIMESTAMPTZ).
  - [ ] Add unique constraint on (`trip_id`, `user_id`).
  - [ ] RLS: Users can view their own membership. Trip owners/co-owners can add/remove members. Users can remove themselves (unless they are the sole owner).
- [ ] **Task 3:** When a trip is created, automatically add the creator to `trip_members` with the 'owner' role. This can be done client-side in a transaction or via a Supabase function.

### 2.2. Frontend - Trip Creation
- [ ] **Task 4:** Create "Create New Trip" Page/Modal (e.g., `/src/app/(dashboard)/trips/new/page.tsx` or a modal).
  - [ ] Form fields: Trip Name, Description, Start Date, End Date.
  - [ ] Use `react-hook-form` and `zod` for validation.
  - [ ] On submit:
    - Call a `tripService.createTrip` function.
    - This service function will insert into `trips` table and then insert the creator into `trip_members` table with 'owner' role (ideally in a Supabase function/transaction).
  - [ ] Handle success (e.g., redirect to the new trip's page or trip list) and errors.

### 2.3. Frontend - Trip List & View
- [ ] **Task 5:** Create "My Trips" Page (`/src/app/(dashboard)/trips/page.tsx`).
  - [ ] Fetch and display a list of trips the authenticated user is a member of.
  - [ ] Each list item should link to the individual trip's dashboard/details page.
  - [ ] Use TanStack Query for data fetching from `tripService.getUserTrips`.
- [ ] **Task 6:** Create Individual Trip Page (e.g., `/src/app/(dashboard)/trips/[tripId]/page.tsx`).
  - [ ] Display trip details (name, description, dates).
  - [ ] This page will later serve as the trip dashboard.

### 2.4. Frontend - Member Invitation & Management
- [ ] **Task 7:** Implement "Invite Members" functionality on the individual trip page.
  - [ ] Input field for user's email or username.
  - [ ] On submit, call `tripService.inviteMember` which adds a new entry to `trip_members` (initially with 'member' role).
  - [ ] (Future: Send an email notification).
- [ ] **Task 8:** Display list of current trip members on the individual trip page.
  - [ ] Show member username/name and their role.
- [ ] **Task 9 (Stretch for MVP, more likely Phase 2):** Allow Owner/Co-Owner to change member roles or remove members.
- [ ] **Task 10 (Stretch for MVP):** Allow members to leave a trip.

### 2.5. Frontend - Trip Deletion
- [ ] **Task 11:** Implement "Delete Trip" functionality.
  - [ ] Button visible only to Owner/Co-Owner.
  - [ ] Confirmation dialog before deletion.
  - [ ] Call `tripService.deleteTrip`. Supabase RLS will enforce permission.

### 2.6. Roles (Trip-Specific)
- [ ] **Task 12:** Ensure `role` field in `trip_members` is used to control actions like editing trip details, inviting members, and deleting the trip.

## 3. Key Components/Files Involved
*   **Frontend:**
    *   `src/app/(dashboard)/trips/page.tsx` (Trip List)
    *   `src/app/(dashboard)/trips/new/page.tsx` (New Trip Form)
    *   `src/app/(dashboard)/trips/[tripId]/page.tsx` (Individual Trip View/Dashboard)
    *   `src/components/common/TripCard.tsx`
    *   `src/components/common/CreateTripForm.tsx`
    *   `src/components/common/MemberList.tsx`
    *   `src/components/common/InviteMemberForm.tsx`
    *   `src/lib/supabaseClient.ts`
    *   `src/services/tripService.ts`
    *   `src/types/index.ts` (for Trip, TripMember types)
*   **Backend (Supabase):**
    *   `trips` table
    *   `trip_members` table
    *   RLS Policies for both tables.
    *   (Optional) Supabase function for `create_trip_and_add_owner`.

## 4. Notes & Considerations
*   Date handling: Use a consistent date format. Shadcn UI has a Date Picker.
*   Invitation system: MVP is direct addition by email/username. A more robust system (invite links, notifications) can be Phase 2.
*   Role definitions: Owner (full control), Co-Owner (most control, can't be removed by other co-owners), Member (view, contribute content).
*   Error handling for database operations and displaying feedback to the user.

## 5. Acceptance Criteria
*   An authenticated user can create a new trip, providing a name.
*   The creator of the trip is automatically assigned as the 'owner'.
*   A user can see a list of all trips they are a member of.
*   An 'owner' or 'co-owner' can invite other registered users to a trip.
*   Invited users become 'members' of the trip.
*   Only an 'owner' or 'co-owner' can delete a trip.
*   Users can view basic details of a trip they are a member of.
