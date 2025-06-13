# Plangoreminisce - Project Plan

## 1. Project Vision

To create "Plangoreminisce," a responsive web application designed to simplify and enhance collaborative trip planning among friends. The app aims to shift the planning dynamic from a solo effort to a shared, enjoyable experience, acting as a companion before, during, and after the trip. The goal is to make planning collaborative and less burdensome, especially for a group planning something like a week-long mountain bike holiday.

## 2. Detailed Feature Implementation Plan

### 2.1. User Authentication & Profiles
*   **Status:** [x] Completed
*   **Overview:** Secure user registration, login, logout (Supabase Auth), and basic user profiles.
*   **Details:**
    *   **Supabase Setup:**
        *   [x] Supabase project setup and credentials in `.env.local`.
        *   [x] Supabase Authentication enabled (email/password). Social logins and email templates not customized for MVP.
        *   [x] `profiles` table: `id` (UUID, refs `auth.users`), `username` (TEXT, unique), `full_name` (TEXT, opt), `avatar_url` (TEXT, opt), `updated_at`, `created_at`.
        *   [x] RLS for `profiles`: users can R/U their own profile.
        *   [x] Supabase DB function for auto-creating profile on new user signup.
    *   **Frontend UI & Pages:**
        *   [x] Registration Page (`/src/app/(auth)/signup/page.tsx`): Email, Password, Confirm Pwd, Username. `react-hook-form`, `zod`. Supabase `signUp`.
        *   [x] Login Page (`/src/app/(auth)/login/page.tsx`): Email, Password. `react-hook-form`, `zod`. Supabase `signInWithPassword`.
        *   [x] Logout Functionality: Button/link. Supabase `signOut`.
        *   [x] Basic User Profile Page (`/src/app/(dashboard)/profile/page.tsx`): Display info, allow updates (username, full name). Avatar upload deferred.
        *   [x] `AuthContext` (`src/context/AuthContext.tsx`): Manages session, `useAuth()` hook, listens to `onAuthStateChange`.
    *   **Frontend Routing & Protection:**
        *   [x] Protected dashboard routes (`/src/app/(dashboard)/...`).
        *   [x] Redirect authenticated users from auth pages.
        *   [x] `(auth)` and `(dashboard)` route groups and layouts.
    *   **Roles:** User-level roles not implemented for MVP. Trip-specific roles in `trip_members`.
*   **Acceptance Criteria:**
    *   [x] A new user can register with an email and password.
    *   [x] A registered user can log in with their credentials.
    *   [x] An authenticated user can log out.
    *   [x] An authenticated user can view their basic profile information.
    *   [x] Dashboard pages are protected and require login.
    *   [x] Users attempting to access auth pages (login/signup) while already logged in are redirected to the dashboard.

### 2.2. Trip Management
*   **Status:** [x] In Progress (Core MVP functionality for creation, listing, viewing, and inviting is complete. Deletion and advanced member management are pending.)
*   **Overview:** Create new trips, view a list of user's trips, invite members, and implement role-based deletion (Owner/Co-Owner only).
*   **Details:**
    *   **Supabase Setup - Tables & RLS:**
        *   [x] **Task 1:** Design `trips` table.
            *   [x] Schema: `id` (UUID, primary key), `name` (TEXT, not null), `description` (TEXT, optional), `start_date` (DATE, optional), `end_date` (DATE, optional), `created_by` (UUID, references `auth.users(id)`), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
            *   [x] RLS: Users can create trips. Users can view trips they are members of. Users who are 'owner' or 'co-owner' of a trip can update it. Only 'owner' or 'co-owner' can delete.
        *   [x] **Task 2:** Design `trip_members` table (junction table).
            *   [x] Schema: `id` (UUID, primary key), `trip_id` (UUID, references `trips(id)` on delete cascade), `user_id` (UUID, references `auth.users(id)` on delete cascade), `role` (TEXT, e.g., 'owner', 'co-owner', 'member', default 'member'), `joined_at` (TIMESTAMPTZ).
            *   [x] Add unique constraint on (`trip_id`, `user_id`).
            *   [x] RLS: Users can view their own membership. Trip owners/co-owners can add/remove members. Users can remove themselves (unless they are the sole owner).
        *   [x] **Task 3:** When a trip is created, automatically add the creator to `trip_members` with the 'owner' role.
        *   **Note:** Migrations for `trips` and `trip_members` tables, including RLS policies, are implemented.
    *   **Frontend - Trip Creation:**
        *   [x] **Task 4:** Create "Create New Trip" Page/Modal (`/src/app/(dashboard)/trips/new/page.tsx`).
            *   [x] Form fields: Trip Name, Description. (Start Date, End Date are optional).
            *   [x] Use `react-hook-form` and `zod` for validation.
            *   [x] On submit: Call `tripService.createTrip`.
            *   [x] Handle success and errors.
    *   **Frontend - Trip List & View:**
        *   [x] **Task 5:** Create "My Trips" Page (`/src/app/(dashboard)/trips/page.tsx`).
            *   [x] Fetch and display a list of trips the authenticated user is a member of.
            *   [x] Each list item links to the individual trip's page.
            *   [x] Use TanStack Query for data fetching from `tripService.getUserTrips`.
        *   [x] **Task 6:** Create Individual Trip Page (`/src/app/(dashboard)/trips/[tripId]/page.tsx`).
            *   [x] Display trip details (name, description, dates).
    *   **Frontend - Member Invitation & Management:**
        *   [x] **Task 7:** Implement "Invite Members" functionality on the individual trip page.
            *   [x] Input field for user's email.
            *   [x] On submit, call `tripService.inviteMemberByEmail`.
            *   **SECURITY NOTE:** Current `inviteMemberByEmail` uses a placeholder for email-to-userID resolution. **A secure Supabase Edge Function or RPC is required for production.**
        *   [ ] **Task 8:** Display list of current trip members on the individual trip page.
        *   [ ] **Task 9 (Stretch for MVP/Phase 2):** Allow Owner/Co-Owner to change member roles or remove members.
        *   [ ] **Task 10 (Stretch for MVP):** Allow members to leave a trip.
    *   **Frontend - Trip Deletion:**
        *   [ ] **Task 11:** Implement "Delete Trip" functionality.
            *   [ ] Button visible only to Owner/Co-Owner.
            *   [ ] Confirmation dialog before deletion.
            *   [ ] Call `tripService.deleteTrip`. Supabase RLS will enforce permission.
    *   **Roles (Trip-Specific):**
        *   [x] **Task 12:** Ensure `role` field in `trip_members` is used to control actions like inviting members. (Deletion/Edit controls pending).
*   **Key Components/Files Involved:**
    *   Frontend: `src/app/(dashboard)/trips/...`, `src/components/trips/...`, `src/services/tripService.ts`.
    *   Backend: `trips`, `trip_members` tables, RLS policies.
*   **Acceptance Criteria:**
    *   [x] An authenticated user can create a new trip, providing a name.
    *   [x] The creator of the trip is automatically assigned as the 'owner'.
    *   [x] A user can see a list of all trips they are a member of.
    *   [x] An 'owner' or 'co-owner' can invite other registered users to a trip by email.
    *   [x] Invited users become 'members' of the trip.
    *   [ ] Only an 'owner' or 'co-owner' can delete a trip.
    *   [x] Users can view basic details of a trip they are a member of.

### 2.3. Shared Shopping Lists (Phase 1 MVP)
*   **Status:** [ ] Not Started
*   **Overview:** Allow users to create and manage shared shopping lists per trip. Users can add, edit, and delete items, assign items to members, and mark items as fully purchased.
*   **Details:**
    *   **Supabase Setup - Tables & RLS:**
        *   [ ] **Task 1:** Design `shopping_lists` table.
            *   [ ] Schema: `id`, `trip_id`, `name`, `created_by`, `created_at`, `updated_at`.
            *   [ ] RLS: Trip members can create/view. List creator or trip owner/co-owner can edit/delete.
        *   [ ] **Task 2:** Design `shopping_list_items` table.
            *   [ ] Schema: `id`, `list_id`, `name`, `quantity`, `notes`, `added_by`, `assigned_to`, `is_purchased`, `purchased_by`, `purchased_at`, `created_at`, `updated_at`.
            *   [ ] RLS: Trip members add. Adder/Assignee/Owner edit/delete. Any member marks purchased.
    *   **Frontend - Shopping List Management:**
        *   [ ] **Task 3:** UI for displaying shopping lists within a trip page.
        *   [ ] **Task 4:** UI for displaying items within a specific shopping list.
        *   [ ] **Task 5:** Implement "Assign Item" functionality.
        *   [ ] **Task 6:** Implement "Mark as Purchased" functionality.
    *   **Frontend - Services & State:**
        *   [ ] **Task 7:** Create `shoppingListService.ts`.
        *   [ ] **Task 8:** Use TanStack Query, `react-hook-form`, `zod`.
*   **Key Components/Files Involved:**
    *   Frontend: `src/app/(dashboard)/trips/[tripId]/shopping/...`, `src/components/common/ShoppingList...`, `src/services/shoppingListService.ts`.
    *   Backend: `shopping_lists`, `shopping_list_items` tables, RLS.
*   **Acceptance Criteria:**
    *   [ ] A trip member can create one or more shopping lists for a trip.
    *   [ ] A trip member can add items to a shopping list.
    *   [ ] A trip member can assign an item to another member of the trip.
    *   [ ] Any trip member can mark an item as "purchased".
    *   [ ] The system records who purchased an item and when.
    *   [ ] Trip members can view all items on a shopping list.
    *   [ ] Users with appropriate permissions can edit or delete shopping lists and items.

### 2.4. Expense Tracking & Splitting (Simplified MVP - Phase 1)
*   **Status:** [ ] Not Started
*   **Overview:** Allow users to add expenses, view a list, display who paid what, and implement basic equal splitting.
*   **Details:**
    *   **Supabase Setup - Tables & RLS:**
        *   [ ] **Task 1:** Design `expenses` table.
            *   [ ] Schema: `id`, `trip_id`, `description`, `amount`, `currency` (default 'EUR'), `paid_by_user_id`, `paid_at_date`, `notes`, `created_by`, `created_at`, `updated_at`.
            *   [ ] RLS: Trip members add/view. Creator or trip owner/co-owner edit/delete.
        *   [ ] **Task 2:** Design `expense_splits` table.
            *   [ ] Schema: `id`, `expense_id`, `user_id`, `share_amount` (opt). MVP: records involvement.
            *   [ ] RLS: View own. Creator or trip owner/co-owner manage.
    *   **Frontend - Expense Management:**
        *   [ ] **Task 3:** UI for adding a new expense.
        *   [ ] **Task 4:** UI for displaying a list of expenses.
        *   [ ] **Task 5:** UI for "Who Paid What" summary.
    *   **Frontend - Basic Splitting Logic (Display):**
        *   [ ] **Task 6:** Display how expense is split.
        *   [ ] **Task 7:** Calculate and display simple "Who Owes Whom" summary.
    *   **Frontend - Services & State:**
        *   [ ] **Task 8:** Create `expenseService.ts`.
        *   [ ] **Task 9:** Use TanStack Query, `react-hook-form`, `zod`.
*   **Key Components/Files Involved:**
    *   Frontend: `src/app/(dashboard)/trips/[tripId]/expenses/...`, `src/components/common/Expense...`, `src/services/expenseService.ts`.
    *   Backend: `expenses`, `expense_splits` tables, RLS.
*   **Acceptance Criteria:**
    *   [ ] A trip member can add an expense.
    *   [ ] Expenses are recorded in a single, predefined currency.
    *   [ ] Trip members can view a list of all expenses for that trip.
    *   [ ] The system displays a summary of "who paid what".
    *   [ ] For each expense, the system shows it's split equally among all trip members.
    *   [ ] A basic summary of balances is displayed.
    *   [ ] Users with appropriate permissions can edit or delete expenses.

### 2.5. Basic UI/UX (Phase 1 MVP)
*   **Status:** [ ] In Progress (partially addressed by auth & trip features)
*   **Overview:** Establish a clean, intuitive, and responsive UI using Next.js, Tailwind CSS, and Shadcn UI.
*   **Details:**
    *   **Project Setup & Configuration:**
        *   [x] **Task 1:** Next.js, TypeScript, Tailwind CSS, Shadcn UI installed and configured.
        *   [x] **Task 2:** Basic theme (colors, fonts) in `tailwind.config.js` and `global.css`.
    *   **Layouts & Navigation:**
        *   [x] **Task 3:** Main application layout (`/src/app/layout.tsx`).
        *   [x] **Task 4:** Dashboard layout (`/src/app/(dashboard)/layout.tsx`) with nav (My Trips, Profile, Logout).
        *   [x] **Task 5:** Authentication layout (`/src/app/(auth)/layout.tsx`).
        *   [ ] **Task 6:** Implement fully responsive navigation bar/sidebar (Shadcn `Sheet` for mobile).
    *   **Core UI Components & Styling:**
        *   [x] **Task 7:** Consistent style for forms (Shadcn `Input`, `Button`, `Label`, etc.).
        *   [ ] **Task 8:** Style for displaying lists of data (Shadcn `Table`, `Card`).
        *   [x] **Task 9:** Implement user feedback (Shadcn `Toast` via `sonner`). `AlertDialog` for confirmations pending.
        *   [ ] **Task 10:** Ensure basic responsiveness across common screen sizes.
    *   **Accessibility & Standards:**
        *   [ ] **Task 11:** Adhere to basic accessibility (a11y) principles.
        *   [x] **Task 12:** `components.json` for Shadcn UI established.
        *   [ ] **Task 13:** Create common reusable UI components in `src/components/common/`.
*   **Key Components/Files Involved:**
    *   Frontend: `src/app/layout.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/(auth)/layout.tsx`, `src/styles/globals.css`, `tailwind.config.js`, `components.json`, `src/components/ui/`, `src/components/common/`.
*   **Acceptance Criteria:**
    *   [x] The application has a consistent global layout and navigation structure.
    *   [x] Authenticated users see a dashboard layout with navigation to key features.
    *   [x] Authentication pages have a distinct, focused layout.
    *   [x] Core UI elements (forms, buttons) are styled consistently using Shadcn UI.
    *   [ ] The application is responsive and usable on common mobile and desktop screen sizes.
    *   [x] Basic user feedback (toasts for actions) is implemented. Confirmation alerts pending.
    *   [ ] Basic accessibility standards are met.

## 3. Other Core Features (Phased)

### 3.1. Collaborative Date Finding
*   **Status:** [ ] Not Started (Phase 2)
*   **Overview:** A crucial tool to help groups find suitable dates. Interactive solution like "Doodle-style" poll or shared calendar overlay.

### 3.2. Location & Booking Assistance (MVP: Decision Support)
*   **Status:** [ ] Not Started (Phase 3 for full vision, MVP decision support aspects TBD)
*   **Overview:** Facilitate group decisions on destinations/accommodations. Suggest, store info, discuss options.

### 3.3. Trip Companion & Dashboard
*   **Status:** [ ] Not Started (Phase 2)
*   **Overview:** Central trip dashboard: key info, pending tasks, recent activity.

### 3.4. Notifications (Basic)
*   **Status:** [ ] Not Started (Phase 2)
*   **Overview:** In-app notifications for important events (Supabase Realtime).

### 3.5. Offline Access Consideration
*   **Status:** [ ] Not Started (Post-MVP)
*   **Overview:** Viewing cached trip data offline.

## 4. Proposed Tech Stack

*   **Frontend Framework:** Next.js (v14+ with App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn UI
    *   **Note on Shadcn UI:** Installed components can be checked by listing the contents of `/src/components/ui`. Current components include: `avatar.tsx`, `button.tsx`, `card.tsx`, `form.tsx`, `input.tsx`, `label.tsx`, `sonner.tsx`, `textarea.tsx`.
    *   Use `npx shadcn-ui@latest add <component_name>` to add new components.
*   **Backend & Database:** Supabase (Leveraging Auth, Postgres Database, Storage, and Realtime features)
*   **Form Handling:** React Hook Form
*   **Validation:** Zod
*   **Data Fetching (Client-side):** TanStack Query (React Query)
*   **State Management:** React Context (for simpler global state), potentially Zustand/Jotai if complexity grows.
*   **Deployment Options:** Netlify (recommended), Hetzner.

## 5. Phased Development Roadmap Overview

*   **Phase 1: MVP (Current Focus)**
    *   User Authentication & Profiles (Completed)
    *   Trip Management (In Progress)
    *   Shared Shopping Lists (Not Started)
    *   Expense Tracking & Splitting (Simplified MVP) (Not Started)
    *   Basic UI/UX (In Progress)
*   **Phase 2: Enhancing Core Functionality & Collaboration**
    *   Collaborative Date Finding
    *   Advanced Expense Splitting
    *   Trip Dashboard
    *   Basic Notifications
*   **Phase 3: Advanced Features & "Reminisce"**
    *   Full Location & Booking Assistance
    *   Advanced Shopping Lists (Recipes, etc.)
    *   Itinerary Planning
    *   Document Sharing
    *   "Reminisce" Features (Photo sharing, summaries)
    *   Enhanced UI/UX & Polish
    *   (Potential) Offline Access Capabilities

This consolidated plan will serve as the primary reference for ongoing development.
