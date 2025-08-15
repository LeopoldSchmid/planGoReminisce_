"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { DateProposalCard } from './DateProposalCard';
import { EnhancedDateProposal } from '@/services/planningService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, EyeOff, CheckCircle, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvailabilityStatus, getTripAvailabilityHeatmap, AvailabilityHeatmapData } from '@/services/availabilityService';
import { ProposalDiscussion } from './ProposalDiscussion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getTripMembers } from '@/services/tripService';
import { castVote } from '@/services/planningService';

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
  tripId: string;
  tripName: string;
  selectedDates: Map<string, AvailabilityStatus>;
  onDatesChange: (dates: Map<string, AvailabilityStatus>) => void;
  dateRanges: DateRange[];
  onCreateDateRange: (range: { name: string; startDate: string; endDate: string; comment?: string }) => void;
  onDiscussionUpdate: (rangeId: string, message: string, parentCommentId?: string) => void;
  onDeleteDateRange: (rangeId: string) => void;
  onRefreshData?: () => void;
  currentUserId: string;
  currentUserName: string;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];

const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export function EnhancedAvailabilityView({
  tripId,
  tripName,
  selectedDates,
  onDatesChange,
  dateRanges,
  onCreateDateRange,
  onDiscussionUpdate,
  onDeleteDateRange,
  onRefreshData,
  currentUserId,
  currentUserName,
  className
}: EnhancedAvailabilityViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDiscussionRange, setSelectedDiscussionRange] = useState<DateRange | null>(null);
  const [activeTab, setActiveTab] = useState<'availability' | 'summary'>('availability');
  const [availabilityView, setAvailabilityView] = useState<'personal' | 'group'>('personal');

  // Availability painting state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [pendingStartDate, setPendingStartDate] = useState<Date | null>(null); // first tap on mobile
  const [selectedAvailabilityType, setSelectedAvailabilityType] = useState<AvailabilityStatus>('available');

  // Modal states
  const [isAddRangeModalOpen, setIsAddRangeModalOpen] = useState(false);
  const [rangeName, setRangeName] = useState('');
  const [rangeComment, setRangeComment] = useState('');
  const [pendingRangeData, setPendingRangeData] = useState<{ start: Date; end: Date } | null>(null);

  // Discussion state
  const [discussionMessage, setDiscussionMessage] = useState('');

  // New state for expanded card
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // New state for FAB menu
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [activeFabCardId, setActiveFabCardId] = useState<string | null>(null);

  // Add state for discussion sheet
  const [showDiscussionSheet, setShowDiscussionSheet] = useState(false);

  // Add state for start and end date
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  // Add state for proposal title
  const [proposalTitle, setProposalTitle] = useState('');

  // Add state for which calendar sheet is open
  const [calendarSheet, setCalendarSheet] = useState<'start' | 'end' | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Date range for heatmap data (current month)
  const heatmapDateRange = React.useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    return {
      start_date: firstDayOfMonth.toISOString().split('T')[0],
      end_date: lastDayOfMonth.toISOString().split('T')[0]
    };
  }, [currentYear, currentMonth]);

  // Group availability heatmap data
  const { data: heatmapData } = useQuery({
    queryKey: ['tripAvailabilityHeatmap', tripId, heatmapDateRange],
    queryFn: () => getTripAvailabilityHeatmap(tripId, heatmapDateRange),
    enabled: !!tripId && availabilityView === 'group',
  });

  // Fetch trip members
  const { data: membersData } = useQuery({
    queryKey: ['tripMembers', tripId, currentUserId],
    queryFn: () => getTripMembers(tripId, currentUserId),
    enabled: !!tripId && !!currentUserId,
  });
  const memberCount = membersData?.members?.length || 0;

  // Refresh data when switching to availability tab (only once per tab switch)
  useEffect(() => {
    if (activeTab === 'availability' && onRefreshData) {
      console.log('Refreshing data for availability tab');
      onRefreshData();
    }
  }, [activeTab]); // Remove onRefreshData from dependencies to prevent multiple calls

  const isDateInSelectedRange = useCallback((date: Date): boolean => {
    if (!selectedRange) return false;
    return date >= selectedRange.start && date <= selectedRange.end;
  }, [selectedRange]);

  // Helper to convert Date to YYYY-MM-DD in local time
  function toYMD(date: Date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }

  // Helper to get group availability data for a specific date
  const getGroupAvailabilityForDate = (dateStr: string): AvailabilityHeatmapData | null => {
    if (!heatmapData?.heatmap) return null;
    return heatmapData.heatmap.find(h => h.date === dateStr) || null;
  };

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
      const dateStr = toYMD(date);

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
      const dateStr = toYMD(date);

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
      const dateStr = toYMD(date);

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

  // Helper to format dd.mm.yy string
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  };

  const openRangeModal = (start: Date, end: Date) => {
    console.log('Opening range modal with dates:', start, end);
    setSelectedRange({ start, end });
    setPendingRangeData({ start, end }); // Store persistently
    setRangeName(`${formatDate(start)}-${formatDate(end)}`);
    setIsAddRangeModalOpen(true);
  };

  const handleDateClick = (calendarDate: CalendarDate) => {
    if (!calendarDate.isCurrentMonth || availabilityView !== 'personal') return; // Only allow clicking in personal view

    const clicked = new Date(calendarDate.date);

    // Mobile tap flow: first tap selects start, second tap selects end
    if (!pendingStartDate) {
      setPendingStartDate(clicked);
      return;
    }

    // Second tap
    const start = pendingStartDate <= clicked ? pendingStartDate : clicked;
    const end = pendingStartDate <= clicked ? clicked : pendingStartDate;

    // If same day, directly paint availability and reset
    if (start.getTime() === end.getTime()) {
      const dateStr = toYMD(clicked);
      console.log('Single day click - painting date:', dateStr, 'with type:', selectedAvailabilityType);
      const newDates = new Map(selectedDates);
      newDates.set(dateStr, selectedAvailabilityType);
      onDatesChange(newDates);
      setPendingStartDate(null);
      return;
    }

    // Multi-day, open modal for naming/comment
    openRangeModal(start, end);
    setPendingStartDate(null);
  };

  const handleMouseEnter = (calendarDate: CalendarDate) => {
    if (isTouchDevice || availabilityView !== 'personal') return; // disable hover logic on touch or in group view
    if (!isDragging || !dragStartDate || !calendarDate.isCurrentMonth) return;

    const startDate = new Date(dragStartDate);
    const endDate = new Date(calendarDate.date);

    const [from, to] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    setSelectedRange({ start: from, end: to });
  };

  const handleMouseDown = (calendarDate: CalendarDate) => {
    if (isTouchDevice || availabilityView !== 'personal') return; // skip drag logic on touch or in group view
    if (!calendarDate.isCurrentMonth) return;

    setIsDragging(true);
    setDragStartDate(calendarDate.date);
    handleDateClick(calendarDate);
  };

  const handleMouseUp = () => {
    if (isDragging && selectedRange) {
      // Apply selected availability type to all dates in range
      console.log('Mouse drag painting with availability type:', selectedAvailabilityType);
      const newDates = new Map(selectedDates);
      let currentDate = new Date(selectedRange.start);
      const endDate = new Date(selectedRange.end);

      while (currentDate <= endDate) {
        const dateStr = toYMD(currentDate);
        console.log('Drag painting date', dateStr, 'to', selectedAvailabilityType);
        newDates.set(dateStr, selectedAvailabilityType);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      onDatesChange(newDates);
    }

    setIsDragging(false);
    setDragStartDate(null);
    setSelectedRange(null);
  };


  const handleSaveRange = async (start: Date, end: Date, title: string) => {
    if (!start || !end || !title.trim()) return;
    try {
      await onCreateDateRange({
        name: title.trim(),
        startDate: toYMD(start),
        endDate: toYMD(end),
        comment: rangeComment.trim() || undefined
      });
      setPendingRangeData(null);
      setProposalTitle('');
      setRangeComment('');
      setIsAddRangeModalOpen(false);
      setStartDate(null);
      setEndDate(null);
    } catch (error) {
      console.error('Error in handleSaveRange:', error);
    }
  };

  const handleCancelRange = () => {
    setSelectedRange(null);
    setPendingRangeData(null);
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
      'w-10 h-10 flex items-center justify-center text-sm rounded-lg border touch-manipulation relative',
      'transition-all duration-300 ease-spring transform-gpu',
      'hover:z-10 relative'
    ];

    // Only allow interaction in personal view
    if (availabilityView === 'personal') {
      baseClasses.push('cursor-pointer hover:scale-105 active:scale-95 hover:shadow-md active:shadow-sm');
    } else {
      baseClasses.push('cursor-default');
    }

    if (!isCurrentMonth) {
      baseClasses.push('text-muted-foreground/50');
    }

    if (isToday) {
      baseClasses.push('ring-2 ring-orange-500 ring-offset-1 animate-pulse');
    }

    // Pending start highlight (only in personal view)
    if (availabilityView === 'personal' && pendingStartDate && new Date(calendarDate.date).getTime() === pendingStartDate.getTime()) {
      baseClasses.push('ring-2 ring-orange-400');
    }

    // Range selection highlight (only in personal view)
    if (availabilityView === 'personal' && isInRange) {
      baseClasses.push('bg-orange-100 border-orange-300 shadow-lg animate-in slide-in-from-top-1 duration-200');
    }

    if (availabilityView === 'personal') {
      // Personal view: show user's availability
      if (availability === 'unavailable') {
        baseClasses.push('bg-red-500 text-white border-red-500 shadow-red-200 shadow-lg');
      } else if (availability === 'available') {
        baseClasses.push('bg-green-500 text-white border-green-500 shadow-green-200 shadow-lg');
      } else if (availability === 'maybe') {
        baseClasses.push('bg-orange-500 text-white border-orange-500 shadow-orange-200 shadow-lg');
      } else {
        baseClasses.push('hover:bg-muted border-border hover:border-orange-300');
      }
    } else {
      // Group view: show team availability percentage
      const groupData = getGroupAvailabilityForDate(calendarDate.date);
      if (groupData && groupData.total_members > 0) {
        const percentage = groupData.availability_percentage;
        if (percentage >= 75) {
          baseClasses.push('bg-green-100 border-green-300 text-green-800');
        } else if (percentage >= 50) {
          baseClasses.push('bg-yellow-100 border-yellow-300 text-yellow-800');
        } else if (percentage >= 25) {
          baseClasses.push('bg-orange-100 border-orange-300 text-orange-800');
        } else {
          baseClasses.push('bg-red-100 border-red-300 text-red-800');
        }
      } else {
        baseClasses.push('bg-gray-100 border-gray-300 text-gray-500');
      }
    }

    return cn(baseClasses);
  };

  const handleMouseUpCallback = useCallback(() => {
    if (isTouchDevice) return;
    if (selectedRange && selectedRange.start.getTime() !== selectedRange.end.getTime()) {
      openRangeModal(selectedRange.start, selectedRange.end);
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

  const closeFabMenu = () => {
    setShowFabMenu(false);
    setActiveFabCardId(null);
  };

  const onEditDateRange = (id: string) => {
    console.log('Edit date range:', id);
    // Find the range to edit
    const range = dateRanges.find(r => r.id === id);
    if (range) {
      // Pre-fill form with existing data
      setRangeName(range.name);
      setRangeComment(range.comment || '');
      const rangeData = {
        start: new Date(range.startDate),
        end: new Date(range.endDate)
      };
      setSelectedRange(rangeData);
      setPendingRangeData(rangeData);
      setIsAddRangeModalOpen(true);
    }
    closeFabMenu();
  };

  const onChangeVote = (id: string) => {
    console.log('Change vote for range:', id);
    // TODO: Implement vote change UI
    closeFabMenu();
  };

  const onDeleteRange = (id: string) => {
    console.log('Delete range:', id);
    onDeleteDateRange(id);
    closeFabMenu();
  };

  const onHideRange = (id: string) => {
    console.log('Hide range:', id);
    // TODO: Implement hide functionality
    closeFabMenu();
  };

  const queryClient = useQueryClient();

  // Helper function to render the main content
  const renderContent = () => {
    return (
      <div className={cn('max-w-md mx-auto', className)}>
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'availability' | 'summary')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="availability" className="rounded-l-full">Select Availability</TabsTrigger>
            <TabsTrigger value="summary" className="rounded-r-full">Summary</TabsTrigger>
          </TabsList>

          {/* Select Availability Tab */}
          <TabsContent value="availability" className="space-y-4">
            {/* View Toggle */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={availabilityView === 'personal' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAvailabilityView('personal')}
                  className="text-xs"
                >
                  Personal
                </Button>
                <Button
                  variant={availabilityView === 'group' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAvailabilityView('group')}
                  className="text-xs"
                >
                  Group
                </Button>
              </div>
            </div>

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

            {/* Availability Type Selector - Only shown in personal view */}
            {availabilityView === 'personal' && (
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => setSelectedAvailabilityType('available')}
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-200",
                    selectedAvailabilityType === 'available'
                      ? "gap-2 px-3 py-1 bg-green-100 border border-green-200"
                      : "w-8 h-8 hover:bg-gray-100"
                  )}
                  aria-label="Set availability to Available"
                >
                  <div className="w-4 h-4 bg-green-500 rounded-full shrink-0"></div>
                  {selectedAvailabilityType === 'available' && (
                    <span className="text-sm font-medium text-green-700">Available</span>
                  )}
                </button>

                <button
                  onClick={() => setSelectedAvailabilityType('maybe')}
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-200",
                    selectedAvailabilityType === 'maybe'
                      ? "gap-2 px-3 py-1 bg-orange-100 border border-orange-200"
                      : "w-8 h-8 hover:bg-gray-100"
                  )}
                  aria-label="Set availability to maybe"
                >
                  <div className="w-4 h-4 bg-yellow-500 rounded-full shrink-0"></div>
                  {selectedAvailabilityType === 'maybe' && (
                    <span className="text-sm font-medium text-yellow-700">Maybe</span>
                  )}
                </button>

                <button
                  onClick={() => setSelectedAvailabilityType('unavailable')}
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-200",
                    selectedAvailabilityType === 'unavailable'
                      ? "gap-2 px-3 py-1 bg-red-100 border border-red-200"
                      : "w-8 h-8 hover:bg-gray-100"
                  )}
                  aria-label="Set availability to Unavailable"
                >
                  <div className="w-4 h-4 bg-red-500 rounded-full shrink-0"></div>
                  {selectedAvailabilityType === 'unavailable' && (
                    <span className="text-sm font-medium text-red-700">Unavailable</span>
                  )}
                </button>
              </div>
            )}

            {/* Group View Information */}
            {availabilityView === 'group' && (
              <div className="text-center mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Group View:</strong> Shows team availability percentages.
                  Colors indicate how many team members are available each day.
                </p>
                <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
                    <span>75%+ available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded"></div>
                    <span>50-74%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-200 border border-orange-300 rounded"></div>
                    <span>25-49%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
                    <span>&lt;25%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Grid */}
            <Card>
              <CardContent className="p-4">
                {/* Days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((day, i) => (
                    <div key={`${day}-${i}`} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar dates */}
                <div className="grid grid-cols-7 gap-1" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                  {calendarDates.map((calendarDate, index) => {
                    const groupData = availabilityView === 'group' ? getGroupAvailabilityForDate(calendarDate.date) : null;

                    return (
                      <div
                        key={index}
                        className={getDateStyle(calendarDate)}
                        onMouseDown={() => handleMouseDown(calendarDate)}
                        onMouseEnter={() => handleMouseEnter(calendarDate)}
                        onClick={() => handleDateClick(calendarDate)}
                        title={
                          availabilityView === 'group' && groupData
                            ? `${groupData.available_count}/${groupData.total_members} available (${groupData.availability_percentage}%)`
                            : undefined
                        }
                      >
                        {availabilityView === 'group' && groupData && groupData.total_members > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs">{calendarDate.day}</span>
                            <span className="text-xs font-bold">{Math.round(groupData.availability_percentage)}%</span>
                          </div>
                        ) : (
                          calendarDate.day
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4 relative">
            {dateRanges.map(range => {
              // Map the date range to EnhancedDateProposal format
              const enhancedProposal: EnhancedDateProposal = {
                id: range.id,
                trip_id: tripId,
                proposed_by: range.createdBy,
                title: range.name,
                start_date: range.startDate,
                end_date: range.endDate,
                notes: range.comment,
                is_finalized: false, // This will be updated based on your actual data
                created_at: new Date().toISOString(), // Update with actual created_at if available
                updated_at: new Date().toISOString(), // Update with actual updated_at if available
                proposed_by_profile: {
                  username: range.createdByName,
                  full_name: range.createdByName,
                  avatar_url: ''
                },
                vote_stats: {
                  upvotes: range.votes.available,
                  downvotes: range.votes.total - range.votes.available - range.votes.canWork,
                  neutral_votes: range.votes.canWork,
                  total_votes: range.votes.total,
                  net_score: range.votes.available - (range.votes.total - range.votes.available - range.votes.canWork)
                },
                user_vote: undefined, // This will be set based on user's vote
                discussion_count: range.discussions.length,
                linked_destinations: [] // Update with actual linked destinations if available
              };

              return (
                <DateProposalCard
                  key={range.id}
                  proposal={enhancedProposal}
                  currentUserId={currentUserId}
                  canEdit={true} // Set based on user permissions
                  canDelete={true} // Set based on user permissions
                  canFinalize={true} // Set based on user permissions
                  memberCount={memberCount}
                  onVote={async (proposalId, voteType) => {
                    // Actually cast the vote and refetch proposals
                    await castVote(tripId, currentUserId, { date_proposal_id: proposalId, vote_type: voteType });
                    queryClient.invalidateQueries({ queryKey: ['dateProposals'] });
                  }}
                  onEdit={(proposal) => {
                    // Implement edit handling
                    console.log('Edit proposal:', proposal);
                  }}
                  onDelete={async (proposalId) => {
                    // Implement delete handling
                    console.log('Delete proposal:', proposalId);
                    await onDeleteDateRange(proposalId);
                  }}
                  onFinalize={async (proposalId) => {
                    // Implement finalize handling
                    console.log('Finalize proposal:', proposalId);
                  }}
                  onDiscussion={(proposalId) => {
                    // Handle discussion click
                    setSelectedDiscussionRange(range);
                    setShowDiscussionSheet(true);
                  }}
                  onEraseVote={async (proposalId) => {
                    // Implement erase vote handling
                    console.log('Erase vote for proposal:', proposalId);
                  }}
                />
              );
            })}
            {/* Floating Action Button for adding a date proposal */}
            <button
              onClick={() => setIsAddRangeModalOpen(true)}
              className="fixed bottom-24 right-6 z-50 bg-orange-500 hover:bg-orange-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-200"
              aria-label="Add date proposal"
            >
              <span className="text-3xl leading-none">+</span>
            </button>
          </TabsContent>
          {/* End of Summary Tab */}
        </Tabs>
      </div>
    );
  };

  // Helper to format date range for title
  function formatDateRangeForTitle(start: Date | null, end: Date | null) {
    if (!start || !end) return '';
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
  }

  return (
    <>
      {renderContent()}
      {/* Range Modal Sheet */}
      <Sheet open={isAddRangeModalOpen} onOpenChange={setIsAddRangeModalOpen}>
        <SheetContent className="sm:max-w-[425px] bg-white/95" side="bottom">
          <div className="space-y-4 mt-4">
            {/* Accessible DialogTitle for screen readers */}
            <DialogTitle asChild>
              <VisuallyHidden>Add Date Proposal</VisuallyHidden>
            </DialogTitle>
            {/* Accessible DialogDescription for screen readers */}
            <DialogDescription asChild>
              <VisuallyHidden>Select a title, start and end date, and add an optional comment to propose new dates for the trip.</VisuallyHidden>
            </DialogDescription>
            {/* Proposal Title Input */}
            <div>
              <Label htmlFor="proposal-title" className="pl-4">Proposal Title</Label>
              <Input
                id="proposal-title"
                value={proposalTitle}
                onChange={e => setProposalTitle(e.target.value)}
                placeholder="e.g., Summer weekend getaway"
                className="bg-background"
                disabled={!startDate || !endDate}
              />
            </div>
            {/* Start Date Picker */}
            <div className="flex flex-col gap-3">
              <Label htmlFor="start-date" className="pl-4">Start Date</Label>
              <div className="relative flex gap-2">
                <Input
                  id="start-date"
                  value={startDate ? startDate.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" }) : ""}
                  placeholder="Select start date"
                  className="bg-background pr-10"
                  readOnly
                  onClick={() => setCalendarSheet('start')}
                />
                <Button
                  id="start-date-picker"
                  variant="ghost"
                  className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                  type="button"
                  onClick={() => setCalendarSheet('start')}
                >
                  <CalendarIcon className="size-3.5" />
                  <span className="sr-only">Select start date</span>
                </Button>
              </div>
            </div>
            {/* End Date Picker */}
            <div className="flex flex-col gap-3">
              <Label htmlFor="end-date" className="pl-4">End Date</Label>
              <div className="relative flex gap-2">
                <Input
                  id="end-date"
                  value={endDate ? endDate.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" }) : ""}
                  placeholder="Select end date"
                  className="bg-background pr-10"
                  readOnly
                  onClick={() => setCalendarSheet('end')}
                />
                <Button
                  id="end-date-picker"
                  variant="ghost"
                  className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                  type="button"
                  onClick={() => setCalendarSheet('end')}
                >
                  <CalendarIcon className="size-3.5" />
                  <span className="sr-only">Select end date</span>
                </Button>
              </div>
            </div>
            {/* Calendar Sheet for Start/End Date */}
            <Sheet open={calendarSheet !== null} onOpenChange={open => !open && setCalendarSheet(null)}>
              <SheetContent className="sm:max-w-[425px] bg-white/95 flex flex-col items-center justify-start" side="bottom">
                <div className="w-full max-w-md px-4 pt-6 pb-4 flex flex-col items-center">
                  <span className="text-lg font-semibold mb-4 text-center w-full block">
                    {calendarSheet === 'start' ? 'Select Start Date' : 'Select End Date'}
                  </span>
                  <Calendar
                    mode="single"
                    selected={calendarSheet === 'start' ? startDate || undefined : endDate || undefined}
                    captionLayout="dropdown"
                    onSelect={(date: Date | undefined) => {
                      if (calendarSheet === 'start') {
                        setStartDate(date || null);
                        if ((date || null) && endDate) {
                          setProposalTitle(formatDateRangeForTitle(date || null, endDate));
                        }
                      } else if (calendarSheet === 'end') {
                        setEndDate(date || null);
                        if (startDate && (date || null)) {
                          setProposalTitle(formatDateRangeForTitle(startDate, date || null));
                        }
                      }
                      setCalendarSheet(null);
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
            {/* Comment/Description Field */}
            <div>
              <label className="text-sm font-medium pl-4">Comment (optional)</label>
              <Textarea
                value={rangeComment}
                onChange={(e) => setRangeComment(e.target.value)}
                placeholder="Add any notes about your availability..."
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Save using title, startDate and endDate
                  if (!proposalTitle.trim() || !startDate || !endDate) return;
                  handleSaveRange(startDate, endDate, proposalTitle);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!proposalTitle.trim() || !startDate || !endDate}
              >
                Save Range
              </Button>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelRange();
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}