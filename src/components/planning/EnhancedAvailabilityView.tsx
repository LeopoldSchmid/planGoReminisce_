"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, EyeOff, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvailabilityStatus, getTripAvailabilityHeatmap, AvailabilityHeatmapData } from '@/services/availabilityService';
import { ProposalDiscussion } from './ProposalDiscussion';
import { useQuery } from '@tanstack/react-query';

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


  const handleSaveRange = async () => {
    console.log('handleSaveRange called');
    console.log('selectedRange:', selectedRange);
    console.log('pendingRangeData:', pendingRangeData);
    console.log('rangeName:', rangeName);
    console.log('rangeComment:', rangeComment);
    
    // Use pendingRangeData as fallback if selectedRange is null
    const rangeToUse = selectedRange || pendingRangeData;
    
    if (!rangeToUse) {
      console.log('Early return - missing range data');
      return;
    }

    if (!rangeName.trim()) {
      console.log('Early return - missing rangeName');
      return;
    }

    console.log('Creating date range with data:', {
      name: rangeName.trim(),
      startDate: toYMD(rangeToUse.start),
      endDate: toYMD(rangeToUse.end),
      comment: rangeComment.trim() || undefined
    });

    try {
      // First, notify parent about new range creation
      await onCreateDateRange({
        name: rangeName.trim(),
        startDate: toYMD(rangeToUse.start),
        endDate: toYMD(rangeToUse.end),
        comment: rangeComment.trim() || undefined
      });

      // Paint availability for all dates in the range
      console.log('Painting range with availability type:', selectedAvailabilityType);
      const newDates = new Map(selectedDates);
      let cur = new Date(rangeToUse.start);
      const end = new Date(rangeToUse.end);
      while (cur <= end) {
        const dateStr = toYMD(cur);
        console.log('Setting date', dateStr, 'to', selectedAvailabilityType);
        newDates.set(dateStr, selectedAvailabilityType);
        cur.setDate(cur.getDate() + 1);
      }
      onDatesChange(newDates);

      // Reset state after successful creation
      setSelectedRange(null);
      setPendingRangeData(null);
      setRangeName('');
      setRangeComment('');
      setIsAddRangeModalOpen(false);
      console.log('handleSaveRange completed successfully');
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
            <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => {
                console.log('Setting availability type to: available');
                setSelectedAvailabilityType('available' as AvailabilityStatus);
              }}
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
              onClick={() => {
                console.log('Setting availability type to: maybe');
                setSelectedAvailabilityType('maybe' as AvailabilityStatus);
              }}
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
              onClick={() => {
                console.log('Setting availability type to: unavailable');
                setSelectedAvailabilityType('unavailable' as AvailabilityStatus);
              }}
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
        <TabsContent value="summary" className="space-y-4">
          {dateRanges.map(range => {
            const unavailableVotes = Math.max(0, range.votes.total - range.votes.available - range.votes.canWork);
            const mappedDiscussions = range.discussions.map(d => ({
              id: d.id,
              trip_id: '',
              user_id: d.user,
              comment_text: d.message,
              is_edited: false,
              created_at: d.timestamp,
              updated_at: d.timestamp,
              user_profile: { username: d.userName },
              replies: []
            }));
            const isExpanded = expandedCardId === range.id;
            const userHasVoted = range.votes.available > 0 || range.votes.canWork > 0;
            return (
              <Card key={range.id} className="relative transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                {/* Card Header - only this toggles expansion */}
                <div
                  className="flex items-center justify-between cursor-pointer select-none p-4"
                  onClick={() => {
                    const newExpandedId = isExpanded ? null : range.id;
                    setExpandedCardId(newExpandedId);
                    // Close FAB menu when collapsing
                    if (!newExpandedId) {
                      closeFabMenu();
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">SC</div>
                    <div>
                      <h3 className="font-semibold">{range.name}</h3>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(new Date(range.startDate))} - {formatDate(new Date(range.endDate))}
                      </div>
                      <div className="text-xs text-muted-foreground">by {range.createdByName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{range.votes.total} votes</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 p-0 transition-transform relative",
                        showFabMenu && activeFabCardId === range.id ? "rotate-45" : "rotate-0"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (expandedCardId !== range.id) {
                          setExpandedCardId(range.id);
                        }
                        // Toggle FAB menu for this specific card
                        if (activeFabCardId === range.id && showFabMenu) {
                          setShowFabMenu(false);
                          setActiveFabCardId(null);
                        } else {
                          setShowFabMenu(true);
                          setActiveFabCardId(range.id);
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Vote Bar */}
                <div className="px-4">
                  <div className="relative w-full h-3 mb-3 bg-muted rounded-full overflow-hidden flex">
                    <div className="bg-green-500 h-full" style={{ width: `${(range.votes.available / range.votes.total) * 100}%` }} />
                    <div className="bg-orange-400 h-full" style={{ width: `${(range.votes.canWork / range.votes.total) * 100}%` }} />
                    <div className="bg-red-500 h-full" style={{ width: `${(unavailableVotes / range.votes.total) * 100}%` }} />
                  </div>
                </div>
                {/* Expandable Content */}
                <div
                  className={cn(
                    "transition-all duration-300 overflow-hidden",
                    isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                  )}
                  onClick={e => {
                    e.stopPropagation();
                    // Close FAB menu when clicking in the expanded area but not on the menu
                    if (showFabMenu && activeFabCardId === range.id) {
                      closeFabMenu();
                    }
                  }}
                >
                  <CardContent className="pt-0">
                    <ProposalDiscussion
                      discussions={mappedDiscussions}
                      currentUserId={currentUserId}
                      onAddComment={async (text) => { onDiscussionUpdate(range.id, text); }}
                      onReply={async (parentId: string, text: string) => { 
                        console.log('Reply handler called:', { parentId, text });
                        onDiscussionUpdate(range.id, text, parentId); 
                      }}
                      placeholder="Add a comment..."
                      className="mt-4"
                    />
                    {showFabMenu && isExpanded && activeFabCardId === range.id && (
                      <div 
                        className="absolute right-4 top-12 z-20 min-w-[180px] bg-white text-gray-900 rounded-xl shadow-lg py-2 px-2 flex flex-col gap-1 border border-gray-200"
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Caret/arrow */}
                        <div className="absolute -top-2 right-4 w-4 h-4 overflow-hidden">
                          <div className="w-4 h-4 bg-white border-gray-200 rotate-45 shadow-md border-t border-l border-gray-200"></div>
                        </div>
                        <Button
                          variant="ghost"
                          className="justify-start px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-200"
                          disabled={currentUserId !== range.createdBy}
                          onClick={e => { e.stopPropagation(); onEditDateRange(range.id); }}
                        >
                          <Edit2 className="h-4 w-4 mr-2" /> Edit date range
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-200"
                          disabled={!userHasVoted}
                          onClick={e => { e.stopPropagation(); onChangeVote(range.id); }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Change my vote
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-200 text-red-600"
                          disabled={currentUserId !== range.createdBy}
                          onClick={e => { e.stopPropagation(); onDeleteRange(range.id); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete range
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-200"
                          onClick={e => { e.stopPropagation(); onHideRange(range.id); }}
                        >
                          <EyeOff className="h-4 w-4 mr-2" /> Hide range
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Add Date Range Sheet */}
      <Sheet open={isAddRangeModalOpen} onOpenChange={(open) => {
        console.log('Sheet onOpenChange called with:', open);
        if (!open) {
          console.log('Sheet trying to close, calling handleCancelRange');
          handleCancelRange();
        }
      }}>
        <SheetContent side="bottom" className="w-full pt-4 pb-8 rounded-t-2xl max-h-[80vh] overflow-y-auto bg-white text-gray-900 dark:bg-white dark:text-gray-900 shadow-xl">
          <SheetHeader className="relative">
            <SheetTitle>
              {pendingRangeData 
                ? `Edit Date Range (${formatDate(pendingRangeData.start)} - ${formatDate(pendingRangeData.end)})`
                : 'Add Date Range'
              }
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1"
              onClick={handleCancelRange}
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>

          <div className="space-y-4 mt-4">
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
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Save Range button clicked!');
                  handleSaveRange();
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
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
    </div>
  );
}