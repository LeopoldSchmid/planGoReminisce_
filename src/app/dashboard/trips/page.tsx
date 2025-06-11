"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserTrips } from "@/services/tripService";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TripsPage() {
    const { user, isLoading } = useAuth();
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        getUserTrips(user.id).then(({ trips, error }) => {
            if (error) setError(error.message || "Failed to load trips");
            setTrips(trips || []);
            setLoading(false);
        });
    }, [user]);

    if (isLoading || loading) {
        return <div>Loading your trips...</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">My Trips</h1>
                <Link href="/dashboard/trips/new">
                    <Button>Create New Trip</Button>
                </Link>
            </div>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {trips.length === 0 ? (
                <div>No trips yet. Create your first trip!</div>
            ) : (
                <ul className="space-y-4">
                    {trips.map((trip) => (
                        <li key={trip.id} className="border rounded p-4">
                            <Link href={`/dashboard/trips/${trip.id}`} className="text-lg font-semibold text-blue-700 hover:underline">
                                {trip.name}
                            </Link>
                            <div className="text-sm text-gray-600 mt-1">{trip.description || "No description"}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Dates: {trip.start_date && trip.end_date ? `${trip.start_date} to ${trip.end_date}` : "To Be Decided"}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
} 