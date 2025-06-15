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

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartDate(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  const getDateStyle = (calendarDate: CalendarDate) => {
    const { availability, isCurrentMonth, isToday } = calendarDate;
    const baseClasses = [
      'w-8 h-8 flex items-center justify-center text-sm rounded-sm cursor-pointer transition-colors border',
      'hover:bg-gray-100 dark:hover:bg-gray-800'
    ];

    if (!isCurrentMonth) {
      baseClasses.push('text-gray-400 dark:text-gray-600');
    }

    if (isToday) {
      baseClasses.push('ring-2 ring-blue-500 dark:ring-blue-400');
    }

    if (disabled) {
      baseClasses.push('cursor-not-allowed opacity-50');
    }

    // Availability styling
    if (availability === 'unavailable') {
      baseClasses.push('bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200');
    } else if (availability === 'available') {
      baseClasses.push('bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-200');
    }

    // Heatmap styling (if enabled and no availability set)
    if (showHeatmap && heatmapData && !availability) {
      const heatmapEntry = heatmapData.find(h => h.date === calendarDate.date);
      if (heatmapEntry) {
        const percentage = heatmapEntry.availability_percentage;
        if (percentage >= 80) {
          baseClasses.push('bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700');
        } else if (percentage >= 60) {
          baseClasses.push('bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700');
        } else if (percentage >= 40) {
          baseClasses.push('bg-orange-100 border-orange-300 dark:bg-orange-900 dark:border-orange-700');
        } else if (percentage > 0) {
          baseClasses.push('bg-red-100 border-red-300 dark:bg-red-900 dark:border-red-700');
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
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {showHeatmap ? 'Team Availability' : 'My Availability'}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={disabled}
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
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mode Toggle and Paint Brush Selection */}
        {!showHeatmap && !disabled && (
          <div className="space-y-3">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={mode === 'quick' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('quick')}
                  className="flex items-center gap-1"
                >
                  <Paintbrush className="h-3 w-3" />
                  Quick
                </Button>
                <Button
                  variant={mode === 'detailed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('detailed')}
                  className="flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Detailed
                </Button>
              </div>
            </div>

            {/* Paint Brush Selection for Quick Mode */}
            {mode === 'quick' && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Paint Brush:</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaintBrushStatus('unavailable')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded text-xs transition-all border',
                      paintBrushStatus === 'unavailable'
                        ? 'bg-red-100 border-red-300 text-red-800 ring-2 ring-red-500 ring-offset-1 dark:bg-red-900 dark:border-red-700 dark:text-red-200'
                        : 'border-gray-300 hover:border-red-300 dark:border-gray-600 dark:hover:border-red-600'
                    )}
                  >
                    <div className="w-3 h-3 bg-red-100 border border-red-300 rounded dark:bg-red-900 dark:border-red-700"></div>
                    Unavailable
                  </button>
                  <button
                    onClick={() => setPaintBrushStatus('available')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded text-xs transition-all border',
                      paintBrushStatus === 'available'
                        ? 'bg-orange-100 border-orange-300 text-orange-800 ring-2 ring-orange-500 ring-offset-1 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-200'
                        : 'border-gray-300 hover:border-orange-300 dark:border-gray-600 dark:hover:border-orange-600'
                    )}
                  >
                    <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded dark:bg-orange-900 dark:border-orange-700"></div>
                    Available
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {showLegend && (
          <div className="flex flex-wrap gap-2 text-xs">
            {!showHeatmap ? (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                  <span>Ideal</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>80%+ available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span>60-79%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                  <span>40-59%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span>&lt;40%</span>
                </div>
              </>
            )}
          </div>
        )}

        {!disabled && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Info className="h-3 w-3" />
            <span>
              {mode === 'quick' 
                ? 'Click or drag to paint dates. Click same status to remove.'
                : 'Click dates to open detailed availability editor.'
              }
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDates.map((calendarDate, index) => {
              const tooltip = getHeatmapTooltip(calendarDate);
              
              return (
                <div
                  key={index}
                  className={getDateStyle(calendarDate)}
                  onClick={() => handleDateClick(calendarDate)}
                  onMouseDown={() => handleMouseDown(calendarDate)}
                  onMouseEnter={() => handleMouseEnter(calendarDate)}
                  title={tooltip || undefined}
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