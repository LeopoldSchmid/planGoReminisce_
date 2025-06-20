"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Plus, MessageSquare, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvailabilityStatus } from '@/services/availabilityService';

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

interface CalendarDate {
  date: string;
  day: number;
  month: number;
  year: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  availability?: AvailabilityStatus;
  isSelected: boolean;
  isInRange?: boolean;
}

interface EnhancedAvailabilityViewProps {
  tripName: string;
  selectedDates: Map<string, AvailabilityStatus>;
  onDatesChange: (dates: Map<string, AvailabilityStatus>) => void;
  dateRanges: DateRange[];
  onCreateDateRange: (range: { name: string; startDate: string; endDate: string; comment?: string }) => void;
  onDiscussionUpdate: (rangeId: string, message: string) => void;
  currentUserId: string;
  currentUserName: string;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];

export function EnhancedAvailabilityView({
  tripName,
  selectedDates,
  onDatesChange,
  dateRanges,
  onCreateDateRange,
  onDiscussionUpdate,
  currentUserId,
  currentUserName,
  className
}: EnhancedAvailabilityViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'availability' | 'summary'>('availability');
  
  // Availability painting state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedAvailabilityType, setSelectedAvailabilityType] = useState<AvailabilityStatus>('available');
  
  // Modal states
  const [isAddRangeModalOpen, setIsAddRangeModalOpen] = useState(false);
  const [rangeName, setRangeName] = useState('');
  const [rangeComment, setRangeComment] = useState('');
  
  // Discussion state
  const [selectedDiscussionRange, _setSelectedDiscussionRange] = useState<DateRange | null>(null);
  const [discussionMessage, setDiscussionMessage] = useState('');

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const isDateInSelectedRange = useCallback((date: Date): boolean => {
    if (!selectedRange) return false;
    return date >= selectedRange.start && date <= selectedRange.end;
  }, [selectedRange]);

  // Generate calendar dates
  const generateCalendarDates = useCallback((): CalendarDate[] => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates: CalendarDate[] = [];

    // Add previous month's trailing dates
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDayOfMonth);
      date.setDate(date.getDate() - (i + 1));
      const dateStr = date.toISOString().split('T')[0];
      
      dates.push({
        date: dateStr,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: false,
        availability: selectedDates.get(dateStr),
        isSelected: selectedDates.has(dateStr),
        isInRange: isDateInSelectedRange(date)
      });
    }

    // Add current month's dates
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      
      dates.push({
        date: dateStr,
        day,
        month: currentMonth,
        year: currentYear,
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: true,
        availability: selectedDates.get(dateStr),
        isSelected: selectedDates.has(dateStr),
        isInRange: isDateInSelectedRange(date)
      });
    }

    // Add next month's leading dates
    const remainingDays = 42 - dates.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      const dateStr = date.toISOString().split('T')[0];
      
      dates.push({
        date: dateStr,
        day,
        month: currentMonth + 1,
        year: currentYear,
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: false,
        availability: selectedDates.get(dateStr),
        isSelected: selectedDates.has(dateStr),
        isInRange: isDateInSelectedRange(date)
      });
    }

    return dates;
  }, [currentMonth, currentYear, selectedDates, isDateInSelectedRange]);

  const calendarDates = generateCalendarDates();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const handleDateClick = (calendarDate: CalendarDate) => {
    if (!calendarDate.isCurrentMonth) return; // Only allow clicking current month dates
    
    const dateStr = calendarDate.date;
    const newDates = new Map(selectedDates);
    
    // Set the availability for this date to the selected type
    newDates.set(dateStr, selectedAvailabilityType);
    onDatesChange(newDates);
  };

  const handleMouseEnter = (calendarDate: CalendarDate) => {
    if (!isDragging || !dragStartDate || !calendarDate.isCurrentMonth) return;

    const startDate = new Date(dragStartDate);
    const endDate = new Date(calendarDate.date);
    
    const [from, to] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    setSelectedRange({ start: from, end: to });
  };

  const handleMouseDown = (calendarDate: CalendarDate) => {
    if (!calendarDate.isCurrentMonth) return;
    
    setIsDragging(true);
    setDragStartDate(calendarDate.date);
    handleDateClick(calendarDate);
  };

  const handleMouseUp = () => {
    if (isDragging && selectedRange) {
      // Apply selected availability type to all dates in range
      const newDates = new Map(selectedDates);
      let currentDate = new Date(selectedRange.start);
      const endDate = new Date(selectedRange.end);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        newDates.set(dateStr, selectedAvailabilityType);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      onDatesChange(newDates);
    }
    
    setIsDragging(false);
    setDragStartDate(null);
    setSelectedRange(null);
  };


  const handleSaveRange = () => {
    if (!selectedRange || !rangeName.trim()) return;

    onCreateDateRange({
      name: rangeName,
      startDate: selectedRange.start.toISOString().split('T')[0],
      endDate: selectedRange.end.toISOString().split('T')[0],
      comment: rangeComment.trim() || undefined
    });

    // Reset state
    setSelectedRange(null);
    setRangeName('');
    setRangeComment('');
    setIsAddRangeModalOpen(false);
  };

  const handleCancelRange = () => {
    setSelectedRange(null);
    setRangeName('');
    setRangeComment('');
    setIsAddRangeModalOpen(false);
  };

  const handleDiscussionSubmit = () => {
    if (!selectedDiscussionRange || !discussionMessage.trim()) return;
    
    onDiscussionUpdate(selectedDiscussionRange.id, discussionMessage.trim());
    setDiscussionMessage('');
  };

  const getDateStyle = (calendarDate: CalendarDate) => {
    const { availability, isCurrentMonth, isToday, isInRange } = calendarDate;
    const baseClasses = [
      'w-10 h-10 flex items-center justify-center text-sm rounded-lg cursor-pointer border touch-manipulation relative',
      'transition-all duration-300 ease-spring transform-gpu',
      'hover:scale-105 active:scale-95',
      'hover:shadow-md active:shadow-sm',
      'hover:z-10 relative'
    ];

    if (!isCurrentMonth) {
      baseClasses.push('text-muted-foreground/50');
    }

    if (isToday) {
      baseClasses.push('ring-2 ring-orange-500 ring-offset-1 animate-pulse');
    }

    // Range selection highlight with morphing effect
    if (isInRange) {
      baseClasses.push('bg-orange-100 border-orange-300 shadow-lg animate-in slide-in-from-top-1 duration-200');
    }

    // Availability styling with morphing effects
    if (availability === 'unavailable') {
      baseClasses.push('bg-red-500 text-white border-red-500 shadow-red-200 shadow-lg');
    } else if (availability === 'available') {
      baseClasses.push('bg-green-500 text-white border-green-500 shadow-green-200 shadow-lg');
    } else {
      baseClasses.push('hover:bg-muted border-border hover:border-orange-300');
    }

    return cn(baseClasses);
  };

  const handleMouseUpCallback = useCallback(() => {
    if (selectedRange && selectedRange.start.getTime() !== selectedRange.end.getTime()) {
      // Multi-day range selected, open modal
      const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${day}.${month}.${year}`;
      };
      
      setRangeName(`${formatDate(selectedRange.start)}-${formatDate(selectedRange.end)}`);
      setIsAddRangeModalOpen(true);
    }
    
    setIsDragging(false);
    setDragStartDate(null);
  }, [selectedRange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUpCallback);
      return () => document.removeEventListener('mouseup', handleMouseUpCallback);
    }
  }, [isDragging, handleMouseUpCallback]);

  return (
    <div className={cn('max-w-md mx-auto', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
            P
          </div>
          <h1 className="text-xl font-semibold">{tripName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            3
          </div>
          <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-gray-300"></div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'availability' | 'summary')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="availability" className="rounded-l-full">Select Availability</TabsTrigger>
          <TabsTrigger value="summary" className="rounded-r-full">Summary</TabsTrigger>
        </TabsList>

        {/* Select Availability Tab */}
        <TabsContent value="availability" className="space-y-4">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Availability Type Selector */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => setSelectedAvailabilityType('available')}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                selectedAvailabilityType === 'available' 
                  ? "bg-green-100 border border-green-300 shadow-sm" 
                  : "hover:bg-gray-50"
              )}
            >
              <div className="w-4 h-4 bg-green-500 rounded-full transition-all duration-200"></div>
              {selectedAvailabilityType === 'available' && (
                <span className="text-sm font-medium text-green-700">Available</span>
              )}
            </button>
            <button
              onClick={() => setSelectedAvailabilityType('maybe')}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                selectedAvailabilityType === 'maybe' 
                  ? "bg-orange-100 border border-orange-300 shadow-sm" 
                  : "hover:bg-gray-50"
              )}
            >
              <div className="w-4 h-4 bg-orange-500 rounded-full transition-all duration-200"></div>
              {selectedAvailabilityType === 'maybe' && (
                <span className="text-sm font-medium text-orange-700">Can work</span>
              )}
            </button>
            <button
              onClick={() => setSelectedAvailabilityType('unavailable')}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                selectedAvailabilityType === 'unavailable' 
                  ? "bg-red-100 border border-red-300 shadow-sm" 
                  : "hover:bg-gray-50"
              )}
            >
              <div className="w-4 h-4 bg-red-500 rounded-full transition-all duration-200"></div>
              {selectedAvailabilityType === 'unavailable' && (
                <span className="text-sm font-medium text-red-700">Unavailable</span>
              )}
            </button>
          </div>

          {/* Calendar Grid */}
          <Card>
            <CardContent className="p-4">
              {/* Days header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar dates */}
              <div className="grid grid-cols-7 gap-1" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                {calendarDates.map((calendarDate, index) => (
                  <div
                    key={index}
                    className={getDateStyle(calendarDate)}
                    onMouseDown={() => handleMouseDown(calendarDate)}
                    onMouseEnter={() => handleMouseEnter(calendarDate)}
                    onClick={() => handleDateClick(calendarDate)}
                  >
                    {calendarDate.day}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {dateRanges.map(range => (
            <Card key={range.id} className="relative transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    SC
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{range.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{range.votes.total} votes</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      by {range.createdByName}
                    </div>
                    
                    {/* Vote Bar */}
                    <div className="flex rounded-full overflow-hidden h-2 mb-3">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${(range.votes.available / range.votes.total) * 100}%` }}
                      />
                      <div 
                        className="bg-orange-500" 
                        style={{ width: `${(range.votes.canWork / range.votes.total) * 100}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{range.votes.available} available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>{range.votes.canWork} can work</span>
                      </div>
                    </div>

                    {/* Discussion Section */}
                    {selectedDiscussionRange?.id === range.id && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MessageSquare className="h-4 w-4" />
                          Discussion
                        </div>
                        
                        {range.discussions.map(discussion => (
                          <div key={discussion.id} className="flex gap-3">
                            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                              {discussion.userName.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{discussion.userName}</div>
                              <div className="text-sm text-muted-foreground">{discussion.message}</div>
                              <div className="text-xs text-muted-foreground mt-1">{discussion.timestamp}</div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={discussionMessage}
                            onChange={(e) => setDiscussionMessage(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            size="sm" 
                            onClick={handleDiscussionSubmit}
                            disabled={!discussionMessage.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 bg-orange-500 hover:bg-orange-600 shadow-lg transform transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-xl hover:shadow-orange-200"
          onClick={() => setIsAddRangeModalOpen(true)}
        >
          <Plus className="h-6 w-6 transition-transform duration-200 hover:rotate-90" />
        </Button>
      </div>

      {/* Add Date Range Modal */}
      <Dialog open={isAddRangeModalOpen} onOpenChange={setIsAddRangeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Date Range</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={handleCancelRange}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Range Name</label>
              <Input
                value={rangeName}
                onChange={(e) => setRangeName(e.target.value)}
                placeholder="e.g., 23.06.25-26.06.25"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Comment (optional)</label>
              <Textarea
                value={rangeComment}
                onChange={(e) => setRangeComment(e.target.value)}
                placeholder="Add any notes about your availability..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSaveRange} className="flex-1 bg-orange-500 hover:bg-orange-600">
                Save Range
              </Button>
              <Button onClick={handleCancelRange} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}