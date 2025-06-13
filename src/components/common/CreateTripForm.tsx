"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createTrip } from "@/services/tripService"; 
import { useAuth } from "@/context/AuthContext"; 
import { useRouter } from "next/navigation";

const createTripFormSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(100, "Trip name must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
});

type CreateTripFormValues = z.infer<typeof createTripFormSchema>;

export function CreateTripForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<CreateTripFormValues>({
    resolver: zodResolver(createTripFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: CreateTripFormValues) => {
    if (!user) {
      setError("You must be logged in to create a trip.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await createTrip({
        ...values,
        user_id: user.id,
      });

      if (result.error) {
        console.error("Failed to create trip:", result.error);
        setError(result.error.message || "An unexpected error occurred.");
      } else {
        console.log("Trip created successfully:", result.trip);
        router.push("/trips"); 
      }
    } catch (e: any) {
      console.error("An unexpected error occurred during trip creation:", e);
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create a New Trip</CardTitle>
        <CardDescription>Plan your next adventure. Dates can be added later.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Summer Vacation in Italy" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly describe your trip"
                      className="resize-none"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Trip..." : "Create Trip"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
