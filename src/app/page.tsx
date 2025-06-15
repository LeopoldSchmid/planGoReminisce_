"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getUserTrips } from "@/services/tripService";
import DashboardLayout from "@/components/layout/DashboardLayout";

function HomePage() {
  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome to Plangoreminisce</CardTitle>
          <CardDescription>
            Your collaborative trip planning starts here. Please log in or sign up to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-3">
            <Link href="/login">
              <Button className="w-full">Login</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="w-full">Sign Up</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ["userTrips", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return getUserTrips(user.id);
    },
    enabled: !!user?.id,
  });

  const trips = tripsData?.trips || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here&apos;s an overview of your trips and activities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Trips</CardTitle>
            <CardDescription>Active and upcoming trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {isLoading ? "..." : trips.length}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {trips.length === 1 ? "Trip" : "Trips"} in total
            </p>
            <Link href="/trips">
              <Button className="w-full">View All Trips</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/trips/new">
              <Button className="w-full" variant="outline">
                Create New Trip
              </Button>
            </Link>
            <Link href="/profile">
              <Button className="w-full" variant="outline">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>What&apos;s happening</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Activity feed coming soon...
            </p>
          </CardContent>
        </Card>
      </div>

      {trips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
            <CardDescription>Your most recent trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{trip.name}</h3>
                    <p className="text-sm text-gray-600">{trip.description || "No description"}</p>
                  </div>
                  <Link href={`/trips/${trip.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            {trips.length > 3 && (
              <div className="mt-4 text-center">
                <Link href="/trips">
                  <Button variant="ghost">View All Trips</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <DashboardLayout>
        <DashboardPage />
      </DashboardLayout>
    );
  }

  return <HomePage />;
}
