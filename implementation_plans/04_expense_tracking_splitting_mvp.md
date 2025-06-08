# Feature: Expense Tracking & Splitting (Simplified MVP - Phase 1)

**Status:** Not Started
**Last Updated:** 2025-06-08

## 1. Overview
Allow users to add expenses (description, amount, payer, single currency), view a list of expenses per trip, display who paid what, and implement basic splitting (e.g., equally among all included members). Excluding specific members from splits will be refined in Phase 2.

## 2. Sub-Tasks & Implementation Details

### 2.1. Supabase Setup - Tables & RLS
- [ ] **Task 1:** Design `expenses` table.
  - [ ] Schema: `id` (UUID, primary key), `trip_id` (UUID, references `trips(id)` on delete cascade), `description` (TEXT, not null), `amount` (NUMERIC, not null), `currency` (TEXT, default 'EUR' - single currency for MVP), `paid_by_user_id` (UUID, references `auth.users(id)`), `paid_at_date` (DATE, not null), `notes` (TEXT, optional), `created_by` (UUID, references `auth.users(id)`), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
  - [ ] RLS: Trip members can add expenses for their trip. Trip members can view expenses for their trip. Only expense creator or trip owner/co-owner can edit/delete an expense.
- [ ] **Task 2:** Design `expense_splits` table (for tracking who is involved in an expense).
  - [ ] Schema: `id` (UUID, primary key), `expense_id` (UUID, references `expenses(id)` on delete cascade), `user_id` (UUID, references `auth.users(id)`), `share_amount` (NUMERIC, optional - for MVP, this might be calculated on the fly or stored if equal split). For MVP, just recording involvement might be enough, and split calculation is done client-side.
  - [ ] RLS: Trip members can view splits they are part of. Expense creator or trip owner/co-owner can manage splits.
  - [ ] **MVP Simplification:** For equal splitting among all members, this table might initially just store `expense_id` and `user_id` for each participant in the split. The actual share amount can be calculated dynamically.

### 2.2. Frontend - Expense Management
- [ ] **Task 3:** UI for adding a new expense within a trip page (e.g., `/trips/[tripId]/expenses`).
  - [ ] Form: Description, Amount, Payer (dropdown of trip members), Date Paid.
  - [ ] For MVP, "Split among" will default to all trip members.
  - [ ] `react-hook-form` and `zod` for validation.
- [ ] **Task 4:** UI for displaying a list of expenses for the trip.
  - [ ] Show description, amount, who paid, date.
  - [ ] Edit/Delete expense functionality (respecting permissions).
- [ ] **Task 5:** UI for displaying "Who Paid What" summary.
  - [ ] Aggregate total paid by each member.

### 2.3. Frontend - Basic Splitting Logic (Display)
- [ ] **Task 6:** For each expense, display how it's split (e.g., "Split equally among X members: Y amount each").
- [ ] **Task 7:** Calculate and display a simple "Who Owes Whom" summary based on equal splits.
    - This will be a simplified version. For example:
        - Calculate total trip expenses.
        - Calculate each member's "fair share" (total expenses / number of members).
        - For each member, calculate `amount_paid - fair_share`.
        - Positive means they are owed, negative means they owe.
    - *Advanced settlement logic is for Phase 2.*

### 2.4. Frontend - Services & State
- [ ] **Task 8:** Create `expenseService.ts`.
  - [ ] Functions: `getExpenses(tripId)`, `addExpense(...)`, `updateExpense(...)`, `deleteExpense(...)`.
  - [ ] Functions for managing `expense_splits` if explicitly storing them: `addExpenseSplitParticipants(...)`.
- [ ] **Task 9:** Use TanStack Query for fetching and caching expense data.
- [ ] **Task 10:** Manage local form state with `react-hook-form` and `zod`.

## 3. Key Components/Files Involved
*   **Frontend:**
    *   `src/app/(dashboard)/trips/[tripId]/expenses/page.tsx` (or integrated)
    *   `src/components/common/ExpenseList.tsx`
    *   `src/components/common/ExpenseListItem.tsx`
    *   `src/components/common/AddExpenseForm.tsx`
    *   `src/components/common/ExpenseSummary.tsx` (for who paid what, basic balances)
    *   `src/services/expenseService.ts`
    *   `src/types/index.ts` (for Expense, ExpenseSplit types)
*   **Backend (Supabase):**
    *   `expenses` table
    *   `expense_splits` table (or simplified approach for MVP)
    *   RLS Policies for tables.

## 4. Notes & Considerations
*   Currency: MVP is single currency (e.g., EUR). Make this configurable or hardcoded initially.
*   Splitting logic: MVP is equal split among all trip members. The ability to select specific members for a split is Phase 2.
*   Settlements: Marking expenses as settled is Phase 2. MVP focuses on tracking and basic balance display.
*   Floating point precision: Be mindful when working with monetary values. Supabase `NUMERIC` type is good. JavaScript numbers might need care (e.g., work in cents or use a library if complex calculations arise).

## 5. Acceptance Criteria
*   A trip member can add an expense, specifying description, amount, who paid, and date.
*   Expenses are recorded in a single, predefined currency.
*   Trip members can view a list of all expenses for that trip.
*   The system displays a summary of "who paid what" (total amount paid by each member).
*   For each expense, the system shows it's split equally among all trip members.
*   A basic summary of balances (who owes/is owed based on equal splits) is displayed.
*   Users with appropriate permissions can edit or delete expenses.
