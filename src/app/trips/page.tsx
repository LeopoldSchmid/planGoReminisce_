"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getUserTrips } from "@/services/tripService";
import { Button } from "@/components/ui/button"; // For "Create New Trip" button
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // For TripCard later

function TripsPageContent() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: tripsData, isLoading: tripsLoading, error: tripsError } = useQuery({
    queryKey: ["userTrips", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return getUserTrips(user.id);
    },
    enabled: !!user && !authLoading, // Only run query if user is loaded and authenticated
  });

  const isLoading = authLoading || tripsLoading;

  if (isLoading) {
    return <LoadingSpinner message="Loading your trips..." />;
  }

  if (tripsError) {
    return <div className="container mx-auto py-10 text-center text-red-500">Error loading trips: {tripsError.message}</div>;
  }
  
  const trips = tripsData?.trips ?? [];

  return (
    <div className="container mx-auto py-6 px-4 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold">My Trips</h1>
        <Link href="/trips/new">
          <Button className="w-full sm:w-auto min-h-[44px]">Create New Trip</Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>You haven&apos;t joined or created any trips yet.</p>
          <p>
            <Link href="/trips/new" className="text-blue-500 hover:underline">
              Create your first trip!
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`} className="block">
              <div className="border p-5 rounded-lg shadow hover:shadow-md transition-shadow bg-white min-h-[140px] flex flex-col justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-2 line-clamp-2">{trip.name}</h2>
                  <p className="text-gray-600 mb-2 text-sm line-clamp-2">
                    {trip.description || "No description."}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-3">
                    Dates: {trip.start_date && trip.end_date ? `${trip.start_date} to ${trip.end_date}` : "To Be Decided"}
                  </p>
                  <div className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors">
                    View Details →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TripsPage() {
  return (
    <DashboardLayout>
      <TripsPageContent />
    </DashboardLayout>
  );
}
