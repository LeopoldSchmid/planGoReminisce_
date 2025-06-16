# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Core Development:**
- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Build production application
- `npm run lint` - Run ESLint for code quality checks
- `npm start` - Start production server

**Database Management (Drizzle - Note: Currently using Supabase directly):**
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run pending migrations
- `npm run db:studio` - Open Drizzle Studio for database management

**Supabase Commands:**
- Local Supabase setup requires supabase CLI for migrations
- Migrations are located in `supabase/migrations/`
- Environment requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Architecture Overview

**Application Structure:**
- Next.js 15 with App Router using TypeScript
- Authentication via Supabase Auth with custom AuthContext provider
- Route groups: `(auth)` for login/signup, `(dashboard)` for protected routes
- Database: Supabase PostgreSQL with Row Level Security (RLS) policies

**Key Architectural Patterns:**

**Authentication Flow:**
- `AuthContext` (`src/context/AuthContext.tsx`) manages global auth state
- Protected routes use `useAuth()` hook and redirect unauthenticated users
- User profiles stored in `profiles` table linked to Supabase `auth.users`
- Profile fetching happens asynchronously after auth state changes

**Data Layer:**
- Service files in `src/services/` handle API calls (authService, profileService, tripService)
- TanStack Query for client-side data fetching and caching
- Supabase client created via `createSupabaseBrowserClient()` in `src/lib/supabaseClient.ts`
- Type definitions in `src/types/` with Supabase-generated types

**Database Schema:**
- `profiles`: User profile data linked to auth.users
- `trips`: Trip records with creator tracking
- `trip_members`: Junction table for trip membership with roles (owner/co-owner/member)
- `trip_invitations`: Token-based invitation system
- `availability`: Personal and team availability tracking for trip planning
- `proposals`: Date and destination proposals with voting system
- `proposal_votes`: Voting records for proposals
- `discussions`: Threaded discussion system for proposals
- `shopping_lists`: Multiple shopping lists per trip with member assignments
- `shopping_list_items`: Items with quantities, units, and purchase tracking
- `expenses`: Comprehensive expense tracking with multiple splitting methods
- `expense_participants`: Detailed participant and payment tracking
- `recipes`: Recipe management with ingredients and standardized units
- `recipe_ingredients`: Ingredients with quantities and standardized units
- All tables use UUID primary keys and include RLS policies

**UI Architecture:**
- Shadcn UI components in `src/components/ui/`
- Custom components in `src/components/` (planned structure)
- Tailwind CSS with CSS variables for theming
- React Hook Form + Zod for form validation
- Sonner for toast notifications

**Current Feature Status:**
- ✅ User authentication & profiles
- ✅ Trip management (creation, listing, member invitations, deletion)
- ✅ Advanced trip planning system with availability calendars and proposal voting
- ✅ Shopping lists with multi-list support, member assignments, and purchase tracking
- ✅ Comprehensive expense tracking with multiple splitting methods and payment tracking
- ✅ Recipe management with ingredients, standardized units, and detailed planning
- ✅ Real-time discussion system for proposals and collaboration

**Route Protection Pattern:**
```typescript
// Dashboard routes check authentication in layout
if (!user && !isLoading) {
  router.push('/login');
}
```

**Service Layer Pattern:**
- Each service exports functions that return promises
- Services use the Supabase client for database operations
- Error handling includes user-friendly messages for UI

**Supabase Integration:**
- RLS policies enforce authorization at database level
- User roles managed per-trip in `trip_members.role`
- Database functions handle complex operations (see migration files)

## Important Implementation Notes

**Advanced Trip Planning Features:**
- Sophisticated availability calendar with drag-to-paint interface for date selection
- Proposal system with voting mechanism for dates and destinations
- Real-time heatmap visualization showing team availability overlaps
- Threaded discussion system for collaborative decision-making

**Trip Invitation System:**
- Email-based invites with user resolution via database lookup
- Token-based invitation system for secure trip joining
- Role-based access control (owner/co-owner/member) with proper permissions

**Type Safety:**
- `Database` type imported from `@/types/supabase` (generated from Supabase)
- `UserWithProfile` interface combines Supabase auth with custom profile
- All service functions typed with proper return types

**Authentication Context:**
- Extensive logging for debugging auth state changes
- Profile fetching happens asynchronously after auth state loads
- `isLoading` state prevents premature redirects during initialization