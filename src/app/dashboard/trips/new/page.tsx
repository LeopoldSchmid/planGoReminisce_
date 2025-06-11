"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createTrip } from "@/services/tripService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
    name: z.string().min(2, "Trip name is required"),
    description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewTripPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", description: "" },
    });

    async function onSubmit(data: FormData) {
        if (!user) return;
        setLoading(true);
        setError(null);
        const { trip, error } = await createTrip({
            name: data.name,
            description: data.description,
            user_id: user.id,
        });
        setLoading(false);
        if (error) {
            setError(error.message || "Failed to create trip");
            return;
        }
        router.push("/dashboard/trips");
    }

    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create a New Trip</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Trip Name</label>
                            <input
                                type="text"
                                {...form.register("name")}
                                className="w-full border rounded px-3 py-2"
                                disabled={loading}
                            />
                            {form.formState.errors.name && (
                                <div className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description (optional)</label>
                            <textarea
                                {...form.register("description")}
                                className="w-full border rounded px-3 py-2"
                                rows={3}
                                disabled={loading}
                            />
                        </div>
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating..." : "Create Trip"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 