"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function TripDetailPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = params?.tripId as string;
    const supabase = createSupabaseBrowserClient();
    const [trip, setTrip] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tripId) return;
        setLoading(true);
        supabase
            .from("trips")
            .select("*")
            .eq("id", tripId)
            .single()
            .then(({ data, error }) => {
                if (error) setError(error.message || "Failed to load trip");
                setTrip(data);
                setLoading(false);
            });
    }, [tripId, supabase]);

    if (loading) {
        return <div>Loading trip details...</div>;
    }
    if (error) {
        return <div className="text-red-500">{error}</div>;
    }
    if (!trip) {
        return <div>Trip not found.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>
                <div className="text-gray-600 mb-2">{trip.description || "No description provided."}</div>
                <div className="text-sm text-gray-500 mb-2">
                    Dates: {trip.start_date && trip.end_date ? `${trip.start_date} to ${trip.end_date}` : "To Be Decided"}
                </div>
                <Button onClick={() => router.push("/dashboard/trips")}>Back to My Trips</Button>
            </div>
            <div className="border rounded p-4 mb-6">
                <h2 className="text-xl font-semibold mb-2">Members</h2>
                <div className="text-gray-500">(Member list and invite functionality coming soon)</div>
            </div>
            <div className="border rounded p-4">
                <h2 className="text-xl font-semibold mb-2">Trip Features</h2>
                <div className="text-gray-500">(Shopping lists, expenses, and more coming soon)</div>
            </div>
        </div>
    );
} 