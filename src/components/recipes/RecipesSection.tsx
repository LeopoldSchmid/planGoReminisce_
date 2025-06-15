"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  getRecipesForTrip,
  createRecipe,
  deleteRecipe,
  type RecipeIngredient,
} from "@/services/recipeService";
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
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { RecipeCard } from "./RecipeCard";
import { Plus, ChefHat } from "lucide-react";
import { toast } from "sonner";

interface RecipesSectionProps {
  tripId: string;
  tripMembers: Array<{ 
    user_id: string; 
    username: string | null; 
    full_name: string | null; 
  }>;
  currentUserRole?: string;
}

interface CreateRecipeFormData {
  name: string;
  description: string;
  servings: number;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  instructions: string[];
  notes: string;
  ingredients: RecipeIngredient[];
}

interface IngredientFormData {
  name: string;
  quantity: string;
  unit: string;
  notes: string;
  category: string;
  optional: boolean;
}

export function RecipesSection({ tripId, tripMembers, currentUserRole }: RecipesSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRecipeFormData>({
    name: "",
    description: "",
    servings: 4,
    prepTimeMinutes: "",
    cookTimeMinutes: "",
    instructions: [""],
    notes: "",
    ingredients: [],
  });
  const [currentIngredient, setCurrentIngredient] = useState<IngredientFormData>({
    name: "",
    quantity: "",
    unit: "",
    notes: "",
    category: "",
    optional: false,
  });

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'co-owner' || currentUserRole === 'member';

  const { data: recipesData, isLoading, error } = useQuery({
    queryKey: ["recipes", tripId],
    queryFn: () => getRecipesForTrip(tripId),
    enabled: !!tripId,
  });

  const createRecipeMutation = useMutation({
    mutationFn: (params: {
      tripId: string;
      name: string;
      description?: string;
      servings: number;
      prepTimeMinutes?: number;
      cookTimeMinutes?: number;
      instructions?: string[];
      notes?: string;
      ingredients: RecipeIngredient[];
      userId: string;
    }) => createRecipe(params),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to create recipe");
      } else {
        toast.success("Recipe created!");
        queryClient.invalidateQueries({ queryKey: ["recipes", tripId] });
        setIsCreateDialogOpen(false);
        resetCreateForm();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create recipe");
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: (recipeId: string) => deleteRecipe(recipeId),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to delete recipe");
      } else {
        toast.success("Recipe deleted");
        queryClient.invalidateQueries({ queryKey: ["recipes", tripId] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete recipe");
    },
  });

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      description: "",
      servings: 4,
      prepTimeMinutes: "",
      cookTimeMinutes: "",
      instructions: [""],
      notes: "",
      ingredients: [],
    });
    setCurrentIngredient({
      name: "",
      quantity: "",
      unit: "",
      notes: "",
      category: "",
      optional: false,
    });
  };

  const handleCreateRecipe = () => {
    if (!createForm.name.trim() || !user?.id) return;

    if (createForm.ingredients.length === 0) {
      toast.error("Please add at least one ingredient");
      return;
    }

    const filteredInstructions = createForm.instructions.filter(instruction => instruction.trim() !== "");

    createRecipeMutation.mutate({
      tripId,
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
      servings: createForm.servings,
      prepTimeMinutes: createForm.prepTimeMinutes ? parseInt(createForm.prepTimeMinutes) : undefined,
      cookTimeMinutes: createForm.cookTimeMinutes ? parseInt(createForm.cookTimeMinutes) : undefined,
      instructions: filteredInstructions.length > 0 ? filteredInstructions : undefined,
      notes: createForm.notes.trim() || undefined,
      ingredients: createForm.ingredients,
      userId: user.id,
    });
  };

  const handleDeleteRecipe = (recipeId: string, recipeName: string) => {
    if (confirm(`Are you sure you want to delete the recipe "${recipeName}"? This will also remove it from any meal plans.`)) {
      deleteRecipeMutation.mutate(recipeId);
    }
  };

  const handleAddIngredient = () => {
    if (!currentIngredient.name.trim() || !currentIngredient.quantity) {
      toast.error("Please enter ingredient name and quantity");
      return;
    }

    const quantity = parseFloat(currentIngredient.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const newIngredient: RecipeIngredient = {
      name: currentIngredient.name.trim(),
      quantity,
      unit: currentIngredient.unit.trim() || undefined,
      notes: currentIngredient.notes.trim() || undefined,
      category: currentIngredient.category.trim() || undefined,
      optional: currentIngredient.optional,
    };

    setCreateForm({
      ...createForm,
      ingredients: [...createForm.ingredients, newIngredient],
    });

    setCurrentIngredient({
      name: "",
      quantity: "",
      unit: "",
      notes: "",
      category: "",
      optional: false,
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setCreateForm({
      ...createForm,
      ingredients: createForm.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...createForm.instructions];
    newInstructions[index] = value;
    setCreateForm({ ...createForm, instructions: newInstructions });
  };

  const handleAddInstruction = () => {
    setCreateForm({
      ...createForm,
      instructions: [...createForm.instructions, ""],
    });
  };

  const handleRemoveInstruction = (index: number) => {
    if (createForm.instructions.length > 1) {
      setCreateForm({
        ...createForm,
        instructions: createForm.instructions.filter((_, i) => i !== index),
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading recipes..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500 text-center">
            Error loading recipes: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recipes = recipesData?.recipes || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Recipes
            </CardTitle>
            <CardDescription>
              Create and manage recipes for your trip meals
            </CardDescription>
          </div>
          {canEdit && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="min-h-[44px]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Recipe
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Recipe</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Recipe Name</label>
                      <Input
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        placeholder="e.g., Spaghetti Carbonara"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Servings</label>
                      <Input
                        type="number"
                        min="1"
                        value={createForm.servings}
                        onChange={(e) => setCreateForm({ ...createForm, servings: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Brief description of the recipe..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Prep Time (minutes)</label>
                      <Input
                        type="number"
                        min="0"
                        value={createForm.prepTimeMinutes}
                        onChange={(e) => setCreateForm({ ...createForm, prepTimeMinutes: e.target.value })}
                        placeholder="15"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Cook Time (minutes)</label>
                      <Input
                        type="number"
                        min="0"
                        value={createForm.cookTimeMinutes}
                        onChange={(e) => setCreateForm({ ...createForm, cookTimeMinutes: e.target.value })}
                        placeholder="20"
                      />
                    </div>
                  </div>

                  {/* Ingredients Section */}
                  <div>
                    <label className="text-sm font-medium">Ingredients</label>
                    <div className="space-y-3 mt-2">
                      {/* Current ingredients list */}
                      {createForm.ingredients.length > 0 && (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {createForm.ingredients.map((ingredient, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="flex-1">
                                <span className="font-medium">{ingredient.name}</span>
                                <span className="text-gray-600 ml-2">
                                  {ingredient.quantity}{ingredient.unit && ` ${ingredient.unit}`}
                                </span>
                                {ingredient.optional && (
                                  <Badge variant="outline" className="ml-2 text-xs">optional</Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveIngredient(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add ingredient form */}
                      <div className="border rounded-lg p-3 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={currentIngredient.name}
                            onChange={(e) => setCurrentIngredient({ ...currentIngredient, name: e.target.value })}
                            placeholder="Ingredient name"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={currentIngredient.quantity}
                            onChange={(e) => setCurrentIngredient({ ...currentIngredient, quantity: e.target.value })}
                            placeholder="Quantity"
                          />
                          <Input
                            value={currentIngredient.unit}
                            onChange={(e) => setCurrentIngredient({ ...currentIngredient, unit: e.target.value })}
                            placeholder="Unit (g, cups, etc.)"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={currentIngredient.category}
                            onChange={(e) => setCurrentIngredient({ ...currentIngredient, category: e.target.value })}
                            placeholder="Category (optional)"
                          />
                          <Input
                            value={currentIngredient.notes}
                            onChange={(e) => setCurrentIngredient({ ...currentIngredient, notes: e.target.value })}
                            placeholder="Notes (optional)"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={currentIngredient.optional}
                              onChange={(e) => setCurrentIngredient({ ...currentIngredient, optional: e.target.checked })}
                            />
                            Optional ingredient
                          </label>
                          <Button onClick={handleAddIngredient} size="sm">
                            Add Ingredient
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instructions Section */}
                  <div>
                    <label className="text-sm font-medium">Instructions</label>
                    <div className="space-y-2 mt-2">
                      {createForm.instructions.map((instruction, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-sm text-gray-500 mt-2 min-w-[1.5rem]">{index + 1}.</span>
                          <Textarea
                            value={instruction}
                            onChange={(e) => handleInstructionChange(index, e.target.value)}
                            placeholder={`Step ${index + 1}...`}
                            rows={2}
                            className="flex-1"
                          />
                          {createForm.instructions.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveInstruction(index)}
                              className="text-red-500 hover:text-red-700 mt-1"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button onClick={handleAddInstruction} variant="outline" size="sm">
                        Add Step
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={createForm.notes}
                      onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                      placeholder="Additional notes about the recipe..."
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateRecipe}
                      disabled={!createForm.name.trim() || createForm.ingredients.length === 0 || createRecipeMutation.isPending}
                    >
                      {createRecipeMutation.isPending ? "Creating..." : "Create Recipe"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {recipes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ChefHat className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No recipes yet</p>
              <p className="text-sm mb-4">Create your first recipe to start planning meals for your trip.</p>
              {canEdit && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="min-h-[44px]">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Recipe
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  canEdit={canEdit}
                  onDelete={() => handleDeleteRecipe(recipe.id, recipe.name)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}