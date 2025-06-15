"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AvailabilityHeatmapData } from '@/services/availabilityService';

interface AvailabilityHeatmapProps {
  data: AvailabilityHeatmapData[];
  className?: string;
  title?: string;
  showDetails?: boolean;
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}

export function AvailabilityHeatmap({
  data,
  className,
  title = "Team Availability Overview",
  showDetails = true,
  onDateSelect,
  selectedDate
}: AvailabilityHeatmapProps) {
  
  const heatmapStats = useMemo(() => {
    if (data.length === 0) return null;
    
    const totalDays = data.length;
    const perfectDays = data.filter(d => d.availability_percentage === 100).length;
    const goodDays = data.filter(d => d.availability_percentage >= 80 && d.availability_percentage < 100).length;
    const okayDays = data.filter(d => d.availability_percentage >= 60 && d.availability_percentage < 80).length;
    const poorDays = data.filter(d => d.availability_percentage < 60).length;
    
    const avgAvailability = data.reduce((sum, d) => sum + d.availability_percentage, 0) / totalDays;
    const totalMembers = data[0]?.total_members || 0;
    
    return {
      totalDays,
      perfectDays,
      goodDays,
      okayDays,
      poorDays,
      avgAvailability,
      totalMembers
    };
  }, [data]);

  const getHeatmapColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500 border-green-600';
    if (percentage >= 80) return 'bg-green-400 border-green-500';
    if (percentage >= 60) return 'bg-yellow-400 border-yellow-500';
    if (percentage >= 40) return 'bg-orange-400 border-orange-500';
    if (percentage > 0) return 'bg-red-400 border-red-500';
    return 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600';
  };

  const getIntensityOpacity = (percentage: number) => {
    if (percentage === 100) return 'opacity-100';
    if (percentage >= 80) return 'opacity-90';
    if (percentage >= 60) return 'opacity-75';
    if (percentage >= 40) return 'opacity-60';
    if (percentage > 0) return 'opacity-45';
    return 'opacity-30';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const groupDataByWeek = (data: AvailabilityHeatmapData[]) => {
    const weeks: AvailabilityHeatmapData[][] = [];
    let currentWeek: AvailabilityHeatmapData[] = [];
    
    data.forEach((item, index) => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      
      // Start a new week on Sunday
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentWeek.push(item);
      
      // Push the last week
      if (index === data.length - 1) {
        weeks.push(currentWeek);
      }
    });
    
    return weeks;
  };

  const weeks = groupDataByWeek(data);

  if (data.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No availability data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {heatmapStats && (
            <Badge variant="outline">
              {heatmapStats.totalMembers} members
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Week-based grid layout */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1 justify-start">
              {week.map((item) => (
                <div
                  key={item.date}
                  className={cn(
                    'w-6 h-6 border rounded-sm cursor-pointer transition-all hover:scale-110 hover:z-10 relative',
                    getHeatmapColor(item.availability_percentage),
                    getIntensityOpacity(item.availability_percentage),
                    selectedDate === item.date && 'ring-2 ring-blue-500 ring-offset-1',
                    onDateSelect && 'hover:ring-2 hover:ring-gray-400'
                  )}
                  onClick={() => onDateSelect?.(item.date)}
                  title={`${formatDate(item.date)}: ${item.available_count}/${item.total_members} available (${item.availability_percentage}%)`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Less available</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded-sm dark:bg-gray-700 dark:border-gray-600 opacity-30"></div>
            <div className="w-3 h-3 bg-red-400 border border-red-500 rounded-sm opacity-45"></div>
            <div className="w-3 h-3 bg-orange-400 border border-orange-500 rounded-sm opacity-60"></div>
            <div className="w-3 h-3 bg-yellow-400 border border-yellow-500 rounded-sm opacity-75"></div>
            <div className="w-3 h-3 bg-green-400 border border-green-500 rounded-sm opacity-90"></div>
            <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-sm opacity-100"></div>
          </div>
          <span className="text-gray-600 dark:text-gray-400">More available</span>
        </div>

        {/* Detailed stats */}
        {showDetails && heatmapStats && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {heatmapStats.perfectDays} perfect days (100%)
              </Badge>
              <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-800 dark:text-green-300">
                {heatmapStats.goodDays} good days (80-99%)
              </Badge>
              <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300">
                {heatmapStats.okayDays} okay days (60-79%)
              </Badge>
              <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-800 dark:text-red-300">
                {heatmapStats.poorDays} poor days (&lt;60%)
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average availability: <span className="font-medium">{heatmapStats.avgAvailability.toFixed(1)}%</span> across {heatmapStats.totalDays} days
            </div>
          </div>
        )}

        {/* Selected date details */}
        {selectedDate && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            {(() => {
              const selectedData = data.find(d => d.date === selectedDate);
              if (!selectedData) return null;
              
              return (
                <div className="space-y-2">
                  <div className="font-medium text-sm">
                    {formatDate(selectedDate)}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      ✓ {selectedData.available_count} available
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      ✗ {selectedData.unavailable_count} unavailable
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {selectedData.availability_percentage}% team availability
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}