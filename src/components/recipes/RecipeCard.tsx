"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  addScaledRecipeToShoppingList,
  type RecipeWithIngredients,
  formatServings,
  formatCookTime,
  formatQuantity,
  scaleRecipe,
} from "@/services/recipeService";
import { getShoppingListsForTrip } from "@/services/shoppingListService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Users, 
  ShoppingCart, 
  Trash2,
  Eye,
  Pencil
} from "lucide-react";
import { toast } from "sonner";

interface RecipeCardProps {
  recipe: RecipeWithIngredients;
  canEdit: boolean;
  onDelete: () => void;
  onEdit: () => void;
}

export function RecipeCard({ recipe, canEdit, onDelete, onEdit }: RecipeCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddToShoppingOpen, setIsAddToShoppingOpen] = useState(false);
  const [targetServings, setTargetServings] = useState(recipe.servings);
  const [selectedShoppingList, setSelectedShoppingList] = useState("");

  // Get shopping lists for the trip
  const { data: shoppingListsData } = useQuery({
    queryKey: ["shoppingLists", recipe.trip_id],
    queryFn: () => getShoppingListsForTrip(recipe.trip_id),
    enabled: !!recipe.trip_id,
  });

  const addToShoppingMutation = useMutation({
    mutationFn: (params: {
      recipeId: string;
      shoppingListId: string;
      targetServings: number;
      userId: string;
    }) => addScaledRecipeToShoppingList(params),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to add recipe to shopping list");
      } else {
        toast.success(`Added ${result.addedItems} ingredients to shopping list!`);
        queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
        setIsAddToShoppingOpen(false);
        setSelectedShoppingList("");
        setTargetServings(recipe.servings);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add recipe to shopping list");
    },
  });

  const handleAddToShopping = () => {
    if (!selectedShoppingList || !user?.id) {
      toast.error("Please select a shopping list");
      return;
    }

    if (targetServings <= 0) {
      toast.error("Please enter a valid number of servings");
      return;
    }

    addToShoppingMutation.mutate({
      recipeId: recipe.id,
      shoppingListId: selectedShoppingList,
      targetServings,
      userId: user.id,
    });
  };

  const scaledRecipe = scaleRecipe(recipe, targetServings);
  const ingredients = recipe.ingredients || [];
  const shoppingLists = shoppingListsData?.lists || [];

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{recipe.name}</CardTitle>
            <CardDescription className="space-y-1">
              {recipe.description && <div>{recipe.description}</div>}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{formatServings(recipe.servings)}</span>
                </div>
                {totalTime > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatCookTime(recipe.prep_time_minutes || undefined, recipe.cook_time_minutes || undefined)}</span>
                  </div>
                )}
              </div>
            </CardDescription>
          </div>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-500 hover:text-red-700 min-h-[32px]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit} // Call onEdit prop
              className="text-blue-500 hover:text-blue-700 min-h-[32px] ml-1" // Added ml-1 for spacing
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Ingredients Preview */}
          <div>
            <div className="text-sm font-medium mb-2">Ingredients ({ingredients.length})</div>
            <div className="text-sm text-gray-600">
              {ingredients.slice(0, 3).map((ingredient, index) => (
                <span key={index}>
                  {ingredient.name}
                  {index < Math.min(2, ingredients.length - 1) && ", "}
                </span>
              ))}
              {ingredients.length > 3 && "..."}
            </div>
          </div>

          {/* End of Ingredients Preview div */}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-4">
            {/* View Recipe Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="min-h-[32px]">
                  <Eye className="mr-1 h-3 w-3" />
                  View Recipe
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{recipe.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {recipe.description && (
                    <p className="text-gray-600">{recipe.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="secondary">{formatServings(recipe.servings)}</Badge>
                    {totalTime > 0 && (
                      <Badge variant="outline">{formatCookTime(recipe.prep_time_minutes || undefined, recipe.cook_time_minutes || undefined)}</Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Ingredients</h4>
                    <ul className="space-y-1 text-sm">
                      {ingredients.map((ingredient, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{ingredient.name}</span>
                          <span className="text-gray-600">
                            {formatQuantity(ingredient.quantity, ingredient.unit || undefined)}
                            {ingredient.optional && " (optional)"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {recipe.instructions && recipe.instructions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Instructions</h4>
                      <ol className="space-y-2 text-sm">
                        {recipe.instructions.map((instruction, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="text-gray-500 min-w-[1.5rem]">{index + 1}.</span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {recipe.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-gray-600">{recipe.notes}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {shoppingLists.length > 0 && (
              <Dialog open={isAddToShoppingOpen} onOpenChange={setIsAddToShoppingOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-[32px]">
                    <ShoppingCart className="mr-1 h-3 w-3" />
                    Add to Shopping
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add {recipe.name} to Shopping List</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Number of Servings</label>
                      <Input
                        type="number"
                        min="1"
                        value={targetServings}
                        onChange={(e) => setTargetServings(parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Recipe is written for {recipe.servings} servings
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Shopping List</label>
                      <select
                        className="w-full p-2 border rounded-md mt-1"
                        value={selectedShoppingList}
                        onChange={(e) => setSelectedShoppingList(e.target.value)}
                      >
                        <option value="">Select a shopping list</option>
                        {shoppingLists.map((list) => (
                          <option key={list.id} value={list.id}>
                            {list.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {targetServings !== recipe.servings && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h5 className="font-medium text-sm mb-2">Scaled Ingredients Preview</h5>
                        <ul className="space-y-1 text-xs max-h-32 overflow-y-auto">
                          {scaledRecipe.scaledIngredients.slice(0, 5).map((ingredient, index) => (
                            <li key={index} className="flex justify-between">
                              <span>{ingredient.name}</span>
                              <span>
                                {formatQuantity(ingredient.scaledQuantity, ingredient.unit || undefined)}
                                <span className="text-gray-500 ml-1">
                                  (was {formatQuantity(ingredient.originalQuantity, ingredient.unit || undefined)})
                                </span>
                              </span>
                            </li>
                          ))}
                          {scaledRecipe.scaledIngredients.length > 5 && (
                            <li className="text-gray-500">
                              ...and {scaledRecipe.scaledIngredients.length - 5} more ingredients
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddToShoppingOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddToShopping}
                        disabled={!selectedShoppingList || addToShoppingMutation.isPending}
                      >
                        {addToShoppingMutation.isPending ? "Adding..." : "Add to List"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          {/* End of Add to Shopping List Dialog conditional rendering */}
      </CardFooter>
    </Card>
  );
}