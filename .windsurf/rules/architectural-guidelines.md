---
trigger: always_on
---

# Plangoreminisce - Architectural Guidelines

## 1. Introduction
Core architectural guidelines for Plangoreminisce to ensure consistency, maintainability, and scalability. Refer to `plan.md` for project vision.

## 2. Core Technologies
*   **Frontend:** Next.js (v14+, App Router), TypeScript
*   **Styling:** Tailwind CSS, Shadcn UI
*   **Backend/DB:** Supabase (Auth, Postgres, Storage, Realtime)
*   **Forms/Validation:** React Hook Form, Zod
*   **Data Fetching (Client):** TanStack Query (React Query)
*   **State Management:** React Context (simple), Zustand/Jotai (complex)

## 3. Directory Structure (Next.js App Router)
Organized structure following Next.js conventions:
*   `/public`: Static assets.
*   `/src/app`: Next.js App Router (routes, layouts `/(auth)`, `/(dashboard)` groups, API routes, `global.css`).
*   `/src/components`: Shared UI (`/ui` for Shadcn, `/common` for custom).
*   `/src/lib`: Utilities (`utils.ts`), Supabase client (`supabaseClient.ts`).
*   `/src/services`: Data fetching/mutation logic for Supabase (e.g., `tripService.ts`).
*   `/src/hooks`: Custom React hooks.
*   `/src/store`: State management (if Zustand/Jotai used).
*   `/src/types`: TypeScript definitions (`index.ts` main export).
*   `/src/config`: Application configuration.
*   Root: `.env.local`, `.gitignore`, `components.json`, `next.config.mjs`, `package.json`, etc.

## 4. Component Design
*   Use functional components & Hooks.
*   Primary UI: Shadcn UI, customize as needed.
*   Type all props (TS interfaces/types).
*   Small, focused components (single responsibility).
*   Favor composition for complex UIs.
*   Naming: PascalCase for components & files (e.g., `TripCard.tsx`).

## 5. State Management
*   Local state: `useState`, `useReducer`.
*   Server state/cache: TanStack Query with Supabase.
*   Global state (simple): React Context (e.g., auth user, theme).
*   Global state (complex): Evaluate Zustand/Jotai.
*   Avoid prop drilling (use Context/state libraries).

## 6. API Interaction (Supabase)
*   Centralized Supabase client in `src/lib/supabaseClient.ts`.
*   Service layer (`src/services/*`) for Supabase calls (data fetching/mutations).
*   Store credentials in `.env.local` (access via `process.env`).
*   Leverage Supabase Row Level Security (RLS) extensively.
*   Ensure typed Supabase responses; use Zod for validation if needed.

## 7. Coding Style & Conventions
*   ESLint & Prettier for consistent style & error catching (setup TBD).
*   Naming: PascalCase for components, types, interfaces; `camelCase` for functions, variables, other files.
*   TypeScript: Avoid `any`; use `const`; utilize utility types (`Partial`, `Omit`).
*   Write modular, focused code.
*   Clear comments for complex logic; JSDoc for functions.

## 8. Error Handling
*   User-friendly UI errors (Shadcn `Alert`/`Toast`).
*   Catch errors from API calls (Supabase) & async operations.
*   Basic client-side logging (dev); consider robust logging for production.

## 9. Testing
*   Unit tests (Jest/Vitest) for utils, hooks, complex logic.
*   Component/integration tests: React Testing Library.
*   E2E tests (Playwright/Cypress) as app complexity grows.
*   Aim for reasonable test coverage, focusing on critical paths.

## 10. Version Control (Git)
*   Branching: Feature-based (e.g., `feature/user-auth`, `fix/login-bug`) from `main`/`develop`.
*   Commits: Clear, descriptive messages (consider Conventional Commits).
*   PRs: For code review before merging to main development branch.

## 11. Accessibility (a11y)
*   Strive for WCAG 2.1 AA.
*   Use semantic HTML5 elements.
*   Ensure keyboard navigation & visible focus indicators.
*   Use ARIA attributes for assistive technologies.
*   Test with a11y tools (e.g., Axe DevTools) during development.

## 12. Security
*   Validate inputs: client-side (Zod) & server-side (Supabase policies/functions).
*   Implement robust Supabase RLS.
*   Protect API keys/credentials via environment variables (no client-side service keys).
*   Keep dependencies updated.

## 13. Documentation
*   Comment complex logic in code.
*   Ensure well-typed props; JSDoc for non-obvious props.
*   Keep `README.md` updated (setup, overview).
*   Refer to `plan.md` for features & roadmap.
*   Keep these architectural guidelines updated.

This is a living document and will evolve.
