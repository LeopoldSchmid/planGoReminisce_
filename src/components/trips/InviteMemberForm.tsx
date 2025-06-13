"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteMemberByEmail } from "@/services/tripService";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// import { toast } from "sonner"; // Example for toast notifications

const inviteMemberSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

interface InviteMemberFormProps {
  tripId: string;
}

export function InviteMemberForm({ tripId }: InviteMemberFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: InviteMemberFormValues) => {
      if (!user?.id) {
        throw new Error("User not authenticated.");
      }
      return inviteMemberByEmail(tripId, user.id, data.email);
    },
    onSuccess: (result) => {
      if (result.error) {
        console.error("Invitation failed:", result.error.message);
        // toast.error(`Invitation Failed: ${result.error.message}`);
        form.setError("email", { type: "manual", message: result.error.message });
      } else {
        console.log("Invitation successful for email:", form.getValues("email"));
        // toast.success(`Invitation sent to ${form.getValues("email")}.`);
        form.reset();
        // Invalidate queries to refresh member list or trip details if they include members
        queryClient.invalidateQueries({ queryKey: ["tripDetails", tripId, user?.id] }); 
        // If you have a separate query for members:
        // queryClient.invalidateQueries({ queryKey: ["tripMembers", tripId] });
      }
    },
    onError: (error: Error) => {
      console.error("Invitation mutation error:", error.message);
      // toast.error(`An Error Occurred: ${error.message}`);
      form.setError("email", { type: "manual", message: error.message || "An unexpected error occurred." });
    },
  });

  const onSubmit = (values: InviteMemberFormValues) => {
    mutation.mutate(values);
  };

  if (!user) {
    return <p>You must be logged in to invite members.</p>;
  }

  // TODO: Add role check here - only show form if current user is owner/co-owner of the trip.
  // This requires fetching the current user's role for this specific trip.

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-3">Invite New Member</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User's Email</FormLabel>
                <FormControl>
                  <Input placeholder="friend@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Sending Invitation..." : "Send Invitation"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
