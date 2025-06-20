"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageCircle,
  Send,
  Reply,
  MoreHorizontal,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProposalDiscussion } from '@/services/planningService';

interface CommentItemProps {
  comment: ProposalDiscussion;
  currentUserId: string;
  onReply?: (parentId: string, text: string) => Promise<void>;
  onEdit?: (commentId: string, text: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  depth?: number;
  isReplying?: boolean;
  onToggleReply?: () => void;
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
  isReplying = false,
  onToggleReply
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment_text);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthor = comment.user_id === currentUserId;
  const maxDepth = 3; // Maximum nesting level

  const formatTimeAgo = (dateString: string) => {
    try {
      // Parse the date string, handling potential ISO 8601 formats and timestamps
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'recently';
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      // For older dates, return a formatted date string
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'recently';
    }
  };

  const handleEdit = async () => {
    if (!onEdit || !editText.trim()) return;

    setIsSubmitting(true);
    try {
      await onEdit(comment.id, editText);
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!onReply || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyText);
      setReplyText('');
      onToggleReply?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm('Are you sure you want to delete this comment?');
    if (confirmed) {
      await onDelete(comment.id);
    }
  };

  return (
    <div className={cn('space-y-3', depth > 0 && 'ml-6 border-l border-gray-200 pl-4 dark:border-gray-700')}>
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user_profile?.avatar_url} />
          <AvatarFallback className="text-xs">
            {comment.user_profile?.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {comment.user_profile?.full_name || comment.user_profile?.username || 'Unknown User'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimeAgo(comment.created_at)}
              </span>
              {comment.is_edited && (
                <Badge variant="outline" className="text-xs">
                  edited
                </Badge>
              )}
            </div>

            {(isAuthor || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor && onEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {(isAuthor || onDelete) && (
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 dark:text-red-400">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] text-sm"
                placeholder="Edit your comment..."
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={isSubmitting || !editText.trim()}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.comment_text);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {comment.comment_text}
            </div>
          )}

          {!isEditing && depth < maxDepth && onReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleReply}
              className="h-6 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
      </div>

      {/* Reply form */}
      {isReplying && onReply && (
        <div className="ml-11 space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="min-h-[60px] text-sm"
            placeholder="Write a reply..."
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleReply}
              disabled={isSubmitting || !replyText.trim()}
              className="flex items-center gap-1"
            >
              <Send className="h-3 w-3" />
              {isSubmitting ? 'Posting...' : 'Reply'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleReply}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProposalDiscussionProps {
  discussions: ProposalDiscussion[];
  currentUserId: string;
  title?: string;
  onAddComment?: (text: string) => Promise<void>;
  onReply?: (parentId: string, text: string) => Promise<void>;
  onEdit?: (commentId: string, text: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export function ProposalDiscussion({
  discussions,
  currentUserId,
  title = "Discussion",
  onAddComment,
  onReply,
  onEdit,
  onDelete,
  placeholder = "Share your thoughts...",
  className
}: ProposalDiscussionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleAddComment = async () => {
    if (!onAddComment || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, text: string) => {
    if (onReply) {
      await onReply(parentId, text);
      setReplyingTo(null);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          {title}
          {discussions.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {discussions.length} {discussions.length === 1 ? 'comment' : 'comments'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add new comment */}
        {onAddComment && (
          <div className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
              placeholder={placeholder}
            />
            <Button
              onClick={handleAddComment}
              disabled={isSubmitting || !newComment.trim()}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        )}

        {/* Comments list */}
        {discussions.length > 0 ? (
          <div className="space-y-6">
            {showAll ? (
              discussions.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onReply={handleReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isReplying={replyingTo === comment.id}
                  onToggleReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                />
              ))
            ) : (
              discussions.slice(-2).map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onReply={handleReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isReplying={replyingTo === comment.id}
                  onToggleReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                />
              ))
            )}
            {discussions.length > 2 && !showAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(true)}
                className="w-full justify-center text-xs text-gray-500 dark:text-gray-400"
              >
                Show more
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}