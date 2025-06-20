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
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      ) : null;
    }
    if (phase.id === 'go') {
      return tripStatus === 'active' ? (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
      ) : null;
    }
    if (phase.id === 'reminisce') {
      return tripStatus === 'complete' ? (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      ) : null;
    }
    return null;
  };

  return (
    <div className={cn(
      "bg-white border-t border-gray-100 shadow-lg rounded-t-2xl",
      "px-2 py-3 space-y-2",
      className
    )}>
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div className="flex items-center space-x-2">
          {phases.map((phase, index) => (
            <React.Fragment key={phase.id}>
              <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-500 ease-spring",
                phase.isEnabled 
                  ? phase.id === 'plan' ? 'bg-blue-500' : phase.id === 'go' ? 'bg-orange-500' : 'bg-green-500'
                  : 'bg-gray-200',
                activePhase === phase.id && "scale-150 shadow-lg"
              )} />
              {index < phases.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 transition-all duration-500",
                  phases[index + 1].isEnabled ? 'bg-gray-300' : 'bg-gray-100'
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 gap-2">
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
                "relative flex flex-col items-center justify-center",
                "p-4 rounded-xl transition-all duration-300 ease-spring",
                "transform-gpu touch-manipulation",
                "active:scale-95 transition-transform",
                "min-h-[80px] group",
                isActive && [
                  "shadow-lg shadow-orange-100",
                  "bg-gradient-to-br from-orange-50 to-yellow-50",
                  "border border-orange-200",
                  "scale-105"
                ],
                !isActive && isEnabled && [
                  "hover:bg-gray-50",
                  "hover:scale-102",
                  "hover:shadow-md"
                ],
                !isEnabled && [
                  "opacity-50",
                  "cursor-not-allowed"
                ]
              )}
            >
              {/* Status Indicator */}
              {getStatusIndicator(phase)}

              {/* Icon */}
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg mb-2",
                "transition-all duration-300 ease-spring",
                isActive && [
                  phase.bgColor,
                  "shadow-sm",
                  "scale-110"
                ],
                isActive && "animate-in zoom-in-50 duration-200"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isActive ? phase.color : 'text-gray-500',
                  isActive && "drop-shadow-sm"
                )} />
              </div>

              {/* Label */}
              <span className={cn(
                "text-sm font-medium transition-all duration-300",
                isActive ? 'text-gray-900' : 'text-gray-600'
              )}>
                {phase.label}
              </span>

              {/* Description */}
              <span className={cn(
                "text-xs text-center leading-tight mt-1",
                "transition-all duration-300 opacity-0 group-hover:opacity-100",
                isActive ? 'text-gray-700 opacity-100' : 'text-gray-500',
                "max-w-[80px]"
              )}>
                {phase.description}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current Phase Title */}
      <div className="text-center pt-2">
        <h3 className={cn(
          "text-lg font-semibold transition-all duration-500",
          activePhase === 'plan' && 'text-blue-600',
          activePhase === 'go' && 'text-orange-600',
          activePhase === 'reminisce' && 'text-green-600'
        )}>
          {phases.find(p => p.id === activePhase)?.description}
        </h3>
      </div>
    </div>
  );
}