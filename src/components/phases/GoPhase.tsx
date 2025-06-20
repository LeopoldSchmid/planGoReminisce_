"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  MapPin, 
  Users, 
  Receipt,
  MessageSquare,
  Navigation,
  Clock,
  Battery,
  Wifi,
  Plus,
  Share2,
  Heart,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoPhaseProps {
  tripId: string;
  tripName: string;
  tripMembers: Array<{ 
    user_id: string; 
    username: string | null; 
    full_name: string | null; 
    avatar_url?: string | null;
  }>;
  onNavigateToSection: (section: 'expenses' | 'updates' | 'photos') => void;
  className?: string;
}

interface LiveUpdate {
  id: string;
  user: string;
  userName: string;
  message: string;
  timestamp: string;
  type: 'location' | 'photo' | 'expense' | 'message';
  avatar?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  action: () => void;
}

export function GoPhase({ 
  tripId, 
  tripName, 
  tripMembers, 
  onNavigateToSection,
  className 
}: GoPhaseProps) {
  const [currentLocation, setCurrentLocation] = useState("Barcelona, Spain");
  
  // Mock live updates - in real implementation, this would come from real-time data
  const liveUpdates: LiveUpdate[] = [
    {
      id: '1',
      user: 'user1',
      userName: 'Sarah',
      message: 'Just checked into our hotel! 🏨',
      timestamp: '2 min ago',
      type: 'location',
    },
    {
      id: '2',
      user: 'user2',
      userName: 'Mike',
      message: 'Amazing paella lunch - €45 total',
      timestamp: '15 min ago',
      type: 'expense',
    },
    {
      id: '3',
      user: 'user3',
      userName: 'Lisa',
      message: 'Sunset from Park Güell is incredible!',
      timestamp: '1 hour ago',
      type: 'photo',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: 'expense',
      title: 'Quick Expense',
      description: 'Log what you just spent',
      icon: Receipt,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => onNavigateToSection('expenses'),
    },
    {
      id: 'photo',
      title: 'Capture Moment',
      description: 'Share a photo or memory',
      icon: Camera,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => onNavigateToSection('photos'),
    },
    {
      id: 'location',
      title: 'Share Location',
      description: 'Let others know where you are',
      icon: Navigation,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => {},
    },
    {
      id: 'update',
      title: 'Post Update',
      description: 'Share what\'s happening',
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => onNavigateToSection('updates'),
    },
  ];

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'location':
        return <MapPin className="w-3 h-3 text-purple-500" />;
      case 'photo':
        return <Camera className="w-3 h-3 text-blue-500" />;
      case 'expense':
        return <Receipt className="w-3 h-3 text-green-500" />;
      default:
        return <MessageSquare className="w-3 h-3 text-orange-500" />;
    }
  };

  return (
    <div className={cn("space-y-6 pb-20", className)}>
      {/* Header with live status */}
      <div className="px-4 space-y-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <Badge className="bg-green-100 text-green-800 text-xs">
              Trip is Active
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Live from {tripName}
          </h1>
          <p className="text-gray-600 text-sm">
            You're currently exploring {currentLocation}
          </p>
        </div>

        {/* Trip vitals */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Day 2 of 5</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{tripMembers.length} active</span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            <span>Connected</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                onClick={action.action}
                variant="ghost"
                className={cn(
                  "h-auto p-4 flex flex-col items-center justify-center",
                  "text-left space-y-2 rounded-xl",
                  "transition-all duration-300 ease-spring",
                  "transform-gpu hover:scale-105 active:scale-95",
                  "hover:shadow-lg hover:shadow-orange-100",
                  "border border-gray-100 hover:border-orange-200",
                  "animate-in slide-in-from-bottom-4 duration-300",
                  `animation-delay-${index * 100}`
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "transition-all duration-300",
                  action.bgColor
                )}>
                  <Icon className={cn("w-6 h-6", action.color)} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm text-gray-900">
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Live Updates Feed */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Live Updates
          </h2>
          <Button size="sm" variant="ghost" className="text-orange-600">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        
        <div className="space-y-3">
          {liveUpdates.map((update, index) => (
            <Card 
              key={update.id}
              className={cn(
                "border border-gray-100 transition-all duration-300",
                "hover:shadow-md hover:border-orange-200",
                "animate-in slide-in-from-right-4 duration-300",
                `animation-delay-${index * 150}`
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {update.userName.charAt(0)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {update.userName}
                      </span>
                      {getUpdateIcon(update.type)}
                      <span className="text-xs text-gray-500">
                        {update.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {update.message}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Heart className="w-3 h-3 text-gray-400" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Share2 className="w-3 h-3 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Current Activity */}
      <div className="px-4">
        <Card className="border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-6 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">
                Make it memorable
              </h3>
              <p className="text-sm text-gray-600">
                Share what makes this moment special with your travel companions
              </p>
              <Button 
                size="sm"
                className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Capture This Moment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency/Important Info (collapsible) */}
      <div className="px-4">
        <Card className="border border-red-100 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-sm font-medium text-red-800">
                Emergency contacts and important info
              </span>
              <Button size="sm" variant="ghost" className="ml-auto h-6 text-red-600">
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}