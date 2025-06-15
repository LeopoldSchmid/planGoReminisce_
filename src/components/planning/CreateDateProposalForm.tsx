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
import { Calendar, Plus } from 'lucide-react';

const dateProposalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
}).refine((data) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return endDate >= startDate;
}, {
  message: "End date must be on or after start date",
  path: ["end_date"],
});

type DateProposalFormData = z.infer<typeof dateProposalSchema>;

interface CreateDateProposalFormProps {
  tripId: string;
  onSubmit: (data: DateProposalFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<DateProposalFormData>;
  mode?: 'create' | 'edit';
}

export function CreateDateProposalForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData,
  mode = 'create'
}: CreateDateProposalFormProps) {
  
  const form = useForm<DateProposalFormData>({
    resolver: zodResolver(dateProposalSchema),
    defaultValues: {
      title: initialData?.title || '',
      start_date: initialData?.start_date || '',
      end_date: initialData?.end_date || '',
      notes: initialData?.notes || '',
    },
  });

  const handleSubmit = async (data: DateProposalFormData) => {
    try {
      await onSubmit(data);
      if (mode === 'create') {
        form.reset();
      }
    } catch (error) {
      console.error('Error submitting date proposal:', error);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleStartDateChange = (startDate: string) => {
    const endDate = form.getValues('end_date');
    
    // If end date is before start date, update it to match start date
    if (endDate && new Date(endDate) < new Date(startDate)) {
      form.setValue('end_date', startDate);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold">
          {mode === 'create' ? 'Propose Date Range' : 'Edit Date Proposal'}
        </h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Summer weekend getaway"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Give your date proposal a descriptive title
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={getTodayDate()}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleStartDateChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={form.watch('start_date') || getTodayDate()}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional details about these dates..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Share any context or requirements for these dates
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