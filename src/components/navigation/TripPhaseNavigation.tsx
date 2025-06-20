"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { MapPin, PlaneTakeoff, Camera } from 'lucide-react';

interface TripPhaseNavigationProps {
  activePhase: 'plan' | 'go' | 'reminisce';
  onPhaseChange: (phase: 'plan' | 'go' | 'reminisce') => void;
  tripStatus: 'planning' | 'active' | 'complete';
  className?: string;
}

interface PhaseConfig {
  id: 'plan' | 'go' | 'reminisce';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
  isEnabled: boolean;
}

export function TripPhaseNavigation({ 
  activePhase, 
  onPhaseChange, 
  tripStatus,
  className 
}: TripPhaseNavigationProps) {
  const phases: PhaseConfig[] = [
    {
      id: 'plan',
      label: 'Plan',
      icon: MapPin,
      description: 'Organize your adventure',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isEnabled: true,
    },
    {
      id: 'go',
      label: 'Go',
      icon: PlaneTakeoff,
      description: 'Live your journey',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      isEnabled: tripStatus === 'active' || tripStatus === 'complete',
    },
    {
      id: 'reminisce',
      label: 'Reminisce',
      icon: Camera,
      description: 'Cherish memories',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isEnabled: tripStatus === 'complete',
    },
  ];

  const getStatusIndicator = (phase: PhaseConfig) => {
    if (phase.id === 'plan') {
      return tripStatus === 'planning' ? (
        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      ) : null;
    }
    if (phase.id === 'go') {
      return tripStatus === 'active' ? (
        <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
      ) : null;
    }
    if (phase.id === 'reminisce') {
      return tripStatus === 'complete' ? (
        <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      ) : null;
    }
    return null;
  };

  return (
    <div className={cn(
      "bg-white border-t border-gray-100 shadow-lg",
      "px-3 py-2",
      className
    )}>
      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1">
        {phases.map((phase) => {
          const Icon = phase.icon;
          const isActive = activePhase === phase.id;
          const isEnabled = phase.isEnabled;

          return (
            <button
              key={phase.id}
              onClick={() => isEnabled && onPhaseChange(phase.id)}
              disabled={!isEnabled}
              className={cn(
                "relative flex items-center justify-center gap-2",
                "py-2 px-3 rounded-lg transition-all duration-300 ease-spring",
                "transform-gpu touch-manipulation",
                "active:scale-95 transition-transform",
                "min-h-[40px] group",
                isActive && [
                  "bg-orange-500 text-white",
                  "shadow-md"
                ],
                !isActive && isEnabled && [
                  "hover:bg-gray-100",
                  "text-gray-600"
                ],
                !isEnabled && [
                  "opacity-50",
                  "cursor-not-allowed",
                  "text-gray-400"
                ]
              )}
            >
              {/* Icon */}
              <Icon className={cn(
                "w-4 h-4 transition-all duration-300",
                isActive ? 'text-white' : 'text-gray-500'
              )} />

              {/* Label */}
              <span className={cn(
                "text-sm font-medium transition-all duration-300",
                isActive ? 'text-white' : 'text-gray-600'
              )}>
                {phase.label}
              </span>
              
              {/* Status Indicator */}
              {getStatusIndicator(phase)}
            </button>
          );
        })}
      </div>
    </div>
  );
}