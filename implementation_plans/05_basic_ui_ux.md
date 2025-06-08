# Feature: Basic UI/UX (Phase 1 MVP)

**Status:** Not Started
**Last Updated:** 2025-06-08

## 1. Overview
Establish a clean, intuitive, and responsive user interface using Next.js App Router, Tailwind CSS, and Shadcn UI components. This includes setting up global styles, main layouts, and ensuring a consistent look and feel across the MVP features.

## 2. Sub-Tasks & Implementation Details

### 2.1. Project Setup & Configuration (Partially Done)
- [ ] **Task 1:** Confirm Next.js (v14+ App Router), TypeScript, Tailwind CSS, Shadcn UI are installed and configured. (Mostly done, Tailwind/Shadcn UI setup should be verified).
  - [ ] Initialize Shadcn UI if not already done (`npx shadcn-ui@latest init`).
  - [ ] Configure `tailwind.config.js` and `postcss.config.js`.
  - [ ] Set up `global.css` for base styles.
- [ ] **Task 2:** Define basic theme (colors, fonts) in `tailwind.config.js` and/or `global.css` consistent with Shadcn UI's approach.
  - [ ] Primary, secondary, accent colors.
  - [ ] Default font families.

### 2.2. Layouts & Navigation
- [ ] **Task 3:** Create main application layout (`/src/app/layout.tsx`).
  - [ ] Include HTML shell, body, and integrate global styles.
  - [ ] Set up metadata (title, description).
- [ ] **Task 4:** Create dashboard layout (`/src/app/(dashboard)/layout.tsx`).
  - [ ] Include a persistent navigation sidebar/header for authenticated users.
  - [ ] Links to: My Trips, Profile, Logout.
  - [ ] Placeholder for main content area.
- [ ] **Task 5:** Create authentication layout (`/src/app/(auth)/layout.tsx`).
  - [ ] Centered layout for login/signup forms.
  - [ ] Minimal branding, links to switch between login/signup.
- [ ] **Task 6:** Implement a responsive navigation bar/sidebar.
  - [ ] Use Shadcn components like `Sheet` for mobile navigation if applicable.
  - [ ] Ensure navigation is accessible and keyboard-navigable.

### 2.3. Core UI Components & Styling
- [ ] **Task 7:** Develop a consistent style for forms using Shadcn UI components (`Input`, `Button`, `Label`, `Select`, `Checkbox`, `DatePicker`).
  - [ ] Ensure forms are accessible and provide clear validation messages (using `react-hook-form` and `zod`).
- [ ] **Task 8:** Style for displaying lists of data (e.g., trip list, shopping items, expenses).
  - [ ] Use Shadcn `Table`, `Card`, or custom list components.
- [ ] **Task 9:** Implement user feedback mechanisms.
  - [ ] Use Shadcn `Toast` for success/error notifications from actions.
  - [ ] Use Shadcn `Alert` or `AlertDialg` for confirmations or important messages.
- [ ] **Task 10:** Ensure basic responsiveness across common screen sizes (mobile, tablet, desktop).
  - [ ] Test layouts and components on different viewports.
  - [ ] Utilize Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`).

### 2.4. Accessibility & Standards
- [ ] **Task 11:** Adhere to basic accessibility (a11y) principles.
  - [ ] Use semantic HTML.
  - [ ] Ensure sufficient color contrast.
  - [ ] Basic keyboard navigation for all interactive elements.
- [ ] **Task 12:** Establish a `components.json` for Shadcn UI and ensure consistent usage.
- [ ] **Task 13:** Create common reusable UI components in `src/components/common/` for elements not directly covered by Shadcn or requiring specific app logic (e.g., `PageHeader.tsx`, `LoadingSpinner.tsx`).

## 3. Key Components/Files Involved
*   **Frontend:**
    *   `src/app/layout.tsx`
    *   `src/app/(dashboard)/layout.tsx`
    *   `src/app/(auth)/layout.tsx`
    *   `src/styles/globals.css` (or `src/app/global.css` as per Next.js App Router convention)
    *   `tailwind.config.js`, `postcss.config.js`
    *   `components.json` (Shadcn UI)
    *   `src/components/ui/` (Shadcn UI components)
    *   `src/components/common/` (Custom shared components like Nav, Footer, Page specific layouts)
    *   `src/lib/utils.ts` (for `cn` utility from Shadcn)
*   **Design/Guidelines:**
    *   Architectural Guidelines (for component structure, naming)
    *   Shadcn UI documentation

## 4. Notes & Considerations
*   Focus on a clean, functional, and usable interface for MVP. Elaborate styling or animations can be deferred.
*   Prioritize responsiveness for mobile and desktop.
*   Consistency in using Shadcn UI components and custom components.
*   Dark mode is not an MVP requirement unless specified otherwise.
*   Loading states: Ensure UI provides feedback during data fetching or async operations.
*   Empty states: Design how empty lists or sections without data will appear.

## 5. Acceptance Criteria
*   The application has a consistent global layout and navigation structure.
*   Authenticated users see a dashboard layout with navigation to key features.
*   Authentication pages (login, signup) have a distinct, focused layout.
*   Core UI elements (forms, buttons, lists) are styled consistently using Shadcn UI.
*   The application is responsive and usable on common mobile and desktop screen sizes.
*   Basic user feedback (toasts for actions, alerts for confirmations) is implemented.
*   Basic accessibility standards (semantic HTML, keyboard navigation) are met.
