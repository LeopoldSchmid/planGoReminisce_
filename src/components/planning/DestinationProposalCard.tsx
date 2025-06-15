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
  MapPin,
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Minus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Calendar,
  Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedDestinationProposal, VoteType } from '@/services/planningService';

interface DestinationProposalCardProps {
  proposal: EnhancedDestinationProposal;
  currentUserId: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canFinalize?: boolean;
  onVote?: (proposalId: string, voteType: VoteType) => Promise<void>;
  onEdit?: (proposal: EnhancedDestinationProposal) => void;
  onDelete?: (proposalId: string) => Promise<void>;
  onFinalize?: (proposalId: string) => Promise<void>;
  onDiscussion?: (proposalId: string) => void;
  className?: string;
}

export function DestinationProposalCard({
  proposal,
  currentUserId,
  canEdit = false,
  canDelete = false,
  canFinalize = false,
  onVote,
  onEdit,
  onDelete,
  onFinalize,
  onDiscussion,
  className
}: DestinationProposalCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  
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
    
    const confirmed = window.confirm('Are you sure you want to delete this destination proposal? This action cannot be undone.');
    if (confirmed) {
      await onDelete(proposal.id);
    }
  };

  const handleFinalize = async () => {
    if (!onFinalize) return;
    
    const confirmed = window.confirm('Are you sure you want to finalize this destination proposal? This will mark it as the chosen destination for the trip.');
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
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {proposal.destination_name}
              </CardTitle>
              {proposal.is_finalized && (
                <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200">
                  Finalized
                </Badge>
              )}
              {proposal.linked_date_proposal && (
                <Badge variant="outline" className="text-xs">
                  <Link2 className="h-3 w-3 mr-1" />
                  Linked to dates
                </Badge>
              )}
            </div>
            
            {proposal.destination_description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {proposal.destination_description}
              </p>
            )}
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
                    <MapPin className="h-4 w-4 mr-2" />
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
        {proposal.destination_notes && (
          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded">
            {proposal.destination_notes}
          </div>
        )}

        {/* Linked date proposal */}
        {proposal.linked_date_proposal && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Linked Date Proposal
            </h4>
            <div className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
              <div className="font-medium text-blue-900 dark:text-blue-100">
                {proposal.linked_date_proposal.title}
              </div>
              <div className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                {formatDateRange(proposal.linked_date_proposal.start_date, proposal.linked_date_proposal.end_date)}
              </div>
              {proposal.linked_date_proposal.notes && (
                <div className="text-blue-600 dark:text-blue-400 text-xs mt-2">
                  {proposal.linked_date_proposal.notes}
                </div>
              )}
            </div>
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