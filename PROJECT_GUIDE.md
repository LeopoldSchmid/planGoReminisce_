# Plangoreminisce - Project Guide

**Last Updated:** 2025-06-20  
**Version:** 1.0  

This document serves as the single source of truth for the Plangoreminisce project, consolidating all planning documents and providing comprehensive guidance for development.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Development Commands](#development-commands)
4. [Database Schema](#database-schema)
5. [Feature Status](#feature-status)
6. [Mobile-First Design Guidelines](#mobile-first-design-guidelines)
7. [Recent Fixes & Improvements](#recent-fixes--improvements)
8. [Troubleshooting](#troubleshooting)
9. [Development Workflow](#development-workflow)

## Project Overview

Plangoreminisce is a responsive web application designed to simplify collaborative trip planning among friends. The app shifts planning from a solo effort to a shared, enjoyable experience, serving as a companion before, during, and after trips.

### Core Vision
- **Collaborative Planning**: Multiple people can contribute to trip decisions
- **Mobile-First**: Optimized for smartphone usage during planning sessions
- **Data-Driven Decisions**: Availability tracking and voting help groups find consensus
- **Comprehensive Features**: From initial planning to expense tracking and memories

### Target Use Case
Groups planning multi-day trips (e.g., week-long mountain bike holidays) where coordination among friends is essential.

## Architecture

### Tech Stack
- **Frontend:** Next.js 15 with App Router, TypeScript, Tailwind CSS v4+
- **UI Components:** Shadcn UI with custom mobile-first adaptations
- **Backend & Database:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **ORM:** Drizzle ORM with migrations (though currently using Supabase directly)
- **Form Handling:** React Hook Form + Zod validation
- **Data Fetching:** TanStack Query (React Query)
- **State Management:** React Context (AuthContext) + local component state

### Application Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes (login, signup)
│   ├── (dashboard)/       # Protected routes (trips, profile)
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Shadcn UI components
│   ├── planning/          # Trip planning components
│   ├── layout/            # Layout components
│   └── ...                # Feature-specific components
├── services/              # API service functions
├── types/                 # TypeScript type definitions
├── context/               # React contexts
└── lib/                   # Utility functions
```

### Key Architectural Patterns

**Authentication Flow:**
- `AuthContext` manages global auth state
- Protected routes use `useAuth()` hook
- User profiles linked to Supabase `auth.users` via `profiles` table
- Asynchronous profile fetching after auth state changes

**Data Layer:**
- Service files handle API calls (authService, profileService, tripService, etc.)
- TanStack Query for client-side caching and state management
- Supabase client via `createSupabaseBrowserClient()`
- Row Level Security (RLS) policies enforce authorization

**Availability System Architecture:**
- **Central Personal Calendar**: User's general availability across all activities (`user_availability`)
- **Trip-Specific Calendar**: Per-trip availability that can be synced from central but modified independently (`trip_user_availability`) 
- **Group Visualization**: Aggregate team availability views with percentage-based heatmaps
- **Sync Mechanism**: Users can sync central availability to trip calendars with tracking

## Development Commands

### Core Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build production application
npm run lint         # Run ESLint for code quality
npm start           # Start production server
```

### Database Management
```bash
# Supabase CLI (primary method)
npx supabase migration new <name>    # Create new migration
npx supabase db push --local         # Push changes to database
npx supabase db reset               # Reset local database

# Drizzle (backup/future)
npm run db:generate  # Generate migrations
npm run db:push      # Push schema changes
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio
```

### Environment Setup
Required environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Database Schema

### Core Tables

**Authentication & Users:**
- `profiles` - User profile data linked to auth.users

**Trip Management:**
- `trips` - Trip records with creator tracking
- `trip_members` - Junction table with roles (owner/co-owner/member)
- `trip_invitations` - Token-based invitation system

**Planning & Availability:**
- `user_availability` - Central personal availability calendar (available/maybe/unavailable)
- `trip_user_availability` - Trip-specific availability with sync tracking (formerly `trip_availability_overrides`)
- `date_proposals` - Date range proposals for trips
- `destination_proposals` - Destination suggestions
- `proposal_votes` - Voting on proposals (available/maybe/unavailable)
- `proposal_discussions` - Threaded discussion system

**Trip Features:**
- `shopping_lists` - Multiple lists per trip
- `shopping_list_items` - Items with quantities, assignments, purchase tracking
- `expenses` - Comprehensive expense tracking
- `expense_participants` - Detailed participant and payment tracking
- `recipes` - Recipe management with ingredients
- `recipe_ingredients` - Ingredients with standardized units

### Key Database Functions
- `get_effective_availability()` - Resolve user availability with trip-specific overrides
- `get_trip_availability_heatmap()` - Generate availability heatmaps with maybe status support
- `get_proposal_stats()` - Calculate proposal voting statistics
- `auto_vote_on_date_proposal()` - Automatically vote when creating proposals
- `sync_central_to_trip_availability()` - Sync central calendar to trip-specific calendar
- `check_trip_availability_sync_status()` - Check if trip calendar needs sync with central

## Feature Status

### ✅ Completed Features
- **User Authentication & Profiles** - Complete with Supabase Auth
- **Trip Management** - Creation, listing, member invitations, deletion
- **Dual Availability System** - Central personal calendar + trip-specific calendars with sync
- **Enhanced Trip Planning** - Availability calendars, proposal voting, discussions
- **Mobile-First Availability UI** - Personal/Group view toggle, touch interactions, percentage heatmaps
- **Shopping Lists** - Multi-list support, member assignments, purchase tracking
- **Expense Tracking** - Multiple splitting methods, payment tracking
- **Recipe Management** - Ingredients, standardized units, detailed planning

### 🚧 In Progress
- Enhanced mobile UI polish and animations
- Advanced expense splitting algorithms
- Recipe-to-shopping-list aggregation

### 📋 Planned Features
- Location & booking assistance
- Trip dashboard with pending tasks
- Photo sharing and "reminisce" features
- Offline access capabilities
- Push notifications for important events

## Mobile-First Design Guidelines

### Core Principles
1. **Progressive Disclosure** - Show only essential information by default
2. **Touch-First Interactions** - Large touch targets, proper feedback
3. **Minimal Visual Clutter** - Icons over text, breathing room
4. **Single Header Rule** - Avoid header stacking
5. **Context-Aware Labels** - Show labels only when selected/active

### Component Guidelines

**Navigation:**
- Bottom navigation with icons + phase names
- Remove unnecessary descriptive text
- Focus on essential information only

**Calendar Components:**
- Unique keys for all calendar cells
- Availability legend shows labels on selection/hover
- Minimal color coding with clear visual hierarchy

**Card Interactions:**
- Only card headers toggle expansion
- Prevent event propagation from inputs and controls
- Animate expansion/minimization for smooth UX
- Single card expansion at a time

### Interaction Patterns
- **Tap to Select**: First tap selects start date, second tap selects end
- **Drag to Paint**: Desktop-style drag selection for availability
- **FAB Menus**: Floating action buttons for contextual actions
- **Sheet Modals**: Bottom sheets for mobile-friendly forms

## Recent Fixes & Improvements

### Availability System Refactor (2025-06-20)
- **Architectural Separation**: Clear distinction between central personal calendar and trip-specific calendars
- **Database Schema Updates**: Renamed `trip_availability_overrides` to `trip_user_availability` with sync tracking
- **Two-View Calendar System**: Personal view for editing + Group view for team availability visualization
- **Sync Functionality**: Users can sync central availability to trip calendars with tracking
- **Enhanced Heatmaps**: Group view shows percentage-based availability with color coding
- **Service Layer Refactor**: Separate functions for central vs trip-specific operations

### Database Schema Fixes (2025-06-20)
- **Fixed availability status enum**: Added support for 'maybe' status alongside 'available'/'unavailable'
- **Aligned vote types**: Changed from upvote/downvote to available/maybe/unavailable for intuitive voting
- **Auto-vote trigger**: Users automatically vote 'available' when creating date proposals

### Data Flow Improvements
- **Auto-save availability**: Calendar painting now automatically saves to database
- **Fixed comment mapping**: Corrected discussion data flow between components
- **Enhanced error handling**: Added console logging and user feedback
- **Optimized Refresh**: Fixed excessive refresh calls causing old data loads

### Mobile UI Enhancements
- **FAB menu implementation**: Edit, delete, vote change, and hide actions
- **Card interaction fixes**: Proper event propagation and state management
- **Touch feedback**: Improved visual responses to user interactions
- **View Toggle**: Clean personal/group availability view switching

## Troubleshooting

### Common Issues

**Q: Date range creation not working**
- **Cause**: Database schema mismatch or data flow issues
- **Solution**: Check console for errors, ensure migration is applied, verify auto-save is working

**Q: Comments not appearing**
- **Cause**: Incorrect discussion data mapping
- **Solution**: Check that `allDiscussionsData` is properly filtered by proposal ID

**Q: Availability painting not saving**
- **Cause**: Auto-save not triggered
- **Solution**: Verify `handleDatesChange` is connected and `saveAvailabilityMutation` is working

**Q: Vote types not matching UI**
- **Cause**: Database still using old upvote/downvote system
- **Solution**: Apply the latest migration to update vote types

**Q: Group availability view not showing data**
- **Cause**: Heatmap query not returning data or old table names
- **Solution**: Ensure `trip_user_availability` table exists and trip has members with availability data

**Q: Sync functionality not working**
- **Cause**: RPC functions not created or old function signatures
- **Solution**: Run the latest migration to create sync functions

### Development Tips

1. **Check Browser Console**: All service calls are logged for debugging
2. **Verify Database State**: Use Supabase dashboard to check data
3. **Test on Mobile**: Use browser dev tools mobile simulation
4. **Monitor Network Tab**: Check for API call failures

### Migration Issues

If you encounter database issues:
```bash
# Reset and reapply all migrations
npx supabase db reset
npx supabase db push --local

# Check migration status
npx supabase migration list
```

## Development Workflow

### Adding New Features

1. **Plan the Feature**: Update this guide with new requirements
2. **Database Changes**: Create migration if needed
3. **Service Layer**: Add API functions in appropriate service file
4. **Component Layer**: Create/update UI components
5. **Integration**: Wire components to services via TanStack Query
6. **Testing**: Test on mobile and desktop
7. **Documentation**: Update this guide

### Code Style Guidelines

- **Type Safety**: All functions should have proper TypeScript types
- **Error Handling**: Include user-friendly error messages
- **Consistent Patterns**: Follow existing service and component patterns
- **Mobile First**: Always consider mobile experience first

### Best Practices

1. **Component Structure**: Keep components focused and reusable
2. **State Management**: Use TanStack Query for server state, local state for UI
3. **Database Queries**: Optimize for performance, use RLS policies
4. **User Experience**: Provide loading states and error feedback
5. **Security**: Never expose sensitive data, use RLS policies

---

This document replaces all previous planning documents and should be kept up-to-date as the project evolves. For immediate development questions, refer to `CLAUDE.md` for Claude Code specific guidance.