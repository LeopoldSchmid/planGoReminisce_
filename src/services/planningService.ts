import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const supabase = createSupabaseBrowserClient();

export type VoteType = 'upvote' | 'downvote' | 'neutral';

export interface DateProposal {
  id: string;
  trip_id: string;
  proposed_by: string;
  title: string;
  start_date: string;
  end_date: string;
  notes?: string;
  is_finalized: boolean;
  created_at: string;
  updated_at: string;
}

export interface DestinationProposal {
  id: string;
  trip_id: string;
  date_proposal_id?: string;
  proposed_by: string;
  destination_name: string;
  destination_description?: string;
  destination_notes?: string;
  is_finalized: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProposalDiscussion {
  id: string;
  trip_id: string;
  date_proposal_id?: string;
  destination_proposal_id?: string;
  parent_comment_id?: string;
  user_id: string;
  comment_text: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  // Joined user data
  user_profile?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  // Nested replies
  replies?: ProposalDiscussion[];
}

export interface ProposalVote {
  id: string;
  trip_id: string;
  date_proposal_id?: string;
  destination_proposal_id?: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
  updated_at: string;
}

export interface ProposalStats {
  upvotes: number;
  downvotes: number;
  neutral_votes: number;
  total_votes: number;
  net_score: number;
}

export interface EnhancedDateProposal extends DateProposal {
  proposed_by_profile?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  vote_stats?: ProposalStats;
  user_vote?: VoteType;
  discussion_count?: number;
  linked_destinations?: DestinationProposal[];
}

export interface EnhancedDestinationProposal extends DestinationProposal {
  proposed_by_profile?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  vote_stats?: ProposalStats;
  user_vote?: VoteType;
  discussion_count?: number;
  linked_date_proposal?: DateProposal;
}

// =====================================================
// DATE PROPOSAL FUNCTIONS
// =====================================================

/**
 * Create a new date proposal
 */
export async function createDateProposal(
  tripId: string,
  proposedBy: string,
  proposal: {
    title: string;
    start_date: string;
    end_date: string;
    notes?: string;
  }
): Promise<{ proposal: DateProposal | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('date_proposals')
      .insert({
        trip_id: tripId,
        proposed_by: proposedBy,
        title: proposal.title,
        start_date: proposal.start_date,
        end_date: proposal.end_date,
        notes: proposal.notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating date proposal:', error);
      return { proposal: null, error };
    }

    return { proposal: data, error: null };
  } catch (err) {
    console.error('Unexpected error in createDateProposal:', err);
    return { proposal: null, error: err };
  }
}

/**
 * Get all date proposals for a trip
 */
export async function getDateProposals(
  tripId: string,
  currentUserId?: string
): Promise<{ proposals: EnhancedDateProposal[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('date_proposals')
      .select(`
        *,
        profiles!date_proposals_proposed_by_fkey (
          username,
          full_name,
          avatar_url
        ),
        destination_proposals (*)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching date proposals:', error);
      return { proposals: null, error };
    }

    // Enhance proposals with stats and user votes
    const enhancedProposals = await Promise.all(
      data.map(async (proposal: any) => {
        const [statsResult, userVoteResult, discussionResult] = await Promise.all([
          getProposalStats(proposal.id, null),
          currentUserId ? getUserVoteForProposal(proposal.id, null, currentUserId) : Promise.resolve({ vote: null, error: null }),
          getDiscussionCount(proposal.id, null)
        ]);

        return {
          ...proposal,
          proposed_by_profile: proposal.profiles,
          vote_stats: statsResult.stats,
          user_vote: userVoteResult.vote?.vote_type,
          discussion_count: discussionResult.count || 0,
          linked_destinations: proposal.destination_proposals || []
        } as EnhancedDateProposal;
      })
    );

    return { proposals: enhancedProposals, error: null };
  } catch (err) {
    console.error('Unexpected error in getDateProposals:', err);
    return { proposals: null, error: err };
  }
}

/**
 * Update a date proposal
 */
export async function updateDateProposal(
  proposalId: string,
  updates: Partial<{
    title: string;
    start_date: string;
    end_date: string;
    notes: string;
    is_finalized: boolean;
  }>
): Promise<{ proposal: DateProposal | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('date_proposals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) {
      console.error('Error updating date proposal:', error);
      return { proposal: null, error };
    }

    return { proposal: data, error: null };
  } catch (err) {
    console.error('Unexpected error in updateDateProposal:', err);
    return { proposal: null, error: err };
  }
}

/**
 * Delete a date proposal
 */
export async function deleteDateProposal(
  proposalId: string
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('date_proposals')
      .delete()
      .eq('id', proposalId);

    if (error) {
      console.error('Error deleting date proposal:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in deleteDateProposal:', err);
    return { success: false, error: err };
  }
}

// =====================================================
// DESTINATION PROPOSAL FUNCTIONS
// =====================================================

/**
 * Create a new destination proposal
 */
export async function createDestinationProposal(
  tripId: string,
  proposedBy: string,
  proposal: {
    destination_name: string;
    destination_description?: string;
    destination_notes?: string;
    date_proposal_id?: string;
  }
): Promise<{ proposal: DestinationProposal | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('destination_proposals')
      .insert({
        trip_id: tripId,
        proposed_by: proposedBy,
        destination_name: proposal.destination_name,
        destination_description: proposal.destination_description,
        destination_notes: proposal.destination_notes,
        date_proposal_id: proposal.date_proposal_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating destination proposal:', error);
      return { proposal: null, error };
    }

    return { proposal: data, error: null };
  } catch (err) {
    console.error('Unexpected error in createDestinationProposal:', err);
    return { proposal: null, error: err };
  }
}

/**
 * Get all destination proposals for a trip
 */
export async function getDestinationProposals(
  tripId: string,
  currentUserId?: string
): Promise<{ proposals: EnhancedDestinationProposal[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('destination_proposals')
      .select(`
        *,
        profiles!destination_proposals_proposed_by_fkey (
          username,
          full_name,
          avatar_url
        ),
        date_proposals (*)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching destination proposals:', error);
      return { proposals: null, error };
    }

    // Enhance proposals with stats and user votes
    const enhancedProposals = await Promise.all(
      data.map(async (proposal: any) => {
        const [statsResult, userVoteResult, discussionResult] = await Promise.all([
          getProposalStats(null, proposal.id),
          currentUserId ? getUserVoteForProposal(null, proposal.id, currentUserId) : Promise.resolve({ vote: null, error: null }),
          getDiscussionCount(null, proposal.id)
        ]);

        return {
          ...proposal,
          proposed_by_profile: proposal.profiles,
          vote_stats: statsResult.stats,
          user_vote: userVoteResult.vote?.vote_type,
          discussion_count: discussionResult.count || 0,
          linked_date_proposal: proposal.date_proposals
        } as EnhancedDestinationProposal;
      })
    );

    return { proposals: enhancedProposals, error: null };
  } catch (err) {
    console.error('Unexpected error in getDestinationProposals:', err);
    return { proposals: null, error: err };
  }
}

/**
 * Update a destination proposal
 */
export async function updateDestinationProposal(
  proposalId: string,
  updates: Partial<{
    destination_name: string;
    destination_description: string;
    destination_notes: string;
    is_finalized: boolean;
  }>
): Promise<{ proposal: DestinationProposal | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('destination_proposals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) {
      console.error('Error updating destination proposal:', error);
      return { proposal: null, error };
    }

    return { proposal: data, error: null };
  } catch (err) {
    console.error('Unexpected error in updateDestinationProposal:', err);
    return { proposal: null, error: err };
  }
}

/**
 * Delete a destination proposal
 */
export async function deleteDestinationProposal(
  proposalId: string
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('destination_proposals')
      .delete()
      .eq('id', proposalId);

    if (error) {
      console.error('Error deleting destination proposal:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in deleteDestinationProposal:', err);
    return { success: false, error: err };
  }
}

// =====================================================
// VOTING FUNCTIONS
// =====================================================

/**
 * Cast or update a vote on a proposal
 */
export async function castVote(
  tripId: string,
  userId: string,
  vote: {
    date_proposal_id?: string;
    destination_proposal_id?: string;
    vote_type: VoteType;
  }
): Promise<{ vote: ProposalVote | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('proposal_votes')
      .upsert({
        trip_id: tripId,
        user_id: userId,
        date_proposal_id: vote.date_proposal_id,
        destination_proposal_id: vote.destination_proposal_id,
        vote_type: vote.vote_type,
        updated_at: new Date().toISOString()
      }, {
        onConflict: vote.date_proposal_id ? 'user_id,date_proposal_id' : 'user_id,destination_proposal_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error casting vote:', error);
      return { vote: null, error };
    }

    return { vote: data, error: null };
  } catch (err) {
    console.error('Unexpected error in castVote:', err);
    return { vote: null, error: err };
  }
}

/**
 * Get user's vote for a specific proposal
 */
export async function getUserVoteForProposal(
  dateProposalId: string | null,
  destinationProposalId: string | null,
  userId: string
): Promise<{ vote: ProposalVote | null; error: any }> {
  try {
    let query = supabase
      .from('proposal_votes')
      .select('*')
      .eq('user_id', userId);

    if (dateProposalId) {
      query = query.eq('date_proposal_id', dateProposalId);
    } else if (destinationProposalId) {
      query = query.eq('destination_proposal_id', destinationProposalId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching user vote:', error);
      return { vote: null, error };
    }

    return { vote: data, error: null };
  } catch (err) {
    console.error('Unexpected error in getUserVoteForProposal:', err);
    return { vote: null, error: err };
  }
}

/**
 * Get proposal statistics using RPC function
 */
export async function getProposalStats(
  dateProposalId: string | null,
  destinationProposalId: string | null
): Promise<{ stats: ProposalStats | null; error: any }> {
  try {
    const { data, error } = await supabase
      .rpc('get_proposal_stats', {
        p_date_proposal_id: dateProposalId,
        p_destination_proposal_id: destinationProposalId
      })
      .single();

    if (error) {
      console.error('Error fetching proposal stats:', error);
      return { stats: null, error };
    }

    return { stats: data, error: null };
  } catch (err) {
    console.error('Unexpected error in getProposalStats:', err);
    return { stats: null, error: err };
  }
}

// =====================================================
// DISCUSSION FUNCTIONS
// =====================================================

/**
 * Create a new comment in a discussion
 */
export async function createComment(
  tripId: string,
  userId: string,
  comment: {
    comment_text: string;
    date_proposal_id?: string;
    destination_proposal_id?: string;
    parent_comment_id?: string;
  }
): Promise<{ comment: ProposalDiscussion | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('proposal_discussions')
      .insert({
        trip_id: tripId,
        user_id: userId,
        comment_text: comment.comment_text,
        date_proposal_id: comment.date_proposal_id,
        destination_proposal_id: comment.destination_proposal_id,
        parent_comment_id: comment.parent_comment_id
      })
      .select(`
        *,
        profiles!proposal_discussions_user_id_fkey (
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return { comment: null, error };
    }

    return { 
      comment: {
        ...data,
        user_profile: data.profiles
      }, 
      error: null 
    };
  } catch (err) {
    console.error('Unexpected error in createComment:', err);
    return { comment: null, error: err };
  }
}

/**
 * Get discussions for a proposal or general trip discussion
 */
export async function getDiscussions(
  tripId: string,
  options?: {
    date_proposal_id?: string;
    destination_proposal_id?: string;
    include_replies?: boolean;
  }
): Promise<{ discussions: ProposalDiscussion[] | null; error: any }> {
  try {
    let query = supabase
      .from('proposal_discussions')
      .select(`
        *,
        profiles!proposal_discussions_user_id_fkey (
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('trip_id', tripId)
      .is('parent_comment_id', null) // Only top-level comments initially
      .order('created_at', { ascending: true });

    // Apply filters based on options
    if (options?.date_proposal_id) {
      query = query.eq('date_proposal_id', options.date_proposal_id);
    } else if (options?.destination_proposal_id) {
      query = query.eq('destination_proposal_id', options.destination_proposal_id);
    } else {
      // General trip discussion (not linked to any proposal)
      query = query.is('date_proposal_id', null).is('destination_proposal_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching discussions:', error);
      return { discussions: null, error };
    }

    let discussions = data.map((d: any) => ({
      ...d,
      user_profile: d.profiles,
      replies: []
    }));

    // Fetch replies if requested
    if (options?.include_replies && discussions.length > 0) {
      const { data: replies, error: repliesError } = await supabase
        .from('proposal_discussions')
        .select(`
          *,
          profiles!proposal_discussions_user_id_fkey (
            username,
            full_name,
            avatar_url
          )
        `)
        .in('parent_comment_id', discussions.map(d => d.id))
        .order('created_at', { ascending: true });

      if (!repliesError && replies) {
        const replyMap = new Map<string, any[]>();
        replies.forEach((reply: any) => {
          const parentId = reply.parent_comment_id;
          if (!replyMap.has(parentId)) {
            replyMap.set(parentId, []);
          }
          replyMap.get(parentId)!.push({
            ...reply,
            user_profile: reply.profiles
          });
        });

        discussions = discussions.map(d => ({
          ...d,
          replies: replyMap.get(d.id) || []
        }));
      }
    }

    return { discussions, error: null };
  } catch (err) {
    console.error('Unexpected error in getDiscussions:', err);
    return { discussions: null, error: err };
  }
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: string,
  commentText: string
): Promise<{ comment: ProposalDiscussion | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('proposal_discussions')
      .update({
        comment_text: commentText,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        *,
        profiles!proposal_discussions_user_id_fkey (
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return { comment: null, error };
    }

    return { 
      comment: {
        ...data,
        user_profile: data.profiles
      }, 
      error: null 
    };
  } catch (err) {
    console.error('Unexpected error in updateComment:', err);
    return { comment: null, error: err };
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('proposal_discussions')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in deleteComment:', err);
    return { success: false, error: err };
  }
}

/**
 * Get discussion count for a proposal
 */
async function getDiscussionCount(
  dateProposalId: string | null,
  destinationProposalId: string | null
): Promise<{ count: number | null; error: any }> {
  try {
    let query = supabase
      .from('proposal_discussions')
      .select('id', { count: 'exact', head: true });

    if (dateProposalId) {
      query = query.eq('date_proposal_id', dateProposalId);
    } else if (destinationProposalId) {
      query = query.eq('destination_proposal_id', destinationProposalId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching discussion count:', error);
      return { count: null, error };
    }

    return { count, error: null };
  } catch (err) {
    console.error('Unexpected error in getDiscussionCount:', err);
    return { count: null, error: err };
  }
}