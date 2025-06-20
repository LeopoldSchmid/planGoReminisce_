"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Users, 
  ShoppingCart, 
  ChefHat,
  DollarSign,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanPhaseProps {
  tripId: string;
  tripName: string;
  tripMembers: Array<{ 
    user_id: string; 
    username: string | null; 
    full_name: string | null; 
    avatar_url?: string | null;
  }>;
  onNavigateToSection: (section: 'planning' | 'recipes' | 'shopping' | 'expenses') => void;
  className?: string;
}

interface PlanningCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  items?: number;
  action: string;
  color: string;
  bgColor: string;
}

export function PlanPhase({ 
  tripId, 
  tripName, 
  tripMembers, 
  onNavigateToSection,
  className 
}: PlanPhaseProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Mock data - in real implementation, this would come from props or queries
  const planningCards: PlanningCard[] = [
    {
      id: 'dates-destinations',
      title: 'Dates & Destinations',
      description: 'Set when and where you\'re going',
      icon: Calendar,
      status: 'in_progress',
      priority: 'high',
      items: 3,
      action: 'Review proposals',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'recipes',
      title: 'Meal Planning',
      description: 'Plan delicious meals together',
      icon: ChefHat,
      status: 'pending',
      priority: 'medium',
      items: 0,
      action: 'Add recipes',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'shopping',
      title: 'Shopping Lists',
      description: 'Organize what you need to bring',
      icon: ShoppingCart,
      status: 'pending',
      priority: 'medium',
      items: 0,
      action: 'Create lists',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'budget',
      title: 'Budget Planning',
      description: 'Estimate and track expenses',
      icon: DollarSign,
      status: 'pending',
      priority: 'low',
      items: 0,
      action: 'Set budget',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleCardClick = (cardId: string) => {
    if (cardId === 'dates-destinations') {
      onNavigateToSection('planning');
    } else if (cardId === 'recipes') {
      onNavigateToSection('recipes');
    } else if (cardId === 'shopping') {
      onNavigateToSection('shopping');
    } else if (cardId === 'budget') {
      onNavigateToSection('expenses');
    }
  };

  return (
    <div className={cn("space-y-6 pb-20", className)}>
      {/* Header */}
      <div className="text-center space-y-2 px-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Planning {tripName}
        </h1>
        <p className="text-gray-600 text-sm">
          Let's organize your amazing adventure together
        </p>
        
        {/* Members Preview */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {tripMembers.length} {tripMembers.length === 1 ? 'member' : 'members'}
          </span>
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {tripMembers.slice(0, 3).map((member, index) => (
              <div
                key={member.user_id}
                className={cn(
                  "w-6 h-6 rounded-full border-2 border-white",
                  "bg-gradient-to-br from-orange-400 to-pink-400",
                  "flex items-center justify-center text-xs font-medium text-white",
                  "shadow-sm"
                )}
                style={{ zIndex: tripMembers.length - index }}
              >
                {(member.username || member.full_name || 'U').charAt(0).toUpperCase()}
              </div>
            ))}
            {tripMembers.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                +{tripMembers.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Planning Cards */}
      <div className="px-4 space-y-4">
        {planningCards.map((card, index) => {
          const Icon = card.icon;
          const isExpanded = expandedCard === card.id;
          
          return (
            <Card 
              key={card.id}
              className={cn(
                "group cursor-pointer transition-all duration-300 ease-spring",
                "transform-gpu hover:scale-[1.02] active:scale-[0.98]",
                "hover:shadow-lg hover:shadow-orange-100",
                "border border-gray-100",
                isExpanded && "scale-[1.02] shadow-lg shadow-orange-100",
                "animate-in slide-in-from-bottom-4 duration-300",
                `animation-delay-${index * 100}`
              )}
              onClick={() => handleCardClick(card.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      "transition-all duration-300 group-hover:scale-110",
                      card.bgColor
                    )}>
                      <Icon className={cn("w-5 h-5", card.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900">
                        {card.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {card.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Status */}
                    <div className="flex items-center gap-1">
                      {getStatusIcon(card.status)}
                      <Badge className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        getStatusColor(card.status)
                      )}>
                        {card.status === 'completed' ? 'Done' : 
                         card.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                    
                    {/* Items count */}
                    {card.items > 0 && (
                      <span className="text-xs text-gray-500">
                        {card.items} item{card.items !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {/* Action button */}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className={cn(
                      "text-xs h-7 px-3 rounded-full",
                      "transition-all duration-200",
                      "hover:bg-orange-50 hover:text-orange-600",
                      "group-hover:bg-orange-100"
                    )}
                  >
                    {card.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <Card className="border-dashed border-2 border-gray-200 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-6 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">
                Need inspiration?
              </h3>
              <p className="text-sm text-gray-600">
                Browse popular destinations and get planning ideas from other travelers
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2 border-orange-200 text-orange-600 hover:bg-orange-100"
              >
                Explore Ideas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}