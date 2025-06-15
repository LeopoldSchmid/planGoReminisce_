"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getTripById, getTripMembers, TripMemberWithProfile, generateTripInvitationLink, deleteTrip } from "@/services/tripService";
import { getExpensesForTrip } from "@/services/expenseService";
import { toast } from "sonner";
import { InviteMemberForm } from "@/components/trips/InviteMemberForm";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { UserPlus, LinkIcon, Trash2 } from 'lucide-react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ShoppingListsSection } from "@/components/shopping/ShoppingListsSection";
import { AggregatedShoppingView } from "@/components/shopping/AggregatedShoppingView";
import { ExpensesSection } from "@/components/expenses/ExpensesSection";
import { RetroactiveExpenseManager } from "@/components/expenses/RetroactiveExpenseManager";
import { RecipesSection } from "@/components/recipes/RecipesSection";

function TripDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const tripId = params?.tripId as string;
  const { user } = useAuth();
  const [isInviteLinkDialogOpen, setIsInviteLinkDialogOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: tripData, isLoading: isLoadingTrip, error: tripError } = useQuery({
    queryKey: ["tripDetails", tripId, user?.id],
    queryFn: () => {
      if (!tripId || !user?.id) throw new Error("Trip ID or User ID is missing");
      return getTripById(tripId, user.id);
    },
    enabled: !!tripId && !!user?.id,
  });

  const { data: membersData, isLoading: isLoadingMembers, error: membersError } = useQuery({
    queryKey: ["tripMembers", tripId, user?.id],
    queryFn: () => {
      if (!tripId || !user?.id) throw new Error("Trip ID or User ID is missing for members query");
      return getTripMembers(tripId, user.id);
    },
    enabled: !!tripId && !!user?.id,
  });

  const { data: expensesData } = useQuery({
    queryKey: ["expenses", tripId],
    queryFn: () => getExpensesForTrip(tripId),
    enabled: !!tripId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!tripId || !user?.id) throw new Error("Trip ID or User ID is missing");
      return deleteTrip(tripId, user.id);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to delete trip.");
      } else {
        toast.success("Trip deleted successfully!");
        // Invalidate trips list and redirect
        queryClient.invalidateQueries({ queryKey: ["userTrips"] });
        router.push("/trips");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred.");
    },
  });

  if (isLoadingTrip || isLoadingMembers) {
    return <LoadingSpinner message="Loading trip details..." />;
  }

  if (tripError || !tripData?.trip) {
    return <div className="container mx-auto p-4 text-red-500">Error loading trip: {tripError?.message || tripData?.error?.message || "Trip not found or access denied."}</div>;
  }
  
  if (membersError || !membersData) {
    return <div className="container mx-auto p-4 text-red-500">Error loading members: {membersError?.message || membersData?.error?.message || "Could not load members."}</div>;
  }

  const trip = tripData.trip;
  const members = membersData.members || [];

  const currentUserMemberInfo = members.find(member => member.user_id === user?.id);
  const canInvite = currentUserMemberInfo?.role === 'owner' || currentUserMemberInfo?.role === 'co-owner';
  const canDelete = currentUserMemberInfo?.role === 'owner' || currentUserMemberInfo?.role === 'co-owner';

  const handleGenerateInviteLink = async () => {
    if (!trip) return;
    setIsGeneratingLink(true);
    try {
      const result = await generateTripInvitationLink(trip.id);
      if (result.error || !result.invitationLink) {
        toast.error(result.error?.message || "Failed to generate invite link.");
        setGeneratedLink("");
      } else {
        setGeneratedLink(result.invitationLink);
        setIsInviteLinkDialogOpen(true);
        toast.success("Invite link generated!");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred.");
      setGeneratedLink("");
    }
    setIsGeneratingLink(false);
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
        .then(() => toast.success("Link copied to clipboard!"))
        .catch(() => toast.error("Failed to copy link."));
    }
  };

  const handleDeleteTrip = () => {
    deleteMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{trip.name}</h1>
          <p className="text-gray-600 mb-2">{trip.description || "No description provided."}</p>
          <p className="text-sm text-gray-500 mb-3">
            Dates: {trip.start_date && trip.end_date ? `${new Date(trip.start_date).toLocaleDateString()} to ${new Date(trip.end_date).toLocaleDateString()}` : "To Be Decided"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          {canDelete && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto min-h-[44px]">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Trip
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Trip</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this trip? This action cannot be undone and will remove all trip data including members, shopping lists, and expenses.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteTrip}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete Trip"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={() => router.push("/trips")} variant="outline" className="w-full sm:w-auto min-h-[44px]">Back to My Trips</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>Users participating in this trip.</CardDescription>
          </div>
          {canInvite && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="min-h-[44px]">
                    <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Invite New Member</DialogTitle>
                  <DialogDescription>
                    Enter the email address of the user you want to invite to this trip.
                  </DialogDescription>
                </DialogHeader>
                <InviteMemberForm tripId={trip.id} />
              </DialogContent>
            </Dialog>

              <Button 
                onClick={handleGenerateInviteLink} 
                variant="outline" 
                className="min-h-[44px]"
                disabled={isGeneratingLink}
              >
                <LinkIcon className="mr-2 h-4 w-4" /> 
                {isGeneratingLink ? "Generating..." : "Create Invite Link"}
              </Button>

              {/* Dialog to display the generated invite link */}
              <Dialog open={isInviteLinkDialogOpen} onOpenChange={setIsInviteLinkDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Share this Invite Link</DialogTitle>
                  <DialogDescription>
                    Anyone with this link can join your trip. The link is valid for 7 days.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 mt-4">
                  <Input value={generatedLink} readOnly className="flex-1" />
                  <Button onClick={handleCopyLink} variant="secondary">
                    Copy
                  </Button>
                </div>
                 <Button onClick={() => setIsInviteLinkDialogOpen(false)} variant="outline" className="mt-4 w-full">
                    Close
                  </Button>
              </DialogContent>
              </Dialog>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="space-y-4">
              <ul className="space-y-3">
                {members.map((member: TripMemberWithProfile) => (
                  <li key={member.user_id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.avatar_url || undefined} alt={member.username || 'User Avatar'} />
                        <AvatarFallback>{member.username ? member.username.substring(0, 2).toUpperCase() : 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.username || 'Unnamed User'}</p>
                        <p className="text-xs text-gray-500">Role: {member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canInvite && expensesData?.expenses && expensesData.expenses.length > 0 && (
                        <RetroactiveExpenseManager
                          expenses={expensesData.expenses}
                          tripMembers={members.map(m => ({
                            user_id: m.user_id,
                            username: m.username,
                            full_name: m.full_name,
                          }))}
                          newMember={{
                            user_id: member.user_id,
                            username: member.username,
                            full_name: member.full_name,
                          }}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">No members yet. Invite someone to join!</p>
          )}
        </CardContent>
      </Card>

      <RecipesSection 
        tripId={trip.id}
        tripMembers={members.map(member => ({
          user_id: member.user_id,
          username: member.username,
          full_name: member.full_name,
        }))}
        currentUserRole={currentUserMemberInfo?.role}
      />

      <ShoppingListsSection 
        tripId={trip.id}
        tripMembers={members.map(member => ({
          user_id: member.user_id,
          username: member.username,
          full_name: member.full_name,
          avatar_url: member.avatar_url,
          role: member.role
        }))}
        currentUserRole={currentUserMemberInfo?.role}
      />

      <AggregatedShoppingView 
        tripId={trip.id}
        tripMembers={members.map(member => ({
          user_id: member.user_id,
          username: member.username,
          full_name: member.full_name,
        }))}
      />

      <ExpensesSection 
        tripId={trip.id}
        tripMembers={members.map(member => ({
          user_id: member.user_id,
          username: member.username,
          full_name: member.full_name,
          role: member.role
        }))}
        currentUserRole={currentUserMemberInfo?.role}
      />
    </div>
  );
}

export default function TripDetailPage() {
  return (
    <DashboardLayout>
      <TripDetailPageContent />
    </DashboardLayout>
  );
}