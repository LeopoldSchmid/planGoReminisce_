# Feature: User Authentication & Profiles (Phase 1 MVP)

**Status:** Completed
**Last Updated:** 2025-06-08

## 1. Overview
Implement secure user registration, login, and logout functionality using Supabase Auth. Create basic user profiles and establish the initial structure for Owner, Co-Owner, and Member roles.

## 2. Sub-Tasks & Implementation Details

### 2.1. Supabase Setup
- [ ] **Task 1:** Confirm Supabase project is set up and credentials are in `.env.local`. (Already done)
- [ ] **Task 2:** Enable and configure Supabase Authentication (e.g., email/password, social logins if desired for MVP).
  - [ ] Review Supabase Auth settings in the dashboard. **[NOTE: Email/password is enabled. Social logins and email templates are not customized for MVP. Default Supabase templates in use.]**
- [x] **Task 3:** Design `profiles` table in Supabase.
  - [x] Schema: `id` (UUID, references `auth.users` on delete cascade), `username` (TEXT, unique), `full_name` (TEXT, optional), `avatar_url` (TEXT, optional), `updated_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ).
  - [x] Set up RLS policies for `profiles` table (e.g., users can read their own profile, users can update their own profile, public read access to minimal fields if needed).
- [x] **Task 4:** Create a Supabase database function to automatically create a new profile entry when a new user signs up (triggered by `auth.users` table insert).

### 2.2. Frontend - UI Components & Pages
- [x] **Task 5:** Create Registration Page (`/src/app/(auth)/signup/page.tsx`).
  - [x] Form fields: Email, Password, Confirm Password, Username (as per `profiles` table).
  - [x] Use `react-hook-form` and `zod` for validation.
  - [x] Call Supabase `signUp` function.
  - [x] Handle success (e.g., redirect to login or show "check email" message) and errors (display user-friendly messages).
- [x] **Task 6:** Create Login Page (`/src/app/(auth)/login/page.tsx`).
  - [x] Form fields: Email, Password.
  - [x] Use `react-hook-form` and `zod` for validation.
  - [x] Call Supabase `signInWithPassword` function.
  - [x] Handle success (redirect to dashboard) and errors.
- [x] **Task 7:** Implement Logout Functionality.
  - [x] Create a "Logout" button/link (e.g., in a user dropdown or navbar).
  - [x] Call Supabase `signOut` function (likely via `AuthContext`).
  - [x] Redirect to login page or home page.
- [ ] **Task 8:** Create Basic User Profile Page (e.g., `/src/app/(dashboard)/profile/page.tsx`).
  - [x] Display user information (username, email).
  - [x] Allow updating basic profile information (e.g., username, full name). (Avatar upload deferred for now; edit UI and service implemented.)
- [x] **Task 9:** Create an Auth Context/Provider or use a state management solution (React Context for now as per guidelines) to manage user session state globally.
  - [x] `src/context/AuthContext.tsx` (or similar).
  - [x] Provider to wrap the application layout.
  - [x] Hook `useAuth()` to access user data and loading state.
  - [x] Listen to Supabase `onAuthStateChange` to update session state.

### 2.3. Frontend - Routing & Protection
- [x] **Task 10:** Implement protected routes for dashboard areas.
  - [x] Redirect unauthenticated users from `/src/app/(dashboard)/...` routes to `/login`.
  - [x] Redirect authenticated users from `/login` and `/signup` to `/dashboard`.
- [x] **Task 11:** Create `(auth)` and `(dashboard)` route groups and their respective layouts (`layout.tsx`).

### 2.4. Roles (Basic Implementation)
- [x] **Task 12:** Design how roles will be stored (e.g., a `role` column in `profiles` table, or a separate `user_roles` table if users can have multiple roles per context, though for trips it will be per trip member).
  - **Decision:** For MVP, user-level roles are not implemented. Trip-specific roles will be handled in the `trip_members` table in a future phase. The `profiles` table is focused on basic user info only.

## 3. Key Components/Files Involved
*   **Frontend:**
    *   `src/app/(auth)/signup/page.tsx`
    *   `src/app/(auth)/login/page.tsx`
    *   `src/app/(auth)/layout.tsx`
    *   `src/app/(dashboard)/profile/page.tsx`
    *   `src/app/(dashboard)/layout.tsx`
    *   `src/components/ui/Input.tsx`, `Button.tsx`, `Card.tsx`, `Form.tsx` (Shadcn)
    *   `src/components/common/AuthForm.tsx` (if creating a reusable auth form component)
    *   `src/lib/supabaseClient.ts`
    *   `src/services/authService.ts` (for wrapping Supabase auth calls)
    *   `src/hooks/useAuth.ts`
    *   `src/context/AuthContext.tsx`
    *   `src/types/index.ts` (for User, Profile types)
*   **Backend (Supabase):**
    *   `auth.users` table (managed by Supabase)
    *   `profiles` table (custom)
    *   RLS Policies for `profiles`.
    *   Database function/trigger for new user profile creation.
*   **Environment Variables:**
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Notes & Considerations
*   Ensure password policies are reasonable (Supabase default or custom).
*   Consider email confirmation flow. Supabase handles this by default.
*   Error handling and user feedback are crucial for a good auth experience.
*   Initial role implementation will be basic; more granular permissions tied to trips will come with Trip Management.

## 5. Acceptance Criteria
*   A new user can register with an email and password.
*   A registered user can log in with their credentials.
*   An authenticated user can log out.
*   An authenticated user can view their basic profile information.
*   Dashboard pages are protected and require login.
*   Users attempting to access auth pages (login/signup) while already logged in are redirected to the dashboard.
