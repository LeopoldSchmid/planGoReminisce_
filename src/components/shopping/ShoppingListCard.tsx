"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  ShoppingListWithItems,
  ShoppingListItemWithProfile,
  markItemAsPurchased,
  markItemAsUnpurchased,
  deleteShoppingListItem,
  addShoppingListItem,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingCart, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

interface ShoppingListCardProps {
  list: ShoppingListWithItems;
  tripMembers: Array<{ user_id: string; username: string | null; full_name: string | null; avatar_url?: string | null }>;
  canEdit: boolean;
}

interface AddItemFormData {
  name: string;
  quantity: number;
  unit: string;
  notes: string;
  category: string;
  assignedTo: string;
}

export function ShoppingListCard({ list, tripMembers, canEdit }: ShoppingListCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [addItemForm, setAddItemForm] = useState<AddItemFormData>({
    name: "",
    quantity: 1,
    unit: "",
    notes: "",
    category: "",
    assignedTo: "",
  });

  const addItemMutation = useMutation({
    mutationFn: (params: {
      listId: string;
      name: string;
      quantity?: number;
      unit?: string;
      notes?: string;
      category?: string;
      assignedTo?: string;
      userId: string;
    }) => addShoppingListItem(params),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to add item");
      } else {
        toast.success("Item added to shopping list!");
        queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
        setIsAddItemDialogOpen(false);
        setAddItemForm({
          name: "",
          quantity: 1,
          unit: "",
          notes: "",
          category: "",
          assignedTo: "",
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add item");
    },
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

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deleteShoppingListItem(itemId),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to delete item");
      } else {
        toast.success("Item deleted");
        queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete item");
    },
  });

  const handleAddItem = () => {
    if (!addItemForm.name.trim() || !user?.id) return;

    addItemMutation.mutate({
      listId: list.id,
      name: addItemForm.name.trim(),
      quantity: addItemForm.quantity || 1,
      unit: addItemForm.unit || undefined,
      notes: addItemForm.notes || undefined,
      category: addItemForm.category || undefined,
      assignedTo: addItemForm.assignedTo || undefined,
      userId: user.id,
    });
  };

  const handleTogglePurchased = (item: ShoppingListItemWithProfile) => {
    togglePurchasedMutation.mutate({
      itemId: item.id,
      isPurchased: !item.is_purchased,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const items = list.items || [];
  const purchasedItems = items.filter(item => item.is_purchased);
  const unpurchasedItems = items.filter(item => !item.is_purchased);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {list.name}
          </CardTitle>
          {list.description && (
            <CardDescription>{list.description}</CardDescription>
          )}
          <div className="text-sm text-gray-500 mt-1">
            {items.length} items • {purchasedItems.length} purchased
          </div>
        </div>
        {canEdit && (
          <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="min-h-[44px]">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Item to {list.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Item Name</label>
                  <Input
                    value={addItemForm.name}
                    onChange={(e) => setAddItemForm({ ...addItemForm, name: e.target.value })}
                    placeholder="e.g., Bread, Milk, Camping gear"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={addItemForm.quantity}
                      onChange={(e) => setAddItemForm({ ...addItemForm, quantity: parseFloat(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit</label>
                    <Input
                      value={addItemForm.unit}
                      onChange={(e) => setAddItemForm({ ...addItemForm, unit: e.target.value })}
                      placeholder="kg, pieces, bottles"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={addItemForm.category}
                    onChange={(e) => setAddItemForm({ ...addItemForm, category: e.target.value })}
                    placeholder="food, gear, toiletries"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Assign to</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={addItemForm.assignedTo}
                    onChange={(e) => setAddItemForm({ ...addItemForm, assignedTo: e.target.value })}
                  >
                    <option value="">Anyone</option>
                    {tripMembers.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.username || member.full_name || "Unnamed User"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={addItemForm.notes}
                    onChange={(e) => setAddItemForm({ ...addItemForm, notes: e.target.value })}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddItemDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddItem}
                    disabled={!addItemForm.name.trim() || addItemMutation.isPending}
                  >
                    {addItemMutation.isPending ? "Adding..." : "Add Item"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No items in this list yet.</p>
        ) : (
          <div className="space-y-4">
            {/* Unpurchased Items */}
            {unpurchasedItems.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  To Buy ({unpurchasedItems.length})
                </h4>
                <div className="space-y-2">
                  {unpurchasedItems.map((item) => (
                    <ShoppingListItem
                      key={item.id}
                      item={item}
                      canEdit={canEdit}
                      onTogglePurchased={() => handleTogglePurchased(item)}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Purchased Items */}
            {purchasedItems.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  Purchased ({purchasedItems.length})
                </h4>
                <div className="space-y-2">
                  {purchasedItems.map((item) => (
                    <ShoppingListItem
                      key={item.id}
                      item={item}
                      canEdit={canEdit}
                      onTogglePurchased={() => handleTogglePurchased(item)}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ShoppingListItemProps {
  item: ShoppingListItemWithProfile;
  canEdit: boolean;
  onTogglePurchased: () => void;
  onDelete: () => void;
}

function ShoppingListItem({ item, canEdit, onTogglePurchased, onDelete }: ShoppingListItemProps) {
  return (
    <div className={`flex items-center justify-between p-3 border rounded-lg ${item.is_purchased ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
      <div className="flex items-center space-x-3 flex-1">
        <Checkbox
          checked={item.is_purchased}
          onCheckedChange={onTogglePurchased}
          className="min-h-[20px] min-w-[20px]"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${item.is_purchased ? 'line-through text-gray-500' : ''}`}>
              {item.name}
            </span>
            {item.quantity && item.quantity !== 1 && (
              <Badge variant="secondary" className="text-xs">
                {item.quantity}{item.unit && ` ${item.unit}`}
              </Badge>
            )}
            {item.category && (
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
            )}
          </div>
          {item.notes && (
            <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {item.assigned_to_profile && (
              <div className="flex items-center gap-1">
                <span>Assigned to:</span>
                <span className="font-medium">
                  {item.assigned_to_profile.username || item.assigned_to_profile.full_name}
                </span>
              </div>
            )}
            {item.is_purchased && item.purchased_by_profile && (
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span>Bought by:</span>
                <span className="font-medium">
                  {item.purchased_by_profile.username || item.purchased_by_profile.full_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 min-h-[32px] min-w-[32px] p-1"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}