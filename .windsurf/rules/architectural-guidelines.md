---
trigger: always_on
---

# Plangoreminisce - Architectural Guidelines

## 1. Introduction

This document outlines the architectural guidelines and technical best practices for the Plangoreminisce project. Adhering to these guidelines will help ensure code consistency, maintainability, scalability, and a smooth collaborative development process.

For the overall project vision, features, and roadmap, please refer to the [Project Plan](../../plan.md).

## 2. Core Technologies

*   **Frontend Framework:** Next.js (v14+ with App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn UI
*   **Backend & Database:** Supabase (Auth, Postgres, Storage, Realtime)
*   **Form Handling:** React Hook Form
*   **Validation:** Zod
*   **Data Fetching (Client-side):** TanStack Query (React Query)
*   **State Management:** React Context (for simpler global state), Zustand/Jotai (if complexity grows)

## 3. Directory Structure (Based on Next.js App Router)

A well-organized directory structure is key. We will follow Next.js conventions and extend them as needed:

```
/plangoreminisce
├── /public                 # Static assets
├── /src
│   ├── /app                # Next.js App Router (routes, layouts, pages, loading UI)
│   │   ├── /(auth)         # Route group for authentication pages
│   │   ├── /(dashboard)    # Route group for main app dashboard/authenticated routes
│   │   ├── /api            # API routes (if needed beyond Supabase)
│   │   └── global.css      # Global styles
│   ├── /components         # Shared UI components
│   │   ├── /ui             # Shadcn UI components (as added)
│   │   └── /common         # Custom reusable components (e.g., TripCard, ExpenseItem)
│   ├── /lib                # Utility functions, helpers, Supabase client
│   │   ├── utils.ts        # General utility functions (cn from Shadcn)
│   │   └── supabaseClient.ts # Supabase client initialization
│   ├── /services           # Data fetching and mutation logic (interacting with Supabase)
│   │   ├── tripService.ts
│   │   └── authService.ts
│   ├── /hooks              # Custom React hooks
│   ├── /store              # State management (e.g., Zustand stores if used)
│   ├── /types              # TypeScript type definitions and interfaces
│   │   └── index.ts        # Main export for types
│   └── /config             # Application configuration
├── .env.local              # Local environment variables (ignored by Git)
├── .gitignore
├── components.json         # Shadcn UI configuration
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── plan.md                 # Project plan
└── README.md
```

## 4. Component Design

*   **Functional Components:** Exclusively use functional components with React Hooks.
*   **Shadcn UI:** Leverage Shadcn UI components as the primary building blocks for the UI. Customize them as needed.
*   **Props Typing:** All component props must be explicitly typed using TypeScript interfaces or types.
*   **Single Responsibility:** Keep components small, focused, and responsible for one piece of functionality or UI.
*   **Composition:** Favor composition over inheritance. Build complex UIs by combining smaller, reusable components.
*   **Naming:** Use PascalCase for component file names and component names (e.g., `TripCard.tsx`, `function TripCard() {}`).

## 5. State Management

*   **Local State:** Use `useState` and `useReducer` for component-level state.
*   **Server State / Data Fetching:** Use TanStack Query (React Query) for managing server state, caching, and data synchronization with Supabase.
*   **Global Client State:**
    *   Start with React Context API for simple global state (e.g., authenticated user, theme).
    *   If global state complexity increases significantly, evaluate and potentially migrate to Zustand or Jotai for more robust solutions.
*   **Avoid Prop Drilling:** Use Context or state management libraries to avoid excessive prop drilling.

## 6. API Interaction (Supabase)

*   **Centralized Client:** Initialize the Supabase client in a dedicated file (e.g., `src/lib/supabaseClient.ts`).
*   **Service Layer:** Abstract Supabase calls into a dedicated service layer (e.g., `src/services/tripService.ts`). These services will encapsulate data fetching and mutation logic.
*   **Environment Variables:** Store Supabase URL and anon key in `.env.local` and access them via `process.env`. Never hardcode credentials.
*   **Row Level Security (RLS):** Leverage Supabase RLS extensively to secure data access at the database level.
*   **Typed Responses:** Ensure that data fetched from Supabase is properly typed. Zod can be used for parsing and validating API responses if necessary.

## 7. Coding Style & Conventions

*   **ESLint & Prettier:** Configure and use ESLint and Prettier to enforce consistent code style and catch common errors. (Setup to be done).
*   **Naming Conventions:**
    *   `PascalCase` for components, types, and interfaces.
    *   `camelCase` for functions, variables, and file names (except components).
*   **TypeScript Best Practices:**
    *   Avoid `any` where possible; use specific types.
    *   Use `const` for variables that are not reassigned.
    *   Utilize utility types (e.g., `Partial`, `Omit`, `Pick`).
*   **Modularity:** Write small, focused modules and functions.
*   **Comments:** Write clear comments for complex logic or non-obvious code. JSDoc for functions where appropriate.

## 8. Error Handling

*   **User-Facing Errors:** Provide clear, user-friendly error messages in the UI. Use Shadcn UI components like `Alert` or `Toast` for notifications.
*   **Catch Errors:** Properly catch errors from API calls (Supabase) and other asynchronous operations.
*   **Logging:** Implement basic client-side logging for important errors or events, especially during development. Consider a more robust logging solution if needed in production.

## 9. Testing

*   **Unit Tests:** Write unit tests for utility functions, custom hooks, and complex business logic using a framework like Jest or Vitest.
*   **Integration/Component Tests:** Test component interactions and behavior using React Testing Library.
*   **E2E Tests (Future):** Consider End-to-End tests with Playwright or Cypress as the application grows in complexity.
*   **Test Coverage:** Aim for reasonable test coverage, focusing on critical paths and complex logic.

## 10. Version Control (Git)

*   **Branching Strategy:** Use a feature branching strategy (e.g., create a new branch for each feature or bugfix from `main` or `develop`).
    *   Example: `feature/user-authentication`, `fix/login-bug`.
*   **Commit Messages:** Write clear, concise, and descriptive commit messages. Follow conventional commit formats if the team agrees (e.g., `feat: add shopping list creation`).
*   **Pull Requests (PRs):** Use PRs for code review before merging into the main development branch.

## 11. Accessibility (a11y)

*   **WCAG Standards:** Strive to meet WCAG 2.1 AA guidelines.
*   **Semantic HTML:** Use appropriate HTML5 semantic elements.
*   **Keyboard Navigation:** Ensure all interactive elements are keyboard accessible and focus indicators are visible.
*   **ARIA Attributes:** Use ARIA attributes where necessary to enhance accessibility for assistive technologies.
*   **Testing:** Use accessibility testing tools (e.g., Axe DevTools browser extension) during development.

## 12. Security

*   **Input Sanitization/Validation:** Validate all user inputs on the client-side (with Zod) and server-side (Supabase policies/functions).
*   **Supabase RLS:** Implement robust Row Level Security policies in Supabase.
*   **API Keys:** Protect Supabase API keys and other sensitive credentials using environment variables. Do not expose service keys on the client side.
*   **Dependencies:** Keep dependencies updated to patch known vulnerabilities.

## 13. Documentation

*   **Code Comments:** Document complex logic within the code.
*   **Component Props:** Ensure props are well-typed and JSDoc comments explain their purpose if not obvious.
*   **README.md:** Keep the main `README.md` updated with setup instructions and project overview.
*   **plan.md:** Refer to `plan.md` for feature specifications and roadmap.
*   **This Document:** Keep these architectural guidelines updated as the project evolves.

These guidelines are a living document and may evolve as the project progresses.
