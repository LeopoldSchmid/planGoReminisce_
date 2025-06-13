"use client";

import React from "react";
import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from "@tanstack/react-query";
// If you want to use React Query Devtools, uncomment the next line
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global default options for queries if needed
      // staleTime: 1000 * 60 * 5, // 5 minutes
      // refetchOnWindowFocus: false, 
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Ensure QueryClient is only created once
  const [client] = React.useState(() => queryClient);

  return (
    <TanstackQueryClientProvider client={client}>
      {children}
      {/* Optional: The React Query Devtools. Uncomment to use. */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </TanstackQueryClientProvider>
  );
}
