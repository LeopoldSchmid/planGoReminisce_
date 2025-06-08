# Plangoreminisce

Plangoreminisce is a web application designed to simplify and enhance collaborative trip planning among friends. It aims to make planning a shared, enjoyable experience, acting as a companion before, during, and after any trip.

For a detailed project plan, including features, phased roadmap, and technical architecture, please see [plan.md](./plan.md).

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
*   **Backend & Database:** [Supabase](https://supabase.com/) (planned)
*   **Form Handling:** [React Hook Form](https://react-hook-form.com/) (planned)
*   **Validation:** [Zod](https://zod.dev/) (planned)
*   **Data Fetching (Client-side):** [TanStack Query (React Query)](https://tanstack.com/query/latest) (planned)

## Getting Started

First, ensure you have Node.js and npm installed.

1.  **Clone the repository (if you haven't already):**
    ```bash
    # If you're cloning for the first time
    # git clone <repository-url>
    # cd plangoreminisce
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project. You'll need to add configuration for Supabase here once it's set up.
    Example:
    ```
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about the technologies used, refer to their respective documentation:

*   [Next.js Documentation](https://nextjs.org/docs)
*   [Tailwind CSS Documentation](https://tailwindcss.com/docs)
*   [Shadcn UI Documentation](https://ui.shadcn.com/docs)
*   [Supabase Documentation](https://supabase.com/docs)

## Project Plan

For detailed information on the project's vision, features, and development roadmap, please refer to the [plan.md](./plan.md) file.
