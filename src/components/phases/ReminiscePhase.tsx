"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Heart, 
  Star, 
  Download,
  Share2,
  FileText,
  BarChart3,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Smile,
  Gift,
  Play,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReminiscePhaseProps {
  tripId: string;
  tripName: string;
  tripMembers: Array<{ 
    user_id: string; 
    username: string | null; 
    full_name: string | null; 
    avatar_url?: string | null;
  }>;
  onNavigateToSection: (section: 'photos' | 'expenses' | 'summary') => void;
  className?: string;
}

interface Memory {
  id: string;
  type: 'photo' | 'moment' | 'expense';
  title: string;
  description: string;
  author: string;
  timestamp: string;
  likes: number;
  image?: string;
  location?: string;
}

interface TripStats {
  duration: string;
  totalCost: string;
  photosShared: number;
  momentsCreated: number;
  destinationsVisited: number;
}

export function ReminiscePhase({ 
  tripId, 
  tripName, 
  tripMembers, 
  onNavigateToSection,
  className 
}: ReminiscePhaseProps) {
  const [selectedMemoryType, setSelectedMemoryType] = useState<'all' | 'photos' | 'moments'>('all');
  
  // Mock data - in real implementation, this would come from trip data
  const tripStats: TripStats = {
    duration: '5 days',
    totalCost: '$1,247',
    photosShared: 127,
    momentsCreated: 23,
    destinationsVisited: 8,
  };

  const memories: Memory[] = [
    {
      id: '1',
      type: 'photo',
      title: 'Sunset at Park Güell',
      description: 'The most incredible sunset view over Barcelona',
      author: 'Sarah',
      timestamp: '3 days ago',
      likes: 12,
      location: 'Barcelona, Spain',
    },
    {
      id: '2',
      type: 'moment',
      title: 'Found the best tapas place',
      description: 'Hidden gem recommended by our taxi driver - amazing tortilla española!',
      author: 'Mike',
      timestamp: '3 days ago',
      likes: 8,
      location: 'Barcelona, Spain',
    },
    {
      id: '3',
      type: 'photo',
      title: 'Beach day at Barceloneta',
      description: 'Perfect weather for a beach day with the crew',
      author: 'Lisa',
      timestamp: '2 days ago',
      likes: 15,
      location: 'Barceloneta Beach',
    },
  ];

  const memoryActions = [
    {
      id: 'photo_album',
      title: 'Photo Album',
      description: 'View all shared photos',
      icon: Camera,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      count: tripStats.photosShared,
      action: () => onNavigateToSection('photos'),
    },
    {
      id: 'trip_summary',
      title: 'Trip Summary',
      description: 'Complete expense report',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      count: null,
      action: () => onNavigateToSection('summary'),
    },
    {
      id: 'create_video',
      title: 'Memory Video',
      description: 'Create trip highlight reel',
      icon: Play,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      count: null,
      action: () => {},
    },
    {
      id: 'share_album',
      title: 'Share Memories',
      description: 'Share with friends & family',
      icon: Share2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      count: null,
      action: () => {},
    },
  ];

  const filteredMemories = memories.filter(memory => 
    selectedMemoryType === 'all' || memory.type === selectedMemoryType
  );

  const getMemoryIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
      case 'moment':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'expense':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      default:
        return <Heart className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className={cn("space-y-6 pb-20", className)}>
      {/* Header */}
      <div className="px-4 space-y-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tripName} Memories
          </h1>
          <p className="text-gray-600 text-sm">
            Relive the amazing moments from your adventure
          </p>
        </div>

        {/* Trip Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-900">{tripStats.duration}</p>
            <p className="text-xs text-blue-700">Duration</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-900">{tripStats.totalCost}</p>
            <p className="text-xs text-green-700">Total Cost</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <Camera className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-900">{tripStats.photosShared}</p>
            <p className="text-xs text-purple-700">Photos</p>
          </div>
        </div>
      </div>

      {/* Memory Actions */}
      <div className="px-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Create & Share
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {memoryActions.map((action, index) => {
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
                  "w-12 h-12 rounded-xl flex items-center justify-center relative",
                  "transition-all duration-300",
                  action.bgColor
                )}>
                  <Icon className={cn("w-6 h-6", action.color)} />
                  {action.count && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {action.count > 99 ? '99+' : action.count}
                      </span>
                    </div>
                  )}
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

      {/* Memory Filter */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Memories
          </h2>
          <div className="flex gap-1 ml-auto">
            {['all', 'photos', 'moments'].map((type) => (
              <Button
                key={type}
                size="sm"
                variant={selectedMemoryType === type ? "default" : "ghost"}
                onClick={() => setSelectedMemoryType(type as 'all' | 'photos' | 'moments')}
                className={cn(
                  "h-7 px-3 text-xs rounded-full transition-all duration-200",
                  selectedMemoryType === type && "bg-orange-500 hover:bg-orange-600"
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Memory Feed */}
        <div className="space-y-3">
          {filteredMemories.map((memory, index) => (
            <Card 
              key={memory.id}
              className={cn(
                "border border-gray-100 transition-all duration-300",
                "hover:shadow-md hover:border-orange-200",
                "animate-in slide-in-from-left-4 duration-300",
                `animation-delay-${index * 150}`
              )}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getMemoryIcon(memory.type)}
                      <div>
                        <h3 className="font-medium text-sm text-gray-900">
                          {memory.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          by {memory.author} • {memory.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-red-500">
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">{memory.likes}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-gray-700">
                    {memory.description}
                  </p>

                  {/* Location */}
                  {memory.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{memory.location}</span>
                    </div>
                  )}

                  {/* Mock image placeholder for photos */}
                  {memory.type === 'photo' && (
                    <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-orange-400" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      <Heart className="w-3 h-3 mr-1" />
                      Like
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                    {memory.type === 'photo' && (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Memory Prompt */}
      <div className="px-4">
        <Card className="border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-6 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Smile className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">
                Share a favorite memory
              </h3>
              <p className="text-sm text-gray-600">
                Add your favorite moment from this trip to keep the memories alive
              </p>
              <Button 
                size="sm"
                className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Add Memory
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}