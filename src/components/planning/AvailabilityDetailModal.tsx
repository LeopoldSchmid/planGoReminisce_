"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AvailabilityStatus } from '@/services/availabilityService';

interface AvailabilityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDates: string[];
  onSave: (status: AvailabilityStatus, notes?: string) => void;
  currentStatus?: AvailabilityStatus;
  currentNotes?: string;
}

export function AvailabilityDetailModal({
  isOpen,
  onClose,
  selectedDates,
  onSave,
  currentStatus,
  currentNotes = ''
}: AvailabilityDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>(currentStatus || 'available');
  const [notes, setNotes] = useState(currentNotes);

  const handleSave = () => {
    onSave(selectedStatus, notes.trim() || undefined);
    onClose();
  };

  const handleClose = () => {
    // Reset to current values when closing without saving
    setSelectedStatus(currentStatus || 'available');
    setNotes(currentNotes);
    onClose();
  };

  const formatDateRange = () => {
    if (selectedDates.length === 0) return '';
    if (selectedDates.length === 1) {
      return new Date(selectedDates[0]).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
    
    const sortedDates = [...selectedDates].sort();
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);
    
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const getStatusColor = (status: AvailabilityStatus) => {
    switch (status) {
      case 'unavailable':
        return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:border-red-700 dark:text-red-200';
      case 'available':
        return 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-200';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
    }
  };

  const statusOptions: Array<{ value: AvailabilityStatus; label: string; description: string }> = [
    {
      value: 'unavailable',
      label: 'Unavailable',
      description: 'I cannot travel on these dates'
    },
    {
      value: 'available',
      label: 'Available',
      description: 'I can travel on these dates, but they\'re not ideal'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Availability Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected dates */}
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Dates
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-sm">
                {formatDateRange()} ({selectedDates.length} {selectedDates.length === 1 ? 'day' : 'days'})
              </Badge>
            </div>
          </div>

          {/* Availability status selection */}
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Availability Status
            </div>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={cn(
                    'w-full p-3 text-left border rounded-lg transition-all',
                    selectedStatus === option.value
                      ? cn(getStatusColor(option.value), 'ring-2 ring-offset-2 ring-blue-500')
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                  )}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
              
              {/* Ideal option */}
              <button
                onClick={() => {
                  // For ideal, we'll clear the availability (remove from selected dates)
                  onSave('available', undefined); // This will actually remove the dates
                  onClose();
                }}
                className={cn(
                  'w-full p-3 text-left border rounded-lg transition-all',
                  'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                )}
              >
                <div className="font-medium">Ideal</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  These dates are perfect for me (removes any restrictions)
                </div>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes (Optional)
            </div>
            <Textarea
              id="availability-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional context about your availability..."
              className="mt-2 min-h-[80px]"
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {notes.length}/200 characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={!selectedStatus}
            >
              Save Availability
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}