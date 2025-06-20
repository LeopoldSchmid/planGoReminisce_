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
import { UserPlus, LinkIcon, Trash2, Settings } from 'lucide-react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ShoppingListsSection } from "@/components/shopping/ShoppingListsSection";
import { AggregatedShoppingView } from "@/components/shopping/AggregatedShoppingView";
import { ExpensesSection } from "@/components/expenses/ExpensesSection";
import { RetroactiveExpenseManager } from "@/components/expenses/RetroactiveExpenseManager";
import { RecipesSection } from "@/components/recipes/RecipesSection";
import { TripPlanningSection } from "@/components/planning/TripPlanningSection";

// New mobile-first components
import { TripPhaseNavigation } from "@/components/navigation/TripPhaseNavigation";
import { PlanPhase } from "@/components/phases/PlanPhase";
import { GoPhase } from "@/components/phases/GoPhase";
import { ReminiscePhase } from "@/components/phases/ReminiscePhase";

function TripDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const tripId = params?.tripId as string;
  const { user } = useAuth();
  const [isInviteLinkDialogOpen, setIsInviteLinkDialogOpen] = useState(false);
  const [activePhase, setActivePhase] = useState<'plan' | 'go' | 'reminisce'>('plan');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
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

  // Set default phase based on trip status when trip data loads
  React.useEffect(() => {
    if (tripData?.trip && activePhase === "plan") {
      const getTripStatus = (trip: { start_date?: string; end_date?: string }) => {
        if (!trip?.start_date || !trip?.end_date) return "planning";
        
        const now = new Date();
        const startDate = new Date(trip.start_date);
        const endDate = new Date(trip.end_date);
        
        if (now >= startDate && now <= endDate) return "active";
        if (now > endDate) return "complete";
        return "planning";
      };
      
      const tripStatus = getTripStatus(tripData.trip);
      const defaultPhase = tripStatus === "active" ? "go" : tripStatus === "complete" ? "reminisce" : "plan";
      setActivePhase(defaultPhase);
    }
  }, [tripData, activePhase]);

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

  // Calculate trip status for display
  const getTripStatus = (trip: { start_date?: string; end_date?: string }) => {
    if (!trip?.start_date || !trip?.end_date) return "planning";
    
    const now = new Date();
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    
    if (now >= startDate && now <= endDate) return "active";
    if (now > endDate) return "complete";
    return "planning";
  };
  
  const tripStatus = getTripStatus(trip);


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

  const handleSectionNavigation = (section: string) => {
    setActiveSection(section);
  };

  const handlePhaseChange = (phase: 'plan' | 'go' | 'reminisce') => {
    setActivePhase(phase);
    setActiveSection(null); // Reset section when changing phases
  };

  const renderPhaseContent = () => {
    // If a specific section is active, render it
    if (activeSection) {
      switch (activeSection) {
        case 'planning':
          return (
            <TripPlanningSection
              tripId={trip.id}
              currentUserId={user?.id || ''}
              currentUserRole={currentUserMemberInfo?.role}
              tripName={trip.name}
            />
          );
        case 'recipes':
          return (
            <RecipesSection 
              tripId={trip.id}
              tripMembers={members.map(member => ({
                user_id: member.user_id,
                username: member.username,
                full_name: member.full_name,
              }))}
              currentUserRole={currentUserMemberInfo?.role}
            />
          );
        case 'shopping':
          return (
            <>
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
            </>
          );
        case 'expenses':
          return (
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
          );
        default:
          return null;
      }
    }

    // Render phase landing pages
    switch (activePhase) {
      case 'plan':
        return (
          <PlanPhase
            tripId={trip.id}
            tripName={trip.name}
            tripMembers={members.map(member => ({
              user_id: member.user_id,
              username: member.username,
              full_name: member.full_name,
              avatar_url: member.avatar_url,
            }))}
            onNavigateToSection={handleSectionNavigation}
          />
        );
      case 'go':
        return (
          <GoPhase
            tripId={trip.id}
            tripName={trip.name}
            tripMembers={members.map(member => ({
              user_id: member.user_id,
              username: member.username,
              full_name: member.full_name,
              avatar_url: member.avatar_url,
            }))}
            onNavigateToSection={handleSectionNavigation}
          />
        );
      case 'reminisce':
        return (
          <ReminiscePhase
            tripId={trip.id}
            tripName={trip.name}
            tripMembers={members.map(member => ({
              user_id: member.user_id,
              username: member.username,
              full_name: member.full_name,
              avatar_url: member.avatar_url,
            }))}
            onNavigateToSection={handleSectionNavigation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Floating Settings Button - only show when not in section */}
      {!activeSection && (
        <div className="fixed top-20 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMemberManagement(true)}
            className="p-2 bg-white shadow-lg border border-gray-200 hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="pb-16">
        {activeSection && activeSection !== 'planning' && (
          <div className="bg-white border-b border-gray-100 px-4 py-2 sticky top-0 z-40">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveSection(null)}
              className="text-orange-600 h-8 px-0"
            >
              ← Back to {activePhase === 'plan' ? 'Planning' : activePhase === 'go' ? 'Live Trip' : 'Memories'}
            </Button>
          </div>
        )}
        {renderPhaseContent()}
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <TripPhaseNavigation
          activePhase={activePhase}
          onPhaseChange={handlePhaseChange}
          tripStatus={tripStatus}
        />
      </div>

      {/* Member Management Modal */}
      <Dialog open={showMemberManagement} onOpenChange={setShowMemberManagement}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trip Members</DialogTitle>
            <DialogDescription>
              Manage who's part of this trip adventure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Invite Section */}
            {canInvite && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <UserPlus className="mr-2 h-4 w-4" /> Invite by Email
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
                    className="flex-1"
                    disabled={isGeneratingLink}
                  >
                    <LinkIcon className="mr-2 h-4 w-4" /> 
                    {isGeneratingLink ? "Creating..." : "Share Link"}
                  </Button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900">Current Members</h4>
              {members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member: TripMemberWithProfile) => (
                    <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.avatar_url || undefined} alt={member.username || 'User Avatar'} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white text-xs">
                            {member.username ? member.username.substring(0, 2).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.username || 'Unnamed User'}</p>
                          <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                        </div>
                      </div>
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
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No members yet. Invite someone to join!</p>
              )}
            </div>
            
            {/* Trip Management */}
            {canDelete && (
              <div className="pt-4 border-t">
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Trip
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Trip</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this trip? This action cannot be undone and will remove all data including expenses, planning, and memories.
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
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Link Dialog */}
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
  );
}

export default function TripDetailPage() {
  return (
    <DashboardLayout>
      <TripDetailPageContent />
    </DashboardLayout>
  );
}