# Feature: Shared Shopping Lists (Phase 1 MVP)

**Status:** Not Started
**Last Updated:** 2025-06-08

## 1. Overview
Allow users to create and manage shared shopping lists per trip. Users can add, edit, and delete items, assign items to members, and mark items as fully purchased, tracking who did it and when. Partial completion and recipe features are for a later phase.

## 2. Sub-Tasks & Implementation Details

### 2.1. Supabase Setup - Tables & RLS
- [ ] **Task 1:** Design `shopping_lists` table.
  - [ ] Schema: `id` (UUID, primary key), `trip_id` (UUID, references `trips(id)` on delete cascade), `name` (TEXT, not null, e.g., "Groceries Week 1", "Bike Gear"), `created_by` (UUID, references `auth.users(id)`), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
  - [ ] RLS: Trip members can create lists for their trip. Trip members can view lists for their trip. Only list creator (or trip owner/co-owner) can edit/delete a list.
- [ ] **Task 2:** Design `shopping_list_items` table.
  - [ ] Schema: `id` (UUID, primary key), `list_id` (UUID, references `shopping_lists(id)` on delete cascade), `name` (TEXT, not null), `quantity` (TEXT, optional, e.g., "2 packs", "500g"), `notes` (TEXT, optional), `added_by` (UUID, references `auth.users(id)`), `assigned_to` (UUID, references `auth.users(id)`, optional), `is_purchased` (BOOLEAN, default false), `purchased_by` (UUID, references `auth.users(id)`, optional), `purchased_at` (TIMESTAMPTZ, optional), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
  - [ ] RLS: Trip members can add items to lists of trips they are part of. Trip members can edit/delete items they added, or if they are assigned, or if they are trip/list owner. Any trip member can mark an item as purchased/unpurchased.

### 2.2. Frontend - Shopping List Management
- [ ] **Task 3:** UI for displaying shopping lists within a trip page (e.g., `/trips/[tripId]/shopping`).
  - [ ] Allow creating a new shopping list (name).
  - [ ] Display existing lists, possibly as tabs or expandable sections.
- [ ] **Task 4:** UI for displaying items within a specific shopping list.
  - [ ] Show item name, quantity, notes, assigned member, purchase status.
  - [ ] "Add Item" form (name, quantity, notes, assign to member).
  - [ ] Edit/Delete item functionality (respecting permissions).
- [ ] **Task 5:** Implement "Assign Item" functionality.
  - [ ] Dropdown/selector with trip members.
- [ ] **Task 6:** Implement "Mark as Purchased" functionality.
  - [ ] Checkbox or button.
  - [ ] On change, update `is_purchased`, `purchased_by` (current user), and `purchased_at`.
  - [ ] Display who purchased it and when.

### 2.3. Frontend - Services & State
- [ ] **Task 7:** Create `shoppingListService.ts`.
  - [ ] Functions: `getShoppingLists(tripId)`, `createShoppingList(tripId, name)`, `updateShoppingList(...)`, `deleteShoppingList(...)`.
  - [ ] Functions: `getShoppingListItems(listId)`, `addShoppingListItem(...)`, `updateShoppingListItem(...)`, `deleteShoppingListItem(...)`, `markItemPurchased(itemId, userId)`.
- [ ] **Task 8:** Use TanStack Query for fetching and caching shopping list data.
- [ ] **Task 9:** Manage local form state with `react-hook-form` and `zod`.

## 3. Key Components/Files Involved
*   **Frontend:**
    *   `src/app/(dashboard)/trips/[tripId]/shopping/page.tsx` (or integrated into trip page)
    *   `src/components/common/ShoppingListDisplay.tsx`
    *   `src/components/common/ShoppingListItem.tsx`
    *   `src/components/common/AddShoppingItemForm.tsx`
    *   `src/components/common/CreateShoppingListForm.tsx`
    *   `src/services/shoppingListService.ts`
    *   `src/types/index.ts` (for ShoppingList, ShoppingListItem types)
*   **Backend (Supabase):**
    *   `shopping_lists` table
    *   `shopping_list_items` table
    *   RLS Policies for both tables.

## 4. Notes & Considerations
*   Real-time updates (Supabase Realtime) for shopping lists would be a great enhancement for Phase 2, so other members see changes live. For MVP, manual refresh or re-fetch on action is acceptable.
*   Clarity on who can edit/delete items vs. who can mark as purchased. MVP: Adder/Assignee/Owner can edit/delete. Any member can mark purchased.
*   Assigning items: ensure the dropdown only shows members of the current trip.

## 5. Acceptance Criteria
*   A trip member can create one or more shopping lists for a trip.
*   A trip member can add items (name, quantity, notes) to a shopping list.
*   A trip member can assign an item to another member of the trip.
*   Any trip member can mark an item as "purchased".
*   The system records who purchased an item and when.
*   Trip members can view all items on a shopping list, including their status and assignee.
*   Users with appropriate permissions can edit or delete shopping lists and items.
