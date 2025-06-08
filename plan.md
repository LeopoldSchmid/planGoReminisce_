# Plangoreminisce - Project Plan

## 1. Project Vision

To create "Plangoreminisce," a responsive web application designed to simplify and enhance collaborative trip planning among friends. The app aims to shift the planning dynamic from a solo effort to a shared, enjoyable experience, acting as a companion before, during, and after the trip. The goal is to make planning collaborative and less burdensome, especially for a group planning something like a week-long mountain bike holiday.

## 2. Core Features (Refined based on Feedback)

The application will focus on the following key features:

1.  **User Authentication & Roles:**
    *   Secure user registration, login, and logout (Supabase Auth).
    *   Basic user profiles.
    *   Trip roles: Owner, Co-Owner, Member. Initially, most permissions will be similar, but critical actions like deleting a trip will be restricted to Owner/Co-Owner.
2.  **Trip Management:**
    *   Create new trips (name, dates, description).
    *   View a list of user's trips.
    *   Invite members to a trip (e.g., by email or username).
    *   Trip deletion restricted to Owner/Co-Owner.
3.  **Collaborative Date Finding:**
    *   A crucial tool to help groups find suitable dates.
    *   **Design Consideration:** Simple polls are insufficient. We will explore more interactive solutions, such as a "Doodle-like" system where users can propose date ranges and members can mark availability/preferences across multiple slots, or a shared calendar overlay. The goal is a flexible and visual tool.
    *   Integration with external calendars (e.g., Google Calendar) is a potential future enhancement.
4.  **Location & Booking Assistance (MVP Focus: Decision Support):**
    *   For MVP, the focus is on facilitating group decisions rather than direct booking.
    *   Features to allow members to suggest multiple destinations/accommodations.
    *   Store information, links, and notes for each option.
    *   A discussion or "idea board" feature for members to comment on and compare options.
    *   Future consideration: Active location suggestions based on criteria (activity, budget) and deeper booking platform integrations.
5.  **Shared Shopping Lists (Enhanced):**
    *   Create and manage shopping lists per trip.
    *   Add/edit/delete items (name, quantity, notes).
    *   Assign items to specific trip members.
    *   Allow any member to mark items as purchased (fully or partially, e.g., "500g of 1000g tomatoes bought").
    *   Track who marked an item and when.
    *   **Future Enhancements (Post-MVP):**
        *   Recipe creation: Define recipes with ingredients and serving sizes.
        *   Automatic list population: Multiply recipe ingredients by servings and add to the shopping list.
        *   Ingredient aggregation: Consolidate identical ingredients from multiple recipes/items on the shopping list.
6.  **Expense Tracking & Splitting:**
    *   Log trip-related expenses (description, amount, payer).
    *   Single currency for MVP. Multi-currency is a future consideration.
    *   View a list of expenses per trip.
    *   Implement logic to split expenses (e.g., equally, by specific items, custom amounts).
    *   Ability to include/exclude specific members from particular expense splits.
    *   Calculate and display balances (who owes whom).
    *   Mark settlements.
7.  **Responsive Design:** Fully usable and optimized for both mobile and desktop/laptop.
8.  **Trip Companion & Dashboard:**
    *   A central dashboard for each trip showing key information: upcoming dates, pending tasks (e.g., unpurchased shopping items, undecided polls), recent activity.
9.  **Notifications (Basic):**
    *   In-app notifications for important events (e.g., new item on shopping list, expense added, date poll created). Near real-time updates are sufficient (Supabase Realtime can facilitate this).
10. **Offline Access Consideration:**
    *   Adding offline capabilities (e.g., viewing cached trip data) will be considered for later phases. We acknowledge this could impact architecture and will plan accordingly if prioritized.

## 3. Proposed Tech Stack

*   **Frontend Framework:** Next.js (v14+ with App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn UI
*   **Backend & Database:** Supabase (Leveraging Auth, Postgres Database, Storage, and Realtime features)
*   **Form Handling:** React Hook Form
*   **Validation:** Zod
*   **Data Fetching (Client-side):** TanStack Query (React Query)
*   **State Management:** React Context (for simpler global state), potentially Zustand/Jotai if complexity grows.
*   **Deployment Options:**
    *   Netlify (User has an account; excellent integration with Next.js) - *Initial recommendation*.
    *   Hetzner (User has a server; offers more control but requires manual setup/DevOps).

## 4. Phased Development Roadmap (User Feedback Incorporated)

The overall phasing remains as initially proposed, with feature details adjusted based on feedback.

### Phase 1: MVP (Minimum Viable Product)

**Goal:** Launch a basic, usable version with core collaborative features.

1.  **User Authentication & Profiles:**
    *   User registration, login, logout (Supabase Auth).
    *   Basic user profiles.
    *   Implementation of Owner, Co-Owner, Member roles.
2.  **Trip Management:**
    *   Create a new trip (name, dates, description).
    *   View a list of user's trips.
    *   Invite members to a trip.
    *   Trip deletion restricted to Owner/Co-Owner.
3.  **Core Feature - Shared Shopping Lists (MVP Scope):**
    *   Create/view shopping lists per trip.
    *   Add/edit/delete items (name, quantity, notes).
    *   Assign items to members.
    *   Mark items as fully purchased (tracking who and when). *Partial completion and recipe features are for a later phase.*
4.  **Core Feature - Expense Tracking & Splitting (Simplified MVP):**
    *   Add expenses (description, amount, payer, single currency).
    *   View a list of expenses per trip.
    *   Simple display of who paid what.
    *   Basic splitting (e.g., equally among all included members). *Excluding specific members from splits will be refined in Phase 2.*
5.  **Basic UI/UX:**
    *   Clean, intuitive interface using Shadcn UI components.
    *   Responsive design for mobile and desktop.

### Phase 2: Enhancing Core Functionality & Collaboration

**Goal:** Refine MVP features and add more collaborative tools.

1.  **Core Feature - Collaborative Date Finding (Detailed Implementation):**
    *   Implement the chosen interactive date-finding solution (e.g., Doodle-like poll, shared calendar).
    *   Visual overview of date preferences/availability.
2.  **Core Feature - Expense Splitting Logic (Advanced):**
    *   Full implementation of expense splitting (equally, by item, custom amounts).
    *   Refined UI for including/excluding members from specific expense splits.
    *   Calculate and display clear balances (who owes whom).
    *   Mark settlements.
3.  **Trip Dashboard:**
    *   A central view for each trip showing upcoming dates, pending tasks, recent activity.
4.  **Notifications (Basic):**
    *   In-app notifications for important events.

### Phase 3: Advanced Features & "Reminisce"

**Goal:** Add richer planning tools and post-trip features.

1.  **Core Feature - Location & Booking Assistance (Full Vision):**
    *   Implement the "idea board" or discussion forum for locations.
    *   Allow members to vote on or discuss suggested locations/accommodations.
    *   Store links or details for booked items.
    *   (Potential) Integration with a places API for suggestions.
2.  **Shared Shopping Lists (Advanced Features):**
    *   Implement partial completion of shopping items.
    *   Recipe creation and automatic addition to shopping lists with ingredient aggregation.
3.  **Itinerary Planning:**
    *   Simple day-by-day itinerary builder.
4.  **Document Sharing:**
    *   Upload and share trip-related documents (Supabase Storage).
5.  **"Reminisce" Features:**
    *   Post-trip photo sharing (basic gallery).
    *   Trip summaries or highlights.
6.  **Enhanced UI/UX & Polish.**
7.  **(Potential) Offline Access Capabilities.**

This plan provides a solid foundation. We can adjust it as we go based on your feedback and priorities.
