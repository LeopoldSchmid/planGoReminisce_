"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  MoreHorizontal,
  Edit2,
  Trash2,
  Check,
  X,
  UserPlus,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedDateProposal } from '@/services/planningService';
import { format } from 'date-fns';

type VoteType = 'available' | 'maybe' | 'unavailable';

interface DateProposalCardProps {
  proposal: EnhancedDateProposal;
  currentUserId: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canFinalize?: boolean;
  onVote?: (proposalId: string, voteType: VoteType) => Promise<void>;
  onEdit?: (proposal: EnhancedDateProposal) => void;
  onDelete?: (proposalId: string) => Promise<void>;
  onFinalize?: (proposalId: string) => Promise<void>;
  onDiscussion?: (proposalId: string) => void;
  onInvite?: (proposalId: string) => void;
  onEraseVote?: (proposalId: string) => void;
  className?: string;
  memberCount: number;
}

export function DateProposalCard({
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
  onInvite,
  onEraseVote,
  className,
  memberCount
}: DateProposalCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const isProposalOwner = proposal.proposed_by === currentUserId;
  const hasNotes = !!proposal.notes?.trim();

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatStr = 'MMM d';
    const startStr = format(start, formatStr);
    const endStr = format(end, formatStr);

    if (startDate === endDate) return startStr;
    return `${startStr} - ${endStr}`;
  };

  const getVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
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
    const confirmed = window.confirm('Are you sure you want to finalize these dates? This will mark them as the chosen dates for the trip.');
    if (confirmed) {
      await onFinalize(proposal.id);
    }
  };

  const toggleDescription = () => {
    setShowDescription(!showDescription);
  };

  // Helper to get vote counts for bar
  const voteStats = proposal.vote_stats || { upvotes: 0, downvotes: 0, neutral_votes: 0, total_votes: 0 };
  // Simulate votes array: available, maybe, unavailable, unvoted (gray)
  // In real app, you would have a list of all members' votes. Here, we use counts.
  const votesArray: (VoteType | 'unvoted')[] = [];
  for (let i = 0; i < voteStats.upvotes; i++) votesArray.push('available');
  for (let i = 0; i < voteStats.neutral_votes; i++) votesArray.push('maybe');
  for (let i = 0; i < voteStats.downvotes; i++) votesArray.push('unavailable');
  while (votesArray.length < memberCount) votesArray.push('unvoted');

  return (
    <Card className={cn(
      'transition-all overflow-hidden border border-gray-200',
      'w-full max-w-full',
      proposal.is_finalized && 'ring-2 ring-green-500 bg-green-50',
      className
    )}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 bg-blue-100 text-blue-700 flex-shrink-0">
              <AvatarFallback>
                {(proposal.proposed_by_profile?.full_name || proposal.proposed_by_profile?.username || 'U')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <CardTitle className="text-lg font-semibold">
                {formatDateRange(proposal.start_date, proposal.end_date)}
              </CardTitle>
              {/* Subtitle: show proposal.title if present, otherwise nothing */}
              {proposal.title && (
                <p className="text-sm text-gray-500">
                  {proposal.title}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onDiscussion && (
                <DropdownMenuItem onClick={() => onDiscussion(proposal.id)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Discussion</span>
                </DropdownMenuItem>
              )}
              {onVote && (
                <DropdownMenuItem onClick={() => handleVote('available')}>
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                  <span>Available</span>
                </DropdownMenuItem>
              )}
              {onVote && (
                <DropdownMenuItem onClick={() => handleVote('maybe')}>
                  <span className="mr-2 h-4 w-4 text-center">~</span>
                  <span>Maybe</span>
                </DropdownMenuItem>
              )}
              {onVote && (
                <DropdownMenuItem onClick={() => handleVote('unavailable')}>
                  <X className="mr-2 h-4 w-4 text-red-600" />
                  <span>Unavailable</span>
                </DropdownMenuItem>
              )}
              {onEraseVote && proposal.user_vote && (
                <DropdownMenuItem onClick={() => onEraseVote(proposal.id)}>
                  <span className="mr-2 h-4 w-4">↩️</span>
                  <span>Remove vote</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onInvite && (
                <DropdownMenuItem onClick={() => onInvite?.(proposal.id)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Invite others</span>
                </DropdownMenuItem>
              )}
              {onFinalize && canFinalize && (
                <DropdownMenuItem onClick={handleFinalize}>
                  <CalendarCheck className="h-4 w-4" />
                  <span>Finalize dates</span>
                </DropdownMenuItem>
              )}
              {canEdit && isProposalOwner && (
                <DropdownMenuItem onClick={() => onEdit?.(proposal)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && isProposalOwner && (
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Description above the bar */}
        {hasNotes && (
          <div className="mt-3">
            <p className="text-sm text-gray-700">
              {proposal.notes}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2.5 px-3 py-2 sm:px-4">
        {/* Horizontal bar for votes/availability, split by memberCount */}
        <div className="mt-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
            {votesArray.map((vote, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-full',
                  'transition-all',
                  vote === 'available' && 'bg-green-500',
                  vote === 'maybe' && 'bg-yellow-400',
                  vote === 'unavailable' && 'bg-red-400',
                  vote === 'unvoted' && 'bg-gray-300'
                )}
                style={{ width: `${100 / memberCount}%` }}
              />
            ))}
          </div>
        </div>
        {/* Status icons below the bar */}
        <div className="flex items-center justify-end mt-2 gap-2">
          {/* Available (green) */}
          <button
            type="button"
            onClick={() => handleVote('available')}
            className={cn(
              "flex items-center justify-center rounded-full transition-all duration-200",
              proposal.user_vote === 'available'
                ? "gap-2 px-3 py-1 bg-green-100 border border-green-200"
                : "w-8 h-8 hover:bg-gray-100"
            )}
            aria-label="Vote Available"
          >
            <div className="w-4 h-4 bg-green-500 rounded-full shrink-0" />
            {proposal.user_vote === 'available' && (
              <span className="text-sm font-medium text-green-700">Available</span>
            )}
          </button>
          {/* Maybe (yellow) */}
          <button
            type="button"
            onClick={() => handleVote('maybe')}
            className={cn(
              "flex items-center justify-center rounded-full transition-all duration-200",
              proposal.user_vote === 'maybe'
                ? "gap-2 px-3 py-1 bg-yellow-100 border border-yellow-200"
                : "w-8 h-8 hover:bg-gray-100"
            )}
            aria-label="Vote Maybe"
          >
            <div className="w-4 h-4 bg-yellow-500 rounded-full shrink-0" />
            {proposal.user_vote === 'maybe' && (
              <span className="text-sm font-medium text-yellow-700">Maybe</span>
            )}
          </button>
          {/* Unavailable (red) */}
          <button
            type="button"
            onClick={() => handleVote('unavailable')}
            className={cn(
              "flex items-center justify-center rounded-full transition-all duration-200",
              proposal.user_vote === 'unavailable'
                ? "gap-2 px-3 py-1 bg-red-100 border border-red-200"
                : "w-8 h-8 hover:bg-gray-100"
            )}
            aria-label="Vote Unavailable"
          >
            <div className="w-4 h-4 bg-red-500 rounded-full shrink-0" />
            {proposal.user_vote === 'unavailable' && (
              <span className="text-sm font-medium text-red-700">Unavailable</span>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}