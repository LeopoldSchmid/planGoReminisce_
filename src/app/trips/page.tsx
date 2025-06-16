"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getUserTrips } from "@/services/tripService";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, MapPin } from "lucide-react";

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
    <div className="container mx-auto py-6 px-4 sm:py-10 page-transition">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold gradient-primary-accent">
            My Trips
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Plan your next adventure</p>
        </div>
        <Link href="/trips/new">
          <Button className="w-full sm:w-auto min-h-[44px] bg-brand-accent hover:bg-brand-accent text-white font-medium">
            Create New Trip
          </Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Ready for your next adventure?</CardTitle>
            <CardDescription>
              Create your first trip to start planning memorable experiences with friends and family.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/trips/new">
              <Button className="w-full bg-brand-accent hover:bg-brand-accent text-white font-medium">Create Your First Trip</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 stagger-in">
          {trips.map((trip) => {
            // Determine trip status
            const now = new Date();
            const startDate = trip.start_date ? new Date(trip.start_date) : null;
            const endDate = trip.end_date ? new Date(trip.end_date) : null;
            
            let statusLabel = "Planning";
            let statusColor = "bg-planning text-planning-foreground";
            
            if (startDate && endDate) {
              if (now >= startDate && now <= endDate) {
                statusLabel = "Active";
                statusColor = "bg-active text-active-foreground";
              } else if (now > endDate) {
                statusLabel = "Complete";
                statusColor = "bg-complete text-complete-foreground";
              }
            }

            return (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="block group">
                <Card className="min-h-[160px] flex flex-col justify-between group-hover:scale-[1.02] transition-transform duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="line-clamp-2 mb-2">{trip.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {trip.description || "No description provided"}
                        </CardDescription>
                      </div>
                      <Badge className={`${statusColor} text-xs shrink-0`}>
                        {statusLabel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>
                          {trip.start_date && trip.end_date 
                            ? `${trip.start_date} to ${trip.end_date}` 
                            : "Dates to be decided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{trip.member_count || 1} member{(trip.member_count || 1) !== 1 ? 's' : ''}</span>
                      </div>
                      {trip.destination && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{trip.destination}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-accent font-medium text-sm group-hover:text-primary transition-colors">
                      View Details →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
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
