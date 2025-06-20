"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Plus,
  Users,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

// Components
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { AvailabilityHeatmap } from './AvailabilityHeatmap';
import { DateProposalCard } from './DateProposalCard';
import { DestinationProposalCard } from './DestinationProposalCard';
import { CreateDateProposalForm } from './CreateDateProposalForm';
import { CreateDestinationProposalForm } from './CreateDestinationProposalForm';
import { ProposalDiscussion } from './ProposalDiscussion';
import { EnhancedAvailabilityView } from './EnhancedAvailabilityView';

// Services
import {
  getUserAvailability,
  setUserAvailability,
  getTripAvailabilityHeatmap,
  getNextNDays,
  AvailabilityStatus
} from '@/services/availabilityService';
import {
  getDateProposals,
  getDestinationProposals,
  createDateProposal,
  updateDateProposal,
  createDestinationProposal,
  castVote,
  getDiscussions,
  createComment,
  VoteType,
  deleteVoteForDateProposal,
  deleteDateProposal
} from '@/services/planningService';

interface TripPlanningSectionProps {
  tripId: string;
  currentUserId: string;
  currentUserRole?: string;
  tripName?: string;
  className?: string;
}

interface DateRange {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  comment?: string;
  createdBy: string;
  createdByName: string;
  votes: {
    available: number;
    canWork: number;
    total: number;
  };
  discussions: Array<{
    id: string;
    user: string;
    userName: string;
    message: string;
    timestamp: string;
  }>;
}

export function TripPlanningSection({
  tripId,
  currentUserId,
  currentUserRole,
  tripName = "Trip Planning",
  className
}: TripPlanningSectionProps) {
  const queryClient = useQueryClient();

  // UI State
  const [selectedDates, setSelectedDates] = useState<Map<string, AvailabilityStatus>>(new Map());
  const [isCreateDateDialogOpen, setIsCreateDateDialogOpen] = useState(false);
  const [isEditDateDialogOpen, setIsEditDateDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<{
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    notes?: string;
  } | null>(null);
  const [isCreateDestinationDialogOpen, setIsCreateDestinationDialogOpen] = useState(false);
  const [selectedDiscussionProposal, setSelectedDiscussionProposal] = useState<{
    type: 'date' | 'destination';
    id: string;
    title: string;
  } | null>(null);
  const [useEnhancedView, setUseEnhancedView] = useState(true); // Toggle for new UX

  const canCreateProposals = currentUserRole !== undefined; // Any trip member can create proposals
  const canFinalize = currentUserRole === 'owner' || currentUserRole === 'co-owner';

  // Date range for queries (past month + next 3 months to include test data)
  const dateRange = React.useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30); // Include past 30 days
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 90); // Include next 90 days
    
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };
  }, []);

  // ===== QUERIES =====

  // User's trip-specific availability 
  const { data: userAvailability } = useQuery({
    queryKey: ['userTripAvailability', tripId, currentUserId, dateRange],
    queryFn: () => getUserAvailability(currentUserId, dateRange, tripId), // Pass tripId for trip-specific
    enabled: !!currentUserId && !!tripId,
  });

  // Trip availability heatmap
  const { data: heatmapData } = useQuery({
    queryKey: ['tripAvailabilityHeatmap', tripId, dateRange],
    queryFn: () => getTripAvailabilityHeatmap(tripId, dateRange),
    enabled: !!tripId,
  });

  // Date proposals
  const { data: dateProposalsData, isLoading: isLoadingDateProposals } = useQuery({
    queryKey: ['dateProposals', tripId, currentUserId],
    queryFn: () => getDateProposals(tripId, currentUserId),
    enabled: !!tripId,
  });

  // Destination proposals
  const { data: destinationProposalsData, isLoading: isLoadingDestinationProposals } = useQuery({
    queryKey: ['destinationProposals', tripId, currentUserId],
    queryFn: () => getDestinationProposals(tripId, currentUserId),
    enabled: !!tripId,
  });

  // All discussions for the trip (to map to date ranges)
  const { data: allDiscussionsData } = useQuery({
    queryKey: ['allProposalDiscussions', tripId],
    queryFn: () => {
      // Get discussions for all date proposals
      return getDiscussions(tripId, {
        include_replies: true
      });
    },
    enabled: !!tripId,
  });

  // Discussion for selected proposal (for the dialog)
  const { data: discussionData } = useQuery({
    queryKey: ['proposalDiscussion', tripId, selectedDiscussionProposal?.type, selectedDiscussionProposal?.id],
    queryFn: () => {
      if (!selectedDiscussionProposal) return { discussions: [], error: null };

      return getDiscussions(tripId, {
        [selectedDiscussionProposal.type === 'date' ? 'date_proposal_id' : 'destination_proposal_id']: selectedDiscussionProposal.id,
        include_replies: true
      });
    },
    enabled: !!selectedDiscussionProposal,
  });

  // ===== MUTATIONS =====

  // Save availability
  const saveAvailabilityMutation = useMutation({
    mutationFn: (dates: Map<string, AvailabilityStatus>) => {
      const dateArray = Array.from(dates.entries()).map(([date, status]) => ({
        date,
        availability_status: status
      }));
      return setUserAvailability(currentUserId, dateArray, tripId); // Pass tripId for trip-specific
    },
    onSuccess: () => {
      toast.success('Availability updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['userTripAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['tripAvailabilityHeatmap'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update availability');
    },
  });

  // Create/Update date proposal
  const createDateProposalMutation = useMutation({
    mutationFn: async (data: { 
      id?: string;
      title: string; 
      start_date: string; 
      end_date: string; 
      notes?: string;
    }) => {
      if (data.id) {
        // Update existing proposal
        const result = await updateDateProposal(data.id, {
          title: data.title,
          start_date: data.start_date,
          end_date: data.end_date,
          notes: data.notes || undefined
        });
        return { proposal: result.proposal, isNew: false };
      } else {
        // Create new proposal
        const result = await createDateProposal(tripId, currentUserId, {
          title: data.title,
          start_date: data.start_date,
          end_date: data.end_date,
          notes: data.notes || undefined
        });
        return { proposal: result.proposal, isNew: true };
      }
    },
    onSuccess: (result) => {
      if (result?.isNew) {
        toast.success('Date proposal created successfully!');
      } else {
        toast.success('Date proposal updated successfully!');
      }
      queryClient.invalidateQueries({ queryKey: ['dateProposals'] });
      setIsCreateDateDialogOpen(false);
      setIsEditDateDialogOpen(false);
      setEditingProposal(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save date proposal');
    },
  });

  // Handle edit proposal
  const handleEditProposal = (proposal: any) => {
    setEditingProposal({
      id: proposal.id,
      title: proposal.title,
      start_date: proposal.start_date,
      end_date: proposal.end_date,
      notes: proposal.notes || ''
    });
    setIsEditDateDialogOpen(true);
  };

  // Create destination proposal
  const createDestinationProposalMutation = useMutation({
    mutationFn: async (data: {
      destination_name: string;
      destination_description?: string;
      destination_notes?: string;
      date_proposal_id?: string;
    }) => {
      const result = await createDestinationProposal(tripId, currentUserId, {
        destination_name: data.destination_name,
        destination_description: data.destination_description || undefined,
        destination_notes: data.destination_notes || undefined,
        date_proposal_id: data.date_proposal_id || undefined
      });
      return result;
    },
    onSuccess: () => {
      toast.success('Destination proposal created successfully!');
      queryClient.invalidateQueries({ queryKey: ['destinationProposals'] });
      setIsCreateDestinationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create destination proposal');
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: ({ proposalId, proposalType, voteType }: {
      proposalId: string;
      proposalType: 'date' | 'destination';
      voteType: VoteType;
    }) => {
      return castVote(tripId, currentUserId, {
        [proposalType === 'date' ? 'date_proposal_id' : 'destination_proposal_id']: proposalId,
        vote_type: voteType
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dateProposals'] });
      queryClient.invalidateQueries({ queryKey: ['destinationProposals'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cast vote');
    },
  });

  // Comment mutations
  const createCommentMutation = useMutation({
    mutationFn: ({ text, proposalType, proposalId }: {
      text: string;
      proposalType: 'date' | 'destination';
      proposalId: string;
    }) => {
      return createComment(tripId, currentUserId, {
        comment_text: text,
        [proposalType === 'date' ? 'date_proposal_id' : 'destination_proposal_id']: proposalId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposalDiscussion'] });
      queryClient.invalidateQueries({ queryKey: ['allProposalDiscussions'] });
    },
  });

  // ===== HANDLERS =====

  const handleSaveAvailability = () => {
    if (selectedDates.size === 0) {
      toast.info('No availability changes to save');
      return;
    }
    saveAvailabilityMutation.mutate(selectedDates);
  };

  const handleVote = async (proposalId: string, proposalType: 'date' | 'destination', voteType: VoteType) => {
    voteMutation.mutate({ proposalId, proposalType, voteType });
  };

  const handleDiscussion = (proposalType: 'date' | 'destination', proposalId: string, title: string) => {
    setSelectedDiscussionProposal({ type: proposalType, id: proposalId, title });
  };

  const handleCreateComment = async (text: string) => {
    if (!selectedDiscussionProposal) return;

    createCommentMutation.mutate({
      text,
      proposalType: selectedDiscussionProposal.type,
      proposalId: selectedDiscussionProposal.id
    });
  };

  // Transform date proposals to date ranges format
  const transformToDateRanges = (): DateRange[] => {
    if (!dateProposalsData?.proposals) return [];

    console.log('transformToDateRanges called with:', {
      proposalsCount: dateProposalsData.proposals.length,
      discussionsCount: allDiscussionsData?.discussions?.length || 0
    });

    return dateProposalsData.proposals.map(proposal => {
      // Get discussions for this specific proposal
      const proposalDiscussions = allDiscussionsData?.discussions?.filter(d => 
        d.date_proposal_id === proposal.id
      ) || [];

      console.log(`Proposal ${proposal.id} has ${proposalDiscussions.length} discussions:`, proposalDiscussions);

      return {
        id: proposal.id,
        name: proposal.title,
        startDate: proposal.start_date,
        endDate: proposal.end_date,
        comment: proposal.notes,
        createdBy: proposal.proposed_by,
        createdByName: proposal.proposed_by_profile?.full_name || proposal.proposed_by_profile?.username || 'Unknown',
        votes: {
          available: proposal.vote_stats?.upvotes || 0,
          canWork: proposal.vote_stats?.neutral_votes || 0,
          total: proposal.vote_stats?.total_votes || 0
        },
        discussions: proposalDiscussions.map(discussion => ({
          id: discussion.id,
          user: discussion.user_id,
          userName: discussion.user_profile?.username || discussion.user_profile?.full_name || 'Anonymous',
          message: discussion.comment_text,
          timestamp: new Date(discussion.created_at).toLocaleString()
        }))
      };
    });
  };

  const handleCreateDateRange = async (range: { name: string; startDate: string; endDate: string; comment?: string }) => {
    try {
      console.log('TripPlanningSection: handleCreateDateRange called with:', range);
      console.log('tripId:', tripId);
      console.log('currentUserId:', currentUserId);
      
      const proposalData = {
        title: range.name,
        start_date: range.startDate,
        end_date: range.endDate,
        notes: range.comment
      };
      console.log('Creating date proposal with data:', proposalData);
      
      const result = await createDateProposalMutation.mutateAsync(proposalData);
      console.log('Date proposal creation result:', result);
    } catch (error) {
      console.error('Failed to create date range:', error);
      toast.error('Failed to create date range');
    }
  };

  // Auto-save availability changes when selectedDates changes
  const handleDatesChange = (dates: Map<string, AvailabilityStatus>) => {
    console.log('Dates changed:', dates);
    setSelectedDates(dates);
    
    // Auto-save availability changes
    if (dates.size > 0) {
      const dateArray = Array.from(dates.entries()).map(([date, status]) => ({
        date,
        availability_status: status
      }));
      console.log('Auto-saving availability:', dateArray);
      saveAvailabilityMutation.mutate(new Map(dates));
    }
  };

  const handleDiscussionUpdate = async (rangeId: string, message: string, parentCommentId?: string) => {
    try {
      console.log('Creating discussion comment:', { rangeId, message, parentCommentId, tripId, currentUserId });
      
      const commentData: any = {
        comment_text: message,
        date_proposal_id: rangeId,
      };
      
      if (parentCommentId) {
        commentData.parent_comment_id = parentCommentId;
      }
      
      const result = await createComment(tripId, currentUserId, commentData);
      console.log('Discussion comment created:', result);
      
      // Invalidate discussions query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['allProposalDiscussions'] });
      queryClient.invalidateQueries({ queryKey: ['dateProposals'] });
    } catch (error) {
      console.error('Failed to add discussion:', error);
    }
  };

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['dateProposals'] });
    queryClient.invalidateQueries({ queryKey: ['allProposalDiscussions'] });
    queryClient.invalidateQueries({ queryKey: ['userTripAvailability'] });
    queryClient.invalidateQueries({ queryKey: ['tripAvailabilityHeatmap'] });
  };

  // Initialize user availability in calendar
  React.useEffect(() => {
    if (userAvailability?.availability) {
      console.log('Loading user availability:', userAvailability.availability);
      const availabilityMap = new Map<string, AvailabilityStatus>();
      userAvailability.availability.forEach(item => {
        console.log('Setting availability for date:', item.date, 'status:', item.availability_status);
        availabilityMap.set(item.date, item.availability_status);
      });
      setSelectedDates(availabilityMap);
    } else {
      console.log('No user availability data found, clearing selectedDates');
      setSelectedDates(new Map());
    }
  }, [userAvailability]);

  return (
    <div className={className}>
      {useEnhancedView ? (
        // New Enhanced Mobile-First UX
        <EnhancedAvailabilityView
          tripId={tripId}
          tripName={tripName}
          selectedDates={selectedDates}
          onDatesChange={handleDatesChange}
          dateRanges={transformToDateRanges()}
          onCreateDateRange={handleCreateDateRange}
          onDiscussionUpdate={handleDiscussionUpdate}
          onDeleteDateRange={async (rangeId) => {
            const confirmed = window.confirm('Are you sure you want to delete this date range? This action cannot be undone.');
            if (!confirmed) return;
            const { success, error } = await deleteDateProposal(rangeId);
            if (success) {
              toast.success('Date range deleted');
              queryClient.invalidateQueries({ queryKey: ['dateProposals'] });
            } else {
              toast.error(error?.message || 'Failed to delete date range');
            }
          }}
          onRefreshData={handleRefreshData}
          currentUserId={currentUserId}
          currentUserName="Current User"
        />
      ) : (
        // Original Desktop View
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Trip Planning & Availability
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseEnhancedView(true)}
                >
                  Switch to Mobile View
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="availability" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="availability">
                    <Users className="h-4 w-4 mr-2" />

                    Availability
                  </TabsTrigger>
                  <TabsTrigger value="dates">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date Proposals
                  </TabsTrigger>
                  <TabsTrigger value="destinations">
                    <MapPin className="h-4 w-4 mr-2" />
                    Destinations
                  </TabsTrigger>
                  <TabsTrigger value="overview">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                </TabsList>

                {/* Availability Tab */}
                <TabsContent value="availability" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">My Availability</h3>
                        <Button onClick={handleSaveAvailability}>
                          Save Availability
                        </Button>
                      </div>
                      <AvailabilityCalendar
                        selectedDates={selectedDates}
                        onDatesChange={handleDatesChange}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Switch View Button for Enhanced View */}
      {useEnhancedView && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseEnhancedView(false)}
          >
            Switch to Desktop View
          </Button>
        </div>
      )}
    </div>
  );
}