"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getTripById } from "@/services/tripService";
import Link from "next/link";
import { InviteMemberForm } from "@/components/trips/InviteMemberForm";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // For styling later
// import { Button } from "@/components/ui/button"; // For future actions like "Invite Members"

export default function TripDetailsPage() {
  const params = useParams();
  const tripId = params.tripId as string; // Assuming tripId is always present
  const { user, isLoading: authLoading } = useAuth();

  const { 
    data: tripData, 
    isLoading: tripDetailsLoading, 
    error: tripDetailsError 
  } = useQuery({
    queryKey: ["tripDetails", tripId, user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      if (!tripId) throw new Error("Trip ID is missing");
      return getTripById(tripId, user.id);
    },
    enabled: !!user && !authLoading && !!tripId,
  });

  const isLoading = authLoading || tripDetailsLoading;

  if (isLoading) {
    return <div className="container mx-auto py-10 text-center">Loading trip details...</div>;
  }

  if (tripDetailsError) {
    return <div className="container mx-auto py-10 text-center text-red-500">Error: {tripDetailsError.message}</div>;
  }

  const trip = tripData?.trip;

  if (!trip) {
    // This can happen if getTripById returns error code 404 or null trip
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-semibold mb-4">Trip Not Found</h2>
        <p className="text-gray-600 mb-6">
          The trip you are looking for either does not exist or you do not have permission to view it.
        </p>
        <Link href="/trips" className="text-blue-500 hover:underline">
          &larr; Back to My Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Basic display, to be enhanced with Card component later */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{trip.name}</h1>
            <p className="text-sm text-gray-500">Trip ID: {trip.id}</p>
          </div>
          {/* Placeholder for future action buttons */}
          {/* <div>
            <Button variant="outline" className="mr-2">Edit Trip</Button>
            <Button>Invite Members</Button>
          </div> */}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Description</h2>
          <p className="text-gray-600 whitespace-pre-wrap">
            {trip.description || "No description provided."}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Dates</h2>
          <p className="text-gray-600">
            {trip.start_date && trip.end_date 
              ? `From ${new Date(trip.start_date).toLocaleDateString()} to ${new Date(trip.end_date).toLocaleDateString()}` 
              : "Dates have not been decided yet."}
          </p>
        </div>
        
        {/* Placeholder for Member List - Task 8 */}
        {/* <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Members</h2>
          <p className="text-gray-600">Member list will be displayed here.</p>
        </div> */}

        {/* Invite Member Form */}
        {tripId && user && <InviteMemberForm tripId={tripId} />}

        <div className="mt-8 border-t pt-6">
          <Link href="/trips" className="text-blue-600 hover:text-blue-800 transition-colors">
            &larr; Back to My Trips
          </Link>
        </div>
      </div>
    </div>
  );
}
