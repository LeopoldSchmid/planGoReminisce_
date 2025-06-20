"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  getShoppingListsForTrip,
  createShoppingList,
  deleteShoppingList,
} from "@/services/shoppingListService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingListCard } from "./ShoppingListCard";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ShoppingListsSectionProps {
  tripId: string;
  tripMembers: Array<{ 
    user_id: string; 
    username: string | null; 
    full_name: string | null; 
    avatar_url?: string | null;
    role: string;
  }>;
  currentUserRole?: string;
}

interface CreateListFormData {
  name: string;
  description: string;
}

export function ShoppingListsSection({ tripId, tripMembers, currentUserRole }: ShoppingListsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateListFormData>({
    name: "",
    description: "",
  });

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'co-owner' || currentUserRole === 'member';

  const { data: listsData, isLoading, error } = useQuery({
    queryKey: ["shoppingLists", tripId],
    queryFn: () => getShoppingListsForTrip(tripId),
    enabled: !!tripId,
  });

  const createListMutation = useMutation({
    mutationFn: (params: {
      tripId: string;
      name: string;
      description?: string;
      userId: string;
    }) => createShoppingList(params),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to create shopping list");
      } else {
        toast.success("Shopping list created!");
        queryClient.invalidateQueries({ queryKey: ["shoppingLists", tripId] });
        setIsCreateDialogOpen(false);
        setCreateForm({ name: "", description: "" });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create shopping list");
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: (listId: string) => deleteShoppingList(listId),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to delete shopping list");
      } else {
        toast.success("Shopping list deleted");
        queryClient.invalidateQueries({ queryKey: ["shoppingLists", tripId] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete shopping list");
    },
  });

  const handleCreateList = () => {
    if (!createForm.name.trim() || !user?.id) return;

    createListMutation.mutate({
      tripId,
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
      userId: user.id,
    });
  };

  const handleDeleteList = (listId: string, listName: string) => {
    if (confirm(`Are you sure you want to delete the shopping list "${listName}"? This will also delete all items in the list.`)) {
      deleteListMutation.mutate(listId);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading shopping lists..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500 text-center">
            Error loading shopping lists: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const lists = listsData?.lists || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Lists
            </CardTitle>
            <CardDescription>
              Organize what you need to buy for your trip
            </CardDescription>
          </div>
          {canEdit && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="min-h-[44px]">
                  <Plus className="mr-2 h-4 w-4" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Shopping List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">List Name</label>
                    <Input
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g., Groceries, Camping Gear, Toiletries"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (optional)</label>
                    <Textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="What this list is for..."
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateList}
                      disabled={!createForm.name.trim() || createListMutation.isPending}
                    >
                      {createListMutation.isPending ? "Creating..." : "Create List"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {lists.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No shopping lists yet</p>
              <p className="text-sm mb-4">Create your first shopping list to start organizing what you need for your trip.</p>
              {canEdit && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="min-h-[44px]">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First List
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {lists.length} shopping {lists.length === 1 ? 'list' : 'lists'} for this trip
              </div>
              {(() => {
                const totalItems = lists.reduce((sum, list) => sum + list.items.length, 0);
                const purchasedItems = lists.reduce((sum, list) => 
                  sum + list.items.filter(item => item.is_purchased).length, 0
                );
                const completionRate = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0;
                
                return totalItems > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className={`font-medium ${
                        completionRate === 100 ? 'text-success' :
                        completionRate > 0 ? 'text-warning' : 'text-muted-foreground'
                      }`}>
                        {Math.round(completionRate)}% ({purchasedItems}/{totalItems} items)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          completionRate === 100 ? 'bg-success' :
                          completionRate > 0 ? 'bg-warning' : 'bg-muted'
                        }`}
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Shopping Lists */}
      {lists.map((list) => (
        <div key={list.id} className="relative">
          {canEdit && (
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteList(list.id, list.name)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[32px] min-w-[32px] p-1"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <ShoppingListCard
            list={list}
            tripMembers={tripMembers}
            canEdit={canEdit}
          />
        </div>
      ))}
    </div>
  );
}