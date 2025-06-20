"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Plus, MessageSquare, Send, X, Edit2, Trash2, EyeOff, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvailabilityStatus } from '@/services/availabilityService';
import { ProposalDiscussion } from './ProposalDiscussion';

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
  onDeleteDateRange: (rangeId: string) => void;
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
  tripName,
  selectedDates,
  onDatesChange,
  dateRanges,
  onCreateDateRange,
  onDiscussionUpdate,
  onDeleteDateRange,
  currentUserId,
  currentUserName,
  className
}: EnhancedAvailabilityViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDiscussionRange, setSelectedDiscussionRange] = useState<DateRange | null>(null);
  const [activeTab, setActiveTab] = useState<'availability' | 'summary'>('availability');

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

  // Discussion state
  const [discussionMessage, setDiscussionMessage] = useState('');

  // New state for expanded card
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // New state for FAB menu
  const [showFabMenu, setShowFabMenu] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const isDateInSelectedRange = useCallback((date: Date): boolean => {
    if (!selectedRange) return false;
    return date >= selectedRange.start && date <= selectedRange.end;
  }, [selectedRange]);

  // Helper to convert Date to YYYY-MM-DD in local time
  function toYMD(date: Date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }

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
    setSelectedRange({ start, end });
    setRangeName(`${formatDate(start)}-${formatDate(end)}`);
    setIsAddRangeModalOpen(true);
  };

  const handleDateClick = (calendarDate: CalendarDate) => {
    if (!calendarDate.isCurrentMonth) return; // Only allow clicking current month dates

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
    if (isTouchDevice) return; // disable hover logic on touch
    if (!isDragging || !dragStartDate || !calendarDate.isCurrentMonth) return;

    const startDate = new Date(dragStartDate);
    const endDate = new Date(calendarDate.date);

    const [from, to] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    setSelectedRange({ start: from, end: to });
  };

  const handleMouseDown = (calendarDate: CalendarDate) => {
    if (isTouchDevice) return; // skip drag logic on touch
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
        const dateStr = toYMD(currentDate);
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

    // Paint availability for all dates in the range
    const newDates = new Map(selectedDates);
    let cur = new Date(selectedRange.start);
    const end = new Date(selectedRange.end);
    while (cur <= end) {
      const dateStr = toYMD(cur);
      newDates.set(dateStr, selectedAvailabilityType);
      cur.setDate(cur.getDate() + 1);
    }
    onDatesChange(newDates);

    // Notify parent about new range
    onCreateDateRange({
      name: rangeName,
      startDate: toYMD(selectedRange.start),
      endDate: toYMD(selectedRange.end),
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

    // Pending start highlight
    if (pendingStartDate && new Date(calendarDate.date).getTime() === pendingStartDate.getTime()) {
      baseClasses.push('ring-2 ring-orange-400');
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

  const onEditDateRange = (id: string) => { /* TODO: implement edit */ };
  const onChangeVote = (id: string) => { /* TODO: implement change vote */ };
  const onDeleteRange = (id: string) => { /* TODO: implement delete */ };
  const onHideRange = (id: string) => { /* TODO: implement hide */ };

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
              onClick={() => setSelectedAvailabilityType('available' as AvailabilityStatus)}
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
              onClick={() => setSelectedAvailabilityType('maybe' as AvailabilityStatus)}
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
              onClick={() => setSelectedAvailabilityType('unavailable' as AvailabilityStatus)}
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
                {DAYS.map((day, i) => (
                  <div key={`${day}-${i}`} className="text-center text-sm font-medium text-muted-foreground py-2">
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
                  onClick={() => setExpandedCardId(isExpanded ? null : range.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">SC</div>
                    <div>
                      <h3 className="font-semibold">{range.name}</h3>
                      <div className="text-xs text-muted-foreground">by {range.createdByName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{range.votes.total} votes</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 p-0 transition-transform",
                        isExpanded ? "rotate-90" : "rotate-0"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFabMenu((prev) => !prev);
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
                  onClick={e => e.stopPropagation()}
                >
                  <CardContent className="pt-0">
                    <ProposalDiscussion
                      discussions={mappedDiscussions}
                      currentUserId={currentUserId}
                      onAddComment={async (text) => { onDiscussionUpdate(range.id, text); }}
                      placeholder="Add a comment..."
                      className="mt-4"
                    />
                    {showFabMenu && (
                      <div className="absolute right-0 top-12 z-20 min-w-[180px] bg-white text-gray-900 rounded-xl shadow-lg py-2 px-2 flex flex-col gap-1 border border-gray-200">
                        {/* Caret/arrow */}
                        <div className="absolute -top-2 right-4 w-4 h-4 overflow-hidden">
                          <div className="w-4 h-4 bg-white border-gray-200 rotate-45 shadow-md border-t border-l border-gray-200"></div>
                        </div>
                        <Button
                          variant="ghost"
                          className="justify-start px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-200"
                          disabled={currentUserId !== range.createdBy}
                          onClick={e => { e.stopPropagation(); onEditDateRange(range.id); setShowFabMenu(false); }}
                        >
                          <Edit2 className="h-4 w-4 mr-2" /> Edit date range
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-200"
                          disabled={!userHasVoted}
                          onClick={e => { e.stopPropagation(); onChangeVote(range.id); setShowFabMenu(false); }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Change my vote
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-200 text-red-600"
                          disabled={currentUserId !== range.createdBy}
                          onClick={e => { e.stopPropagation(); onDeleteDateRange(range.id); setShowFabMenu(false); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete range
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-200"
                          onClick={e => { e.stopPropagation(); onHideRange(range.id); setShowFabMenu(false); }}
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
      <Sheet open={isAddRangeModalOpen} onOpenChange={setIsAddRangeModalOpen}>
        <SheetContent side="bottom" className="w-full pt-4 pb-8 rounded-t-2xl max-h-[80vh] overflow-y-auto bg-white text-gray-900 dark:bg-white dark:text-gray-900 shadow-xl">
          <SheetHeader className="relative">
            <SheetTitle>Add Date Range</SheetTitle>
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
              <Button onClick={handleSaveRange} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                Save Range
              </Button>
              <Button onClick={handleCancelRange} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}