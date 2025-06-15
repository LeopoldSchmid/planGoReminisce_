"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/services/profileService";
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
import { toast } from "sonner";

const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long.")
    .max(20, "Username must be at most 20 characters long.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  full_name: z.string().max(100, "Full name must be at most 100 characters long.").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function EditProfileForm() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username || "",
      full_name: profile?.full_name || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user?.id) {
        throw new Error("User not authenticated.");
      }
      return updateProfile(user.id, data);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(`Profile update failed: ${result.error.message}`);
      } else {
        toast.success("Profile updated successfully!");
        // Invalidate auth context to refresh user data
        queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      }
    },
    onError: (error: Error) => {
      toast.error(`An error occurred: ${error.message}`);
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    mutation.mutate(values);
    setIsSubmitting(false);
  };

  if (!user) {
    return <p>You must be logged in to edit your profile.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {isSubmitting || mutation.isPending ? "Updating..." : "Update Profile"}
        </Button>
      </form>
    </Form>
  );
}