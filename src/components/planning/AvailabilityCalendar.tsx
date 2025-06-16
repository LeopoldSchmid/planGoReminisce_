"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Info, Paintbrush, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvailabilityStatus } from '@/services/availabilityService';
import { AvailabilityDetailModal } from './AvailabilityDetailModal';

interface CalendarDate {
  date: string;
  day: number;
  month: number;
  year: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  availability?: AvailabilityStatus;
  isSelected: boolean;
}

type CalendarMode = 'quick' | 'detailed';

interface AvailabilityCalendarProps {
  selectedDates: Map<string, AvailabilityStatus>;
  onDatesChange: (dates: Map<string, AvailabilityStatus>) => void;
  className?: string;
  showLegend?: boolean;
  disabled?: boolean;
  heatmapData?: Array<{
    date: string;
    available_count: number;
    total_members: number;
    availability_percentage: number;
  }>;
  showHeatmap?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AvailabilityCalendar({
  selectedDates,
  onDatesChange,
  className,
  showLegend = true,
  disabled = false,
  heatmapData,
  showHeatmap = false
}: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<CalendarMode>('quick');
  const [paintBrushStatus, setPaintBrushStatus] = useState<AvailabilityStatus>('unavailable');
  
  // For detailed mode
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDatesForModal, setSelectedDatesForModal] = useState<string[]>([]);
  
  // For range selection
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<string | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate calendar dates for the current month view
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
        isSelected: selectedDates.has(dateStr)
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
        isSelected: selectedDates.has(dateStr)
      });
    }

    // Add next month's leading dates to complete the grid
    const remainingDays = 42 - dates.length; // 6 rows × 7 days
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
        isSelected: selectedDates.has(dateStr)
      });
    }

    return dates;
  }, [currentMonth, currentYear, selectedDates]);

  const calendarDates = generateCalendarDates();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const handleDateClick = (calendarDate: CalendarDate) => {
    if (disabled) return;

    if (mode === 'quick') {
      // Quick mode: paint with selected brush
      const newDates = new Map(selectedDates);
      const { date } = calendarDate;
      
      if (paintBrushStatus === 'available' && selectedDates.get(date) === 'available') {
        // If already set to the same status, remove it (make it ideal)
        newDates.delete(date);
      } else if (paintBrushStatus === 'unavailable' && selectedDates.get(date) === 'unavailable') {
        // If already set to the same status, remove it (make it ideal)
        newDates.delete(date);
      } else {
        // Set to paint brush status
        newDates.set(date, paintBrushStatus);
      }

      onDatesChange(newDates);
    } else {
      // Detailed mode: collect dates for modal
      setSelectedDatesForModal([calendarDate.date]);
      setIsDetailModalOpen(true);
    }
  };

  const handleMouseDown = (calendarDate: CalendarDate) => {
    if (disabled) return;

    setIsDragging(true);
    setDragStartDate(calendarDate.date);
    handleDateClick(calendarDate);
  };

  const handleTouchStart = (calendarDate: CalendarDate) => {
    if (disabled) return;
    
    setIsDragging(true);
    setDragStartDate(calendarDate.date);
    handleDateClick(calendarDate);
  };

  const handleMouseEnter = (calendarDate: CalendarDate) => {
    if (!isDragging || !dragStartDate) return;

    if (mode === 'quick') {
      // Handle range selection in quick mode
      const newDates = new Map(selectedDates);
      const startDate = new Date(dragStartDate);
      const endDate = new Date(calendarDate.date);
      
      // Ensure start is before end
      const [from, to] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
      
      // Apply the paint brush status to all dates in the range
      const current = new Date(from);
      while (current <= to) {
        const dateStr = current.toISOString().split('T')[0];
        newDates.set(dateStr, paintBrushStatus);
        current.setDate(current.getDate() + 1);
      }

      onDatesChange(newDates);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragStartDate || mode !== 'quick') return;
    
    e.preventDefault();
    
    // Get the element under the touch point
    const touch = e.touches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (elementBelow && elementBelow.hasAttribute('data-date')) {
      const dateStr = elementBelow.getAttribute('data-date');
      if (dateStr) {
        const calendarDate = { date: dateStr } as CalendarDate;
        handleMouseEnter(calendarDate);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartDate(null);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragStartDate(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  const getDateStyle = (calendarDate: CalendarDate) => {
    const { availability, isCurrentMonth, isToday } = calendarDate;
    const baseClasses = [
      'w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all duration-200 border touch-manipulation',
      'hover:bg-muted active:scale-95 active:bg-muted'
    ];

    if (!isCurrentMonth) {
      baseClasses.push('text-gray-400 dark:text-gray-600');
    }

    if (isToday) {
      baseClasses.push('ring-2 ring-primary');
    }

    if (disabled) {
      baseClasses.push('cursor-not-allowed opacity-50');
    }

    // Availability styling
    if (availability === 'unavailable') {
      baseClasses.push('bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20');
    } else if (availability === 'available') {
      baseClasses.push('bg-success/10 border-success/30 text-success hover:bg-success/20');
    }

    // Heatmap styling (if enabled and no availability set)
    if (showHeatmap && heatmapData && !availability) {
      const heatmapEntry = heatmapData.find(h => h.date === calendarDate.date);
      if (heatmapEntry) {
        const percentage = heatmapEntry.availability_percentage;
        if (percentage >= 80) {
          baseClasses.push('bg-success/10 border-success/30 text-success');
        } else if (percentage >= 60) {
          baseClasses.push('bg-warning/10 border-warning/30 text-warning');
        } else if (percentage >= 40) {
          baseClasses.push('bg-active/10 border-active/30 text-active');
        } else if (percentage > 0) {
          baseClasses.push('bg-destructive/10 border-destructive/30 text-destructive');
        }
      }
    }

    return cn(baseClasses);
  };

  const getHeatmapTooltip = (calendarDate: CalendarDate) => {
    if (!showHeatmap || !heatmapData) return null;
    
    const heatmapEntry = heatmapData.find(h => h.date === calendarDate.date);
    if (!heatmapEntry) return null;

    return `${heatmapEntry.available_count}/${heatmapEntry.total_members} available (${heatmapEntry.availability_percentage}%)`;
  };

  const handleDetailedSave = (status: AvailabilityStatus, notes?: string) => {
    const newDates = new Map(selectedDates);
    
    selectedDatesForModal.forEach(date => {
      if (status === 'available' && notes === undefined) {
        // This means "ideal" was selected - remove the date
        newDates.delete(date);
      } else {
        newDates.set(date, status);
        // Note: In a full implementation, you'd also store the notes
        // For now, we're just storing the status in the Map
      }
    });

    onDatesChange(newDates);
    setSelectedDatesForModal([]);
  };

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {showHeatmap ? 'Team Availability' : 'My Availability'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={disabled}
              className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-medium">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={disabled}
              className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mode Toggle and Paint Brush Selection */}
        {!showHeatmap && !disabled && (
          <div className="space-y-3">
            {/* Mode Toggle - Simplified for mobile */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                <Button
                  variant={mode === 'quick' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('quick')}
                  className="flex items-center gap-1 text-xs px-3 py-2"
                >
                  <Paintbrush className="h-3 w-3" />
                  Quick
                </Button>
                <Button
                  variant={mode === 'detailed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('detailed')}
                  className="flex items-center gap-1 text-xs px-3 py-2"
                >
                  <Settings className="h-3 w-3" />
                  Detailed
                </Button>
              </div>
            </div>

            {/* Paint Brush Selection for Quick Mode */}
            {mode === 'quick' && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground text-center">Select status to paint:</div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setPaintBrushStatus('unavailable')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 rounded-lg text-xs transition-all border min-h-[44px] touch-manipulation',
                      paintBrushStatus === 'unavailable'
                        ? 'bg-destructive/10 border-destructive text-destructive ring-2 ring-destructive'
                        : 'border-border hover:border-destructive hover:bg-destructive/5'
                    )}
                  >
                    <div className="w-3 h-3 bg-destructive/20 border border-destructive rounded"></div>
                    Unavailable
                  </button>
                  <button
                    onClick={() => setPaintBrushStatus('available')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 rounded-lg text-xs transition-all border min-h-[44px] touch-manipulation',
                      paintBrushStatus === 'available'
                        ? 'bg-success/10 border-success text-success ring-2 ring-success'
                        : 'border-border hover:border-success hover:bg-success/5'
                    )}
                  >
                    <div className="w-3 h-3 bg-success/20 border border-success rounded"></div>
                    Available
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {showLegend && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
            {!showHeatmap ? (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-destructive/20 border border-destructive rounded"></div>
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-success/20 border border-success rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-card border border-border rounded"></div>
                  <span>Ideal</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-success/20 border border-success rounded"></div>
                  <span>80%+ available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-warning/20 border border-warning rounded"></div>
                  <span>60-79%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-active/20 border border-active rounded"></div>
                  <span>40-59%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-destructive/20 border border-destructive rounded"></div>
                  <span>&lt;40%</span>
                </div>
              </>
            )}
          </div>
        )}

        {!disabled && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center text-center">
            <Info className="h-3 w-3 shrink-0" />
            <span>
              {mode === 'quick' 
                ? 'Tap or drag to paint dates. Tap same status to remove.'
                : 'Tap dates to open detailed availability editor.'
              }
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div 
            className="grid grid-cols-7 gap-2 sm:gap-1"
            onTouchMove={handleTouchMove}
          >
            {calendarDates.map((calendarDate, index) => {
              const tooltip = getHeatmapTooltip(calendarDate);
              
              return (
                <div
                  key={index}
                  className={getDateStyle(calendarDate)}
                  data-date={calendarDate.date}
                  onClick={() => handleDateClick(calendarDate)}
                  onMouseDown={() => handleMouseDown(calendarDate)}
                  onMouseEnter={() => handleMouseEnter(calendarDate)}
                  onTouchStart={() => handleTouchStart(calendarDate)}
                  title={tooltip || undefined}
                  style={{ touchAction: 'none' }}
                >
                  {calendarDate.day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {selectedDates.size > 0 && !showHeatmap && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">
                {Array.from(selectedDates.values()).filter(s => s === 'unavailable').length} unavailable
              </Badge>
              <Badge variant="secondary">
                {Array.from(selectedDates.values()).filter(s => s === 'available').length} available
              </Badge>
            </div>
          </div>
        )}
      </CardContent>

      {/* Detailed Mode Modal */}
      <AvailabilityDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedDates={selectedDatesForModal}
        onSave={handleDetailedSave}
        currentStatus={selectedDatesForModal.length > 0 ? selectedDates.get(selectedDatesForModal[0]) : undefined}
      />
    </Card>
  );
}