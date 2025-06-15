"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import type { Unit } from "@/types";
import { COMMON_UNITS } from "@/types";
import {
  getShoppingListsForTrip,
  markItemAsPurchased,
  markItemAsUnpurchased,
} from "@/services/shoppingListService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { 
  ShoppingCart, 
  Search,
  Check,
  Package,
  List
} from "lucide-react";
import { toast } from "sonner";

interface AggregatedShoppingViewProps {
  tripId: string;
  tripMembers: Array<{ 
    user_id: string; 
    username: string | null; 
    full_name: string | null; 
  }>;
}

interface AggregatedItem {
  id: string; // Now the aggregation key (e.g., "apples_kg")
  name: string;
  totalQuantity: number;
  unit: Unit;
  category: string | null;
  isPurchased: boolean;
  sources: Array<{
    listName: string;
    quantity: number;
    unit: Unit;
    itemId: string; // Original shopping_list_item.id
    notes?: string | null;
    assignedTo?: string | null;
    fromRecipe?: boolean;
  }>;
}

type SortOption = 'name' | 'category' | 'status' | 'quantity';
type FilterOption = 'all' | 'pending' | 'purchased' | 'recipes';

export function AggregatedShoppingView({ tripId, tripMembers }: AggregatedShoppingViewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const { data: listsData, isLoading, error } = useQuery({
    queryKey: ["shoppingLists", tripId],
    queryFn: () => getShoppingListsForTrip(tripId),
    enabled: !!tripId,
  });

  const togglePurchasedMutation = useMutation({
    mutationFn: ({ itemId, isPurchased }: { itemId: string; isPurchased: boolean }) => {
      if (isPurchased && user?.id) {
        return markItemAsPurchased(itemId, user.id);
      } else {
        return markItemAsUnpurchased(itemId);
      }
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to update item");
      } else {
        queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update item");
    },
  });

  // Helper to normalize and validate units
  const toSafeUnit = (dbUnit: string | null): Unit => {
    const lowerUnit = dbUnit?.toLowerCase() || "";
    // Check if lowerUnit is one of the known COMMON_UNITS
    if ((COMMON_UNITS as readonly string[]).includes(lowerUnit)) {
      return lowerUnit as Unit;
    }
    return "" as Unit; // Fallback to empty string Unit if not found or invalid
  };

  // Aggregate items from all shopping lists
  const aggregatedItems = useMemo(() => {
    if (!listsData?.lists) return [];

    const itemMap = new Map<string, AggregatedItem>();

    listsData.lists.forEach(list => {
      list.items?.forEach(item => {
        const normalizedItemName = item.name.toLowerCase();
        const currentItemUnit = toSafeUnit(item.unit);
        
        const key = `${normalizedItemName}_${currentItemUnit}`;
        
        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!;
          existing.totalQuantity += item.quantity || 0;
          existing.sources.push({
            listName: list.name,
            quantity: item.quantity || 0,
            unit: currentItemUnit, // Use normalized unit
            itemId: item.id,
            notes: item.notes,
            assignedTo: item.assigned_to,
            fromRecipe: !!item.notes?.toLowerCase().includes("from recipe"), // Basic recipe detection from notes
          });
          // If any source is purchased, mark the aggregated item as purchased
          if (item.is_purchased) {
            existing.isPurchased = true;
          }
        } else {
          itemMap.set(key, {
            id: key, // Use the aggregation key as the ID for the aggregated item
            name: item.name, // Keep original name for display
            totalQuantity: item.quantity || 0,
            unit: currentItemUnit, // Use normalized unit
            category: item.category,
            isPurchased: item.is_purchased,
            sources: [{
              listName: list.name,
              quantity: item.quantity || 0,
              unit: currentItemUnit, // Use normalized unit
              itemId: item.id,
              notes: item.notes,
              assignedTo: item.assigned_to,
              fromRecipe: !!item.notes?.toLowerCase().includes("from recipe"), // Basic recipe detection
            }],
          });
        }
      });
    });

    return Array.from(itemMap.values());
  }, [listsData]);

  // Filter and sort items
  const processedItems = useMemo(() => {
    let filtered = aggregatedItems;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    switch (filterBy) {
      case 'pending':
        filtered = filtered.filter(item => !item.isPurchased);
        break;
      case 'purchased':
        filtered = filtered.filter(item => item.isPurchased);
        break;
      case 'recipes':
        filtered = filtered.filter(item => 
          item.sources.some(source => source.fromRecipe)
        );
        break;
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return (a.category || 'Uncategorized').localeCompare(b.category || 'Uncategorized');
        case 'status':
          return a.isPurchased === b.isPurchased ? 0 : a.isPurchased ? 1 : -1;
        case 'quantity':
          return b.totalQuantity - a.totalQuantity;
        default:
          return 0;
      }
    });

    return filtered;
  }, [aggregatedItems, searchTerm, filterBy, sortBy]);

  // Group by category
  const groupedItems = useMemo(() => {
    const groups = new Map<string, AggregatedItem[]>();
    
    processedItems.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [processedItems]);

  const handleTogglePurchased = (item: AggregatedItem) => {
    // For now, toggle the first source item
    // In a more sophisticated implementation, we could track individual source purchases
    const firstSource = item.sources[0];
    if (firstSource) {
      togglePurchasedMutation.mutate({
        itemId: firstSource.itemId,
        isPurchased: !item.isPurchased,
      });
    }
  };


  if (isLoading) {
    return <LoadingSpinner message="Loading shopping items..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500 text-center">
            Error loading shopping items: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalItems = aggregatedItems.length;
  const purchasedItems = aggregatedItems.filter(item => item.isPurchased).length;
  const pendingItems = totalItems - purchasedItems;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchased</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{purchasedItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Shopping List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Aggregated Shopping List
              </CardTitle>
              <CardDescription>
                All items from your shopping lists combined for easy shopping
              </CardDescription>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items..."
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Items</option>
                <option value="pending">Pending</option>
                <option value="purchased">Purchased</option>
                <option value="recipes">From Recipes</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="category">Sort by Category</option>
                <option value="name">Sort by Name</option>
                <option value="status">Sort by Status</option>
                <option value="quantity">Sort by Quantity</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {totalItems === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No shopping items yet</p>
              <p className="text-sm">Add items to your shopping lists or create recipes to see them here.</p>
            </div>
          ) : processedItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No items match your search</p>
              <p className="text-sm">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedItems.map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-medium text-gray-700 mb-3 border-b pb-1">
                    {category} ({items.length})
                  </h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          item.isPurchased ? 'bg-gray-50 opacity-75' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <Checkbox
                            checked={item.isPurchased}
                            onCheckedChange={() => handleTogglePurchased(item)}
                            className="min-h-[20px] min-w-[20px]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium ${item.isPurchased ? 'line-through text-gray-500' : ''}`}>
                                {item.name}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {item.totalQuantity}{item.unit && ` ${item.unit}`}
                              </Badge>
                              {item.sources.length > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  {item.sources.length} lists
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              From: {item.sources.map(source => source.listName).join(", ")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}