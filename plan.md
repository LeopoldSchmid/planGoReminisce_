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
        *   [x] Supabase Authentication enabled (email/password).
        *   [x] `profiles` table created and linked to `auth.users`.
        *   [x] RLS for `profiles` in place.
        *   [x] Auto-profile creation on signup implemented.
    *   **Frontend UI & Pages:**
        *   [x] Registration Page (`/src/app/signup/page.tsx`).
        *   [x] Login Page (`/src/app/login/page.tsx`).
        *   [x] Logout Functionality.
        *   [x] Basic User Profile Page (`/src/app/profile/page.tsx`).
        *   [x] `AuthContext` (`src/context/AuthContext.tsx`) for auth state.
    *   **Frontend Routing & Protection:**
        *   [x] Protected routes (e.g., `/trips`, `/profile`) via middleware and layout checks.
        *   [x] Redirect authenticated users from auth pages.
*   **Acceptance Criteria:**
    *   [x] A new user can register.
    *   [x] A registered user can log in.
    *   [x] An authenticated user can log out.
    *   [x] An authenticated user can view and update their basic profile.
    *   [x] Key application pages are protected.

### 2.2. Trip Management
*   **Status:** [x] Mostly Complete (Core creation, listing, viewing, inviting, and deletion implemented. Advanced member management pending.)
*   **Overview:** Create, view, manage members, and delete trips.
*   **Details:**
    *   **Supabase Setup - Tables & RLS:**
        *   [x] `trips` table implemented with RLS.
        *   [x] `trip_members` table implemented with RLS (roles: owner, co-owner, member).
        *   [x] Creator automatically becomes 'owner'.
        *   [x] `trip_invitations` table and related RPCs for link-based invites implemented.
    *   **Frontend - Core Trip Operations:**
        *   [x] Create New Trip Page (`/src/app/trips/new/page.tsx`).
        *   [x] My Trips Page (`/src/app/trips/page.tsx`) lists user's trips.
        *   [x] Individual Trip Page (`/src/app/trips/[tripId]/page.tsx`) displays details, members, and sections for recipes, shopping lists, expenses.
    *   **Frontend - Member Invitation & Management:**
        *   [x] Invite members by email (via `InviteMemberForm` component, calls `tripService.inviteMemberByEmail`).
            *   **SECURITY NOTE:** Secure email-to-userID resolution (Edge Function/RPC) is critical for production (as per memory `f280c2fa-f970-461c-9483-4518f0335880`).
        *   [x] Generate and share invitation links (UI in trip detail page, calls `generateTripInvitationLink`).
        *   [x] Handle joining via invitation link (`/src/app/join-trip/page.tsx`).
        *   [x] Display list of current trip members.
        *   [ ] **Task 9 (Stretch):** Allow Owner/Co-Owner to change member roles or remove members directly from UI.
        *   [ ] **Task 10 (Stretch):** Allow members to leave a trip.
    *   **Frontend - Trip Deletion:**
        *   [x] **Task 11:** Implemented "Delete Trip" functionality with confirmation, available to Owner/Co-Owner.
*   **Key Components/Files Involved:**
    *   Frontend: `src/app/trips/...`, `src/app/join-trip/...`, `src/components/trips/...`, `src/services/tripService.ts`.
    *   Backend: `trips`, `trip_members`, `trip_invitations` tables, RLS policies, RPCs.
*   **Acceptance Criteria:**
    *   [x] User can create a new trip.
    *   [x] Creator is 'owner'.
    *   [x] User sees their trips.
    *   [x] Owner/co-owner can invite by email and generate invite links.
    *   [x] Users can join via invite link.
    *   [x] Owner/co-owner can delete a trip.
    *   [x] Trip details and members are viewable.

### 2.3. Shared Shopping Lists & Recipes
*   **Status:** [x] In Progress (Core recipe and shopping list functionality exists. Aggregation, unit standardization, and recipe editing are pending.)
*   **Overview:** Manage recipes for trip meals and create shared shopping lists. Aggregate ingredients from recipes and manual additions.
*   **Details - Recipes:**
    *   **Supabase Setup - Tables & RLS (Assumed existing based on `recipeService.ts`):**
        *   [x] `recipes` table (stores name, description, servings, ingredients as JSONB, etc.).
        *   [x] `recipe_ingredients` (or similar, or ingredients stored in JSONB within `recipes`).
        *   [x] RLS: Trip members can create/view. Creator or trip owner/co-owner can edit/delete.
    *   **Frontend - Recipe Management (within `src/app/trips/[tripId]/page.tsx` via `RecipesSection.tsx`):**
        *   [x] **Task R1:** UI for creating new recipes (name, description, servings, ingredients, instructions) via a dialog in `RecipesSection.tsx`.
        *   [x] **Task R2:** UI for displaying recipes (using `RecipeCard.tsx`).
        *   [x] **Task R3:** Functionality to delete recipes.
        *   [ ] **Task R4 (NEW):** Implement "Edit Recipe" functionality.
            *   [ ] Add Edit button to `RecipeCard.tsx` or `RecipesSection.tsx` (role-based visibility).
            *   [ ] Open a dialog (similar to create) pre-filled with recipe data.
            *   [ ] Implement `recipeService.updateRecipe` and update UI on success.
*   **Details - Shopping Lists:**
    *   **Supabase Setup - Tables & RLS (Assumed existing based on `shoppingListService.ts`):**
        *   [x] `shopping_lists` table (stores name, description, trip_id).
        *   [x] `shopping_list_items` table (stores name, quantity, unit, notes, list_id, assigned_to, purchased status).
        *   [x] RLS policies for creation, view, modification, deletion based on trip membership/roles.
    *   **Frontend - Shopping List Management (within `src/app/trips/[tripId]/page.tsx` via `ShoppingListsSection.tsx` and `ShoppingListCard.tsx`):**
        *   [x] **Task SL1:** UI for creating new shopping lists.
        *   [x] **Task SL2:** UI for displaying shopping lists and their items (`ShoppingListCard.tsx`).
        *   [x] **Task SL3:** Functionality to add items to a list (name, quantity, unit, notes, assign to member).
        *   [x] **Task SL4:** Functionality to mark items as purchased/unpurchased.
        *   [x] **Task SL5:** Functionality to delete shopping lists and items.
    *   **Details - Ingredient Standardization & Aggregation:**
        *   [ ] **Task IU1 (NEW):** Define standardized units for ingredients (e.g., enum/type in `src/types/units.ts` or `src/types/index.ts`). Cover common units (g, kg, ml, l, pcs, tsp, tbsp, etc.).
        *   [ ] **Task IU2 (NEW):** Update `RecipeIngredient` and `ShoppingListItem` types to use standardized units.
        *   [ ] **Task IU3 (NEW):** Modify "Add Ingredient" (recipes) and "Add Item" (shopping list) forms to use a dropdown/select for these units.
        *   [ ] **Task IU4 (NEW):** Create Supabase migration to update `unit` field in `recipe_ingredients` (if separate table) and `shopping_list_items` (e.g., to store standardized strings, or if Postgres enum is used). Remind user to run `npx supabase migration new <name>` and `npx supabase db push`.
        *   [ ] **Task AGG1 (NEW):** Fix/Implement ingredient aggregation in `AggregatedShoppingView.tsx`.
            *   [ ] Fetch all recipes for the trip and their ingredients.
            *   [ ] Fetch all manually added items from all shopping lists for the trip.
            *   [ ] Combine and aggregate: group by item name and standardized unit, summing quantities.
            *   [ ] Display the aggregated list clearly.
*   **Key Components/Files Involved:**
    *   Frontend: `src/app/trips/[tripId]/page.tsx`, `src/components/recipes/RecipesSection.tsx`, `src/components/recipes/RecipeCard.tsx`, `src/components/shopping/ShoppingListsSection.tsx`, `src/components/shopping/ShoppingListCard.tsx`, `src/components/shopping/AggregatedShoppingView.tsx`, `src/services/recipeService.ts`, `src/services/shoppingListService.ts`, `src/types/index.ts` (or `units.ts`).
    *   Backend: `recipes`, `shopping_lists`, `shopping_list_items` tables, RLS policies. Supabase migration file.
*   **Acceptance Criteria (Updated & New):**
    *   [x] Trip members can create recipes with ingredients.
    *   [x] Trip members can create shopping lists and add items manually.
    *   [ ] **NEW:** Recipe ingredients and shopping list items use a standardized set of units.
    *   [ ] **NEW:** The `AggregatedShoppingView` correctly sums quantities of identical items (name + unit) from all recipes and manual shopping list entries for the trip.
    *   [ ] **NEW:** Users with appropriate permissions can edit existing recipes.
    *   [x] Users can mark shopping list items as purchased.
    *   [x] Users can delete recipes and shopping lists/items (with permissions).

### 2.4. Expense Tracking & Splitting
*   **Status:** [x] In Progress (Core functionality for adding, viewing expenses, and retroactive management exists.)
*   **Overview:** Add expenses, view list, display who paid, manage splits (currently includes retroactive addition of members to past expenses).
*   **Details (Reflecting current implementation like `ExpensesSection.tsx`, `RetroactiveExpenseManager.tsx`):**
    *   **Supabase Setup - Tables & RLS (Assumed existing based on `expenseService.ts`):**
        *   [x] `expenses` table (description, amount, currency, paid_by, date, etc.).
        *   [x] `expense_participants` (or similar, for who is involved in an expense).
        *   [x] RLS policies in place.
    *   **Frontend - Expense Management (within `src/app/trips/[tripId]/page.tsx` via `ExpensesSection.tsx`):**
        *   [x] **Task E1:** UI for adding new expenses (dialog in `ExpensesSection.tsx`).
        *   [x] **Task E2:** UI for displaying list of expenses.
        *   [x] **Task E3:** UI for "Who Paid What" summary (implicitly part of expense list).
        *   [x] **Task E4:** `RetroactiveExpenseManager` component to add new trip members to existing expenses.
        *   [ ] **Task E5 (Future):** More advanced splitting logic (unequal, by item) and "Who Owes Whom" calculation.
*   **Key Components/Files Involved:**
    *   Frontend: `src/app/trips/[tripId]/page.tsx`, `src/components/expenses/ExpensesSection.tsx`, `src/components/expenses/RetroactiveExpenseManager.tsx`, `src/services/expenseService.ts`.
    *   Backend: `expenses`, `expense_participants` tables, RLS.
*   **Acceptance Criteria:**
    *   [x] Trip member can add an expense.
    *   [x] Expenses are recorded (currency handling as implemented).
    *   [x] Trip members can view trip expenses.
    *   [x] System can retroactively include new members in past expenses.
    *   [ ] Basic summary of balances/splits is clearly displayed (further improvements may be needed).

### 2.5. Basic UI/UX
*   **Status:** [x] In Progress
*   **Overview:** Clean, intuitive, responsive UI using Next.js, Tailwind CSS, Shadcn UI.
*   **Details:**
    *   **Setup & Configuration:**
        *   [x] Next.js, TypeScript, Tailwind, Shadcn UI configured.
        *   [x] Basic theme in `tailwind.config.js`, `globals.css`.
    *   **Layouts & Navigation:**
        *   [x] Main app layout (`/src/app/layout.tsx`).
        *   [x] Dashboard layout (`/src/components/layout/DashboardLayout.tsx`) used by protected pages.
        *   [x] Responsive navigation (header, potential sidebar for mobile via Shadcn `Sheet` - current state to be verified, but mobile nav exists).
    *   **Core UI Components & Styling:**
        *   [x] Consistent styling for forms, buttons, cards, etc., using Shadcn UI.
        *   [x] User feedback via `sonner` (toasts). Shadcn `Dialog` for modals.
        *   [ ] **Task UI1 (NEW):** Modal Styling Fixes (as per user request):
            *   [ ] Modify `DialogOverlay` in `src/components/ui/dialog.tsx` for an opaque background (e.g., `bg-background` or `bg-black/90`).
            *   [ ] Update `DialogContent` in `src/components/ui/dialog.tsx` to be full-screen on mobile devices, while retaining standard modal appearance on larger screens.
        *   [ ] **Task UI2:** Ensure overall responsiveness across common screen sizes.
    *   **Accessibility & Standards:**
        *   [ ] **Task UI3:** Adhere to basic a11y principles.
        *   [x] `components.json` for Shadcn UI is in place.
        *   [x] Common reusable UI components in `src/components/common/` (e.g., `LoadingSpinner`).
*   **Key Components/Files Involved:**
    *   Frontend: `src/app/layout.tsx`, `src/components/layout/DashboardLayout.tsx`, `globals.css`, `tailwind.config.js`, `src/components/ui/dialog.tsx`, other Shadcn components.
*   **Acceptance Criteria:**
    *   [x] Consistent global layout and navigation.
    *   [x] Core UI elements styled consistently.
    *   [ ] **NEW:** Modals have an opaque background and are full-screen on mobile.
    *   [ ] Application is generally responsive.
    *   [x] User feedback (toasts) implemented.

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

## 4. Tech Stack (Confirmed)

*   **Frontend Framework:** Next.js (v15+ with App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (v4+)
*   **UI Components:** Shadcn UI (components in `/src/components/ui` like `avatar.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `label.tsx`, `sonner.tsx`, `textarea.tsx`, etc.)
    *   Command: `npx shadcn-ui@latest add <component_name>` (as per memory `ff970f05-13b6-46b1-afca-120f2430c460`)
*   **Backend & Database:** Supabase (Auth, Postgres, Storage, Realtime)
*   **ORM:** Drizzle ORM with Drizzle Kit for migrations (scripts `db:generate`, `db:push`, `db:migrate` in `package.json`)
*   **Form Handling:** React Hook Form
*   **Validation:** Zod
*   **Data Fetching (Client-side):** TanStack Query (React Query)
*   **State Management:** React Context (`AuthContext`), local component state (`useState`).
*   **Deployment Options:** Netlify, Hetzner (as previously noted).

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

---

## Feature Status: Dates & Destinations (Mobile-Friendly Availability)

**Completed**
* Off-by-one bug fixed (local `toYMD` helper).
* Auto-vote: creator automatically receives an "available" vote on new range (writes to `proposal_votes`).
* Summary tab toggle and basic range expansion working.

**In Progress**
* Horizontal vote bar – segments render but widths still need correct math + colouring.
* Keep card open while typing comment (stopPropagation fix pending).
* Creator-only delete button UI & mutation wiring.

**Next Up**
* Edit range title / dates.
* "Eraser" tool to clear own indicated ranges with confirm dialog.
* Heat-map integration for calendar view.
* Mobile a11y polish & RWD testing.

