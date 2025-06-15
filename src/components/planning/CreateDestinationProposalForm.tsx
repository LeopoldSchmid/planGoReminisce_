"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Plus } from 'lucide-react';
import { EnhancedDateProposal } from '@/services/planningService';

const destinationProposalSchema = z.object({
  destination_name: z.string().min(1, 'Destination name is required').max(100, 'Name must be less than 100 characters'),
  destination_description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  destination_notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  date_proposal_id: z.string().optional(),
});

type DestinationProposalFormData = z.infer<typeof destinationProposalSchema>;

interface CreateDestinationProposalFormProps {
  tripId: string;
  onSubmit: (data: DestinationProposalFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<DestinationProposalFormData>;
  mode?: 'create' | 'edit';
  availableDateProposals?: EnhancedDateProposal[];
}

export function CreateDestinationProposalForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData,
  mode = 'create',
  availableDateProposals = []
}: CreateDestinationProposalFormProps) {
  
  const form = useForm<DestinationProposalFormData>({
    resolver: zodResolver(destinationProposalSchema),
    defaultValues: {
      destination_name: initialData?.destination_name || '',
      destination_description: initialData?.destination_description || '',
      destination_notes: initialData?.destination_notes || '',
      date_proposal_id: initialData?.date_proposal_id || '',
    },
  });

  const handleSubmit = async (data: DestinationProposalFormData) => {
    try {
      // Convert empty strings to undefined for optional fields
      const cleanedData = {
        ...data,
        destination_description: data.destination_description || undefined,
        destination_notes: data.destination_notes || undefined,
        date_proposal_id: data.date_proposal_id || undefined,
      };
      
      await onSubmit(cleanedData);
      if (mode === 'create') {
        form.reset();
      }
    } catch (error) {
      console.error('Error submitting destination proposal:', error);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startStr = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    
    const endStr = end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    
    if (startDate === endDate) {
      return startStr;
    }
    
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold">
          {mode === 'create' ? 'Propose Destination' : 'Edit Destination Proposal'}
        </h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="destination_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Paris, France or Lake Tahoe"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The name of the place you'd like to visit
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="destination_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Romantic city break or Mountain cabin retreat"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A brief description of what this destination offers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {availableDateProposals.length > 0 && (
            <FormField
              control={form.control}
              name="date_proposal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to Date Proposal (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a date proposal to link with" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No date proposal</SelectItem>
                      {availableDateProposals.map((dateProposal) => (
                        <SelectItem key={dateProposal.id} value={dateProposal.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{dateProposal.title}</span>
                            <span className="text-xs text-gray-500">
                              {formatDateRange(dateProposal.start_date, dateProposal.end_date)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Link this destination to specific dates if they go together
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="destination_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional details about this destination..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Share context, requirements, or reasons for choosing this destination
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {mode === 'create' ? (
                <>
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? 'Creating...' : 'Create Proposal'}
                </>
              ) : (
                <>
                  {isSubmitting ? 'Updating...' : 'Update Proposal'}
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}