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
  createDestinationProposal,
  castVote,
  getDiscussions,
  createComment,
  VoteType
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
  const [isCreateDestinationDialogOpen, setIsCreateDestinationDialogOpen] = useState(false);
  const [selectedDiscussionProposal, setSelectedDiscussionProposal] = useState<{
    type: 'date' | 'destination';
    id: string;
    title: string;
  } | null>(null);
  const [useEnhancedView, setUseEnhancedView] = useState(true); // Toggle for new UX

  const canCreateProposals = currentUserRole !== undefined; // Any trip member can create proposals
  const canFinalize = currentUserRole === 'owner' || currentUserRole === 'co-owner';

  // Date range for queries (next 3 months)
  const dateRange = getNextNDays(90);

  // ===== QUERIES =====

  // User's availability
  const { data: userAvailability } = useQuery({
    queryKey: ['userAvailability', currentUserId, dateRange],
    queryFn: () => getUserAvailability(currentUserId, dateRange),
    enabled: !!currentUserId,
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

  // Discussion for selected proposal
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
      return setUserAvailability(currentUserId, dateArray);
    },
    onSuccess: () => {
      toast.success('Availability updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['userAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['tripAvailabilityHeatmap'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update availability');
    },
  });

  // Create date proposal
  const createDateProposalMutation = useMutation({
    mutationFn: (data: { title: string; start_date: string; end_date: string; notes?: string }) => 
      createDateProposal(tripId, currentUserId, data),
    onSuccess: () => {
      toast.success('Date proposal created successfully!');
      queryClient.invalidateQueries({ queryKey: ['dateProposals'] });
      setIsCreateDateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create date proposal');
    },
  });

  // Create destination proposal
  const createDestinationProposalMutation = useMutation({
    mutationFn: (data: { 
      destination_name: string; 
      destination_description?: string; 
      destination_notes?: string;
      date_proposal_id?: string;
    }) => createDestinationProposal(tripId, currentUserId, data),
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
    
    return dateProposalsData.proposals.map(proposal => ({
      id: proposal.id,
      name: proposal.title,
      startDate: proposal.start_date,
      endDate: proposal.end_date,
      comment: proposal.notes,
      createdBy: proposal.created_by,
      createdByName: proposal.creator_name || 'Unknown',
      votes: {
        available: proposal.vote_counts?.yes || 0,
        canWork: proposal.vote_counts?.maybe || 0,
        total: (proposal.vote_counts?.yes || 0) + (proposal.vote_counts?.maybe || 0) + (proposal.vote_counts?.no || 0)
      },
      discussions: discussionData?.discussions?.map(discussion => ({
        id: discussion.id,
        user: discussion.user_id,
        userName: discussion.username || 'Anonymous',
        message: discussion.comment_text,
        timestamp: new Date(discussion.created_at).toLocaleString()
      })) || []
    }));
  };

  const handleCreateDateRange = async (range: { name: string; startDate: string; endDate: string; comment?: string }) => {
    try {
      await createDateProposalMutation.mutateAsync({
        title: range.name,
        start_date: range.startDate,
        end_date: range.endDate,
        notes: range.comment
      });
    } catch (error) {
      console.error('Failed to create date range:', error);
    }
  };

  const handleDiscussionUpdate = async (rangeId: string, message: string) => {
    try {
      await createCommentMutation.mutateAsync({
        text: message,
        proposalType: 'date',
        proposalId: rangeId
      });
    } catch (error) {
      console.error('Failed to add discussion:', error);
    }
  };

  // Initialize user availability in calendar
  React.useEffect(() => {
    if (userAvailability?.availability) {
      const availabilityMap = new Map<string, AvailabilityStatus>();
      userAvailability.availability.forEach(item => {
        availabilityMap.set(item.date, item.availability_status);
      });
      setSelectedDates(availabilityMap);
    }
  }, [userAvailability]);

  return (
    <div className={className}>
      {useEnhancedView ? (
        // New Enhanced Mobile-First UX
        <EnhancedAvailabilityView
          tripName={tripName}
          selectedDates={selectedDates}
          onDatesChange={setSelectedDates}
          dateRanges={transformToDateRanges()}
          onCreateDateRange={handleCreateDateRange}
          onDiscussionUpdate={handleDiscussionUpdate}
          currentUserId={currentUserId}
          currentUserName="Current User" // TODO: Get from user profile
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
                {/* Personal Availability Calendar */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">My Availability</h3>
                    <Button
                      onClick={handleSaveAvailability}
                      disabled={saveAvailabilityMutation.isPending || selectedDates.size === 0}
                    >
                      {saveAvailabilityMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                  <AvailabilityCalendar
                    selectedDates={selectedDates}
                    onDatesChange={setSelectedDates}
                    enableRangeSelection={true}
                  />
                </div>

                {/* Team Availability Heatmap */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Team Availability</h3>
                  {heatmapData?.heatmap ? (
                    <AvailabilityHeatmap
                      data={heatmapData.heatmap}
                      title=""
                      showDetails={true}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Loading team availability...
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Date Proposals Tab */}
            <TabsContent value="dates" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Date Proposals</h3>
                {canCreateProposals && (
                  <Dialog open={isCreateDateDialogOpen} onOpenChange={setIsCreateDateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Propose Dates
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Date Proposal</DialogTitle>
                      </DialogHeader>
                      <CreateDateProposalForm
                        tripId={tripId}
                        onSubmit={createDateProposalMutation.mutate}
                        isSubmitting={createDateProposalMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="space-y-4">
                {isLoadingDateProposals ? (
                  <div className="text-center py-8">Loading date proposals...</div>
                ) : dateProposalsData?.proposals && dateProposalsData.proposals.length > 0 ? (
                  dateProposalsData.proposals.map((proposal) => (
                    <DateProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      currentUserId={currentUserId}
                      canEdit={true}
                      canDelete={true}
                      canFinalize={canFinalize}
                      availabilityData={heatmapData?.heatmap || []}
                      onVote={(proposalId, voteType) => handleVote(proposalId, 'date', voteType)}
                      onDiscussion={(proposalId) => handleDiscussion('date', proposalId, proposal.title)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No date proposals yet. Be the first to suggest some dates!
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Destinations Tab */}
            <TabsContent value="destinations" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Destination Proposals</h3>
                {canCreateProposals && (
                  <Dialog open={isCreateDestinationDialogOpen} onOpenChange={setIsCreateDestinationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Propose Destination
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Destination Proposal</DialogTitle>
                      </DialogHeader>
                      <CreateDestinationProposalForm
                        tripId={tripId}
                        onSubmit={createDestinationProposalMutation.mutate}
                        isSubmitting={createDestinationProposalMutation.isPending}
                        availableDateProposals={dateProposalsData?.proposals || []}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="space-y-4">
                {isLoadingDestinationProposals ? (
                  <div className="text-center py-8">Loading destination proposals...</div>
                ) : destinationProposalsData?.proposals && destinationProposalsData.proposals.length > 0 ? (
                  destinationProposalsData.proposals.map((proposal) => (
                    <DestinationProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      currentUserId={currentUserId}
                      canEdit={true}
                      canDelete={true}
                      canFinalize={canFinalize}
                      onVote={(proposalId, voteType) => handleVote(proposalId, 'destination', voteType)}
                      onDiscussion={(proposalId) => handleDiscussion('destination', proposalId, proposal.destination_name)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No destination proposals yet. Be the first to suggest a destination!
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold">{dateProposalsData?.proposals?.length || 0}</div>
                        <div className="text-sm text-gray-600">Date Proposals</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-semibold">{destinationProposalsData?.proposals?.length || 0}</div>
                        <div className="text-sm text-gray-600">Destination Proposals</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-semibold">
                          {heatmapData?.heatmap?.[0]?.total_members || 0}
                        </div>
                        <div className="text-sm text-gray-600">Team Members</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick access to finalized items */}
              <div className="space-y-4">
                <h4 className="font-semibold">Finalized Decisions</h4>
                
                {/* Finalized dates */}
                {dateProposalsData?.proposals?.filter(p => p.is_finalized).map(proposal => (
                  <div key={proposal.id} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 dark:bg-green-950 dark:border-green-800">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Dates: {proposal.title}</span>
                    <Badge className="bg-green-100 text-green-800">Finalized</Badge>
                  </div>
                ))}

                {/* Finalized destinations */}
                {destinationProposalsData?.proposals?.filter(p => p.is_finalized).map(proposal => (
                  <div key={proposal.id} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 dark:bg-green-950 dark:border-green-800">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Destination: {proposal.destination_name}</span>
                    <Badge className="bg-green-100 text-green-800">Finalized</Badge>
                  </div>
                ))}

                {(!dateProposalsData?.proposals?.some(p => p.is_finalized) && 
                  !destinationProposalsData?.proposals?.some(p => p.is_finalized)) && (
                  <div className="text-center py-4 text-gray-500">
                    No finalized decisions yet. Keep discussing and voting!
                  </div>
                )}
              </div>
            </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Discussion Dialog */}
          {selectedDiscussionProposal && (
            <Dialog 
              open={!!selectedDiscussionProposal} 
              onOpenChange={() => setSelectedDiscussionProposal(null)}
            >
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Discussion: {selectedDiscussionProposal.title}
                  </DialogTitle>
                </DialogHeader>
                
                <ProposalDiscussion
                  discussions={discussionData?.discussions || []}
                  currentUserId={currentUserId}
                  onAddComment={handleCreateComment}
                  placeholder={`Share your thoughts about this ${selectedDiscussionProposal.type} proposal...`}
                  className="border-0 shadow-none"
                />
              </DialogContent>
            </Dialog>
          )}
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