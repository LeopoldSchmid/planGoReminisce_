"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Calendar,
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Minus,
  MoreHorizontal,
  Edit2,
  Trash2,
  MapPin,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedDateProposal, VoteType } from '@/services/planningService';
import { AvailabilityHeatmap } from './AvailabilityHeatmap';
import { AvailabilityHeatmapData } from '@/services/availabilityService';

interface DateProposalCardProps {
  proposal: EnhancedDateProposal;
  currentUserId: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canFinalize?: boolean;
  availabilityData?: AvailabilityHeatmapData[];
  onVote?: (proposalId: string, voteType: VoteType) => Promise<void>;
  onEdit?: (proposal: EnhancedDateProposal) => void;
  onDelete?: (proposalId: string) => Promise<void>;
  onFinalize?: (proposalId: string) => Promise<void>;
  onDiscussion?: (proposalId: string) => void;
  className?: string;
}

export function DateProposalCard({
  proposal,
  currentUserId,
  canEdit = false,
  canDelete = false,
  canFinalize = false,
  availabilityData = [],
  onVote,
  onEdit,
  onDelete,
  onFinalize,
  onDiscussion,
  className
}: DateProposalCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  const isProposalOwner = proposal.proposed_by === currentUserId;
  
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startStr = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    
    const endStr = end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: end.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    
    if (startDate === endDate) {
      return startStr;
    }
    
    return `${startStr} - ${endStr}`;
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  const handleVote = async (voteType: VoteType) => {
    if (!onVote || isVoting) return;
    
    setIsVoting(true);
    try {
      await onVote(proposal.id, voteType);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this date proposal? This action cannot be undone.');
    if (confirmed) {
      await onDelete(proposal.id);
    }
  };

  const handleFinalize = async () => {
    if (!onFinalize) return;
    
    const confirmed = window.confirm('Are you sure you want to finalize this date proposal? This will mark it as the chosen dates for the trip.');
    if (confirmed) {
      await onFinalize(proposal.id);
    }
  };

  const getVoteButtonStyle = (voteType: VoteType) => {
    const isActive = proposal.user_vote === voteType;
    const baseClasses = "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors";
    
    switch (voteType) {
      case 'upvote':
        return cn(
          baseClasses,
          isActive 
            ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
            : "hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900 dark:hover:text-green-200"
        );
      case 'downvote':
        return cn(
          baseClasses,
          isActive 
            ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
            : "hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900 dark:hover:text-red-200"
        );
      case 'neutral':
        return cn(
          baseClasses,
          isActive 
            ? "bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            : "hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        );
    }
  };

  const relevantHeatmapData = availabilityData.filter(d => {
    const date = new Date(d.date);
    const start = new Date(proposal.start_date);
    const end = new Date(proposal.end_date);
    return date >= start && date <= end;
  });

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      proposal.is_finalized && 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{proposal.title}</CardTitle>
              {proposal.is_finalized && (
                <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200">
                  Finalized
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDateRange(proposal.start_date, proposal.end_date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{getDuration(proposal.start_date, proposal.end_date)}</span>
              </div>
            </div>
          </div>

          {(canEdit || canDelete || canFinalize) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && isProposalOwner && (
                  <DropdownMenuItem onClick={() => onEdit?.(proposal)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canFinalize && !proposal.is_finalized && (
                  <DropdownMenuItem onClick={handleFinalize}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Finalize
                  </DropdownMenuItem>
                )}
                {canDelete && isProposalOwner && (
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600 dark:text-red-400">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Proposed by */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={proposal.proposed_by_profile?.avatar_url} />
            <AvatarFallback className="text-xs">
              {proposal.proposed_by_profile?.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Proposed by {proposal.proposed_by_profile?.full_name || proposal.proposed_by_profile?.username || 'Unknown User'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Notes */}
        {proposal.notes && (
          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded">
            {proposal.notes}
          </div>
        )}

        {/* Linked destinations */}
        {proposal.linked_destinations && proposal.linked_destinations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Linked Destinations
            </h4>
            <div className="space-y-1">
              {proposal.linked_destinations.map((dest) => (
                <div key={dest.id} className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
                  <div className="font-medium text-blue-900 dark:text-blue-100">{dest.destination_name}</div>
                  {dest.destination_description && (
                    <div className="text-blue-700 dark:text-blue-300 text-xs mt-1">{dest.destination_description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Availability heatmap */}
        {relevantHeatmapData.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Team Availability
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                {showHeatmap ? 'Hide' : 'Show'} Details
              </Button>
            </div>
            
            {showHeatmap && (
              <AvailabilityHeatmap
                data={relevantHeatmapData}
                title=""
                showDetails={true}
                className="border-0 shadow-none"
              />
            )}
            
            {!showHeatmap && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex gap-1">
                  {relevantHeatmapData.slice(0, 7).map((item) => (
                    <div
                      key={item.date}
                      className={cn(
                        'w-4 h-4 rounded-sm border',
                        item.availability_percentage >= 80 
                          ? 'bg-green-400 border-green-500'
                          : item.availability_percentage >= 60
                          ? 'bg-yellow-400 border-yellow-500'
                          : item.availability_percentage >= 40
                          ? 'bg-orange-400 border-orange-500'
                          : 'bg-red-400 border-red-500'
                      )}
                      title={`${new Date(item.date).toLocaleDateString()}: ${item.availability_percentage}% available`}
                    />
                  ))}
                  {relevantHeatmapData.length > 7 && (
                    <span className="text-xs text-gray-500 ml-1">
                      +{relevantHeatmapData.length - 7} more days
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {/* Voting buttons */}
            {onVote && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleVote('upvote')}
                  disabled={isVoting}
                  className={getVoteButtonStyle('upvote')}
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span>{proposal.vote_stats?.upvotes || 0}</span>
                </button>
                
                <button
                  onClick={() => handleVote('neutral')}
                  disabled={isVoting}
                  className={getVoteButtonStyle('neutral')}
                >
                  <Minus className="h-3 w-3" />
                  <span>{proposal.vote_stats?.neutral_votes || 0}</span>
                </button>
                
                <button
                  onClick={() => handleVote('downvote')}
                  disabled={isVoting}
                  className={getVoteButtonStyle('downvote')}
                >
                  <ThumbsDown className="h-3 w-3" />
                  <span>{proposal.vote_stats?.downvotes || 0}</span>
                </button>
              </div>
            )}

            {/* Discussion button */}
            {onDiscussion && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDiscussion(proposal.id)}
                className="flex items-center gap-1 text-xs"
              >
                <MessageCircle className="h-3 w-3" />
                <span>{proposal.discussion_count || 0}</span>
              </Button>
            )}
          </div>

          {/* Vote score */}
          {proposal.vote_stats && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Net: {proposal.vote_stats.net_score > 0 ? '+' : ''}{proposal.vote_stats.net_score}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}