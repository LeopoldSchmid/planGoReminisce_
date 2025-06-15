"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  getRecipesForTrip,
  createRecipe,
  deleteRecipe,
  type RecipeIngredient,
  type RecipeWithIngredients, // Import RecipeWithIngredients
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
import type { Unit } from "@/types";
import { COMMON_UNITS } from "@/types";
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
  unit: Unit;
  notes: string;
  category: string;
  optional: boolean;
}

export function RecipesSection({ tripId, tripMembers, currentUserRole }: RecipesSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeWithIngredients | null>(null);
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
    unit: "" as Unit, // Default to empty string Unit
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

  const updateRecipeMutation = useMutation({
    mutationFn: (params: {
      recipeId: string;
      updates: {
        name: string;
        description: string;
        servings: number;
        prepTimeMinutes?: number; // Expect number now
        cookTimeMinutes?: number; // Expect number now
        instructions: string[];
        notes: string;
        ingredients: RecipeIngredient[]; 
      };
      userId: string;
    }) => updateRecipe(params), // Call the actual service function
    onSuccess: (result) => {
      if (result.error) {
        toast.error((result.error as Error).message || "Failed to update recipe");
      } else {
        toast.success("Recipe updated!");
        queryClient.invalidateQueries({ queryKey: ["recipes", tripId] });
        setIsEditDialogOpen(false);
        setEditingRecipe(null);
        resetCreateForm(); // Also reset form after editing
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update recipe");
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
      unit: "" as Unit, // Correctly type unit
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
      // unit is already of type Unit, ensure it's not empty if meant to be undefined
      unit: currentIngredient.unit || undefined, 
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

  const handleEditRecipeClick = (recipe: RecipeWithIngredients) => {
    setEditingRecipe(recipe);
    // Ensure ingredient quantities are strings for the form
    const ingredientsWithStrQuantity = recipe.ingredients.map(ing => ({
      ...ing,
      quantity: ing.quantity?.toString() || "",
      unit: (ing.unit || "") as Unit, // Ensure unit is Unit type
    }));

    setCreateForm({
      name: recipe.name,
      description: recipe.description || "",
      servings: recipe.servings,
      prepTimeMinutes: recipe.prep_time_minutes?.toString() || "",
      cookTimeMinutes: recipe.cook_time_minutes?.toString() || "",
      instructions: recipe.instructions && recipe.instructions.length > 0 ? recipe.instructions : [""],
      notes: recipe.notes || "",
      ingredients: ingredientsWithStrQuantity,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateRecipe = () => {
    if (!editingRecipe || !createForm.name.trim() || !user?.id) return;

    if (createForm.ingredients.length === 0) {
      toast.error("Please add at least one ingredient");
      return;
    }
    const filteredInstructions = createForm.instructions.filter(instruction => instruction.trim() !== "");

    // Convert ingredient quantities back to numbers and ensure unit is correct type
    const ingredientsForUpdate = createForm.ingredients.map(ing => ({
      ...ing,
      quantity: parseFloat(ing.quantity as string) || 0,
      // Ensure unit is string or undefined for the service call
      // The form uses Unit type, but the service might expect string or undefined
      unit: ing.unit ? ing.unit : undefined, 
    }));

    updateRecipeMutation.mutate({
      recipeId: editingRecipe.id,
      updates: {
        ...createForm,
        ingredients: ingredientsForUpdate,
        prepTimeMinutes: createForm.prepTimeMinutes ? parseInt(createForm.prepTimeMinutes, 10) : undefined,
        cookTimeMinutes: createForm.cookTimeMinutes ? parseInt(createForm.cookTimeMinutes, 10) : undefined,
        instructions: filteredInstructions.length > 0 ? filteredInstructions : [],
      },
      userId: user.id,
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
            <Dialog 
              open={editingRecipe ? isEditDialogOpen : isCreateDialogOpen} 
              onOpenChange={(isOpen) => {
                if (editingRecipe) {
                  setIsEditDialogOpen(isOpen);
                  if (!isOpen) setEditingRecipe(null); // Clear editing state when dialog closes
                } else {
                  setIsCreateDialogOpen(isOpen);
                }
                if (!isOpen) resetCreateForm(); // Reset form when any dialog closes
              }}
            >
              <DialogTrigger asChild>
                <Button className="min-h-[44px]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Recipe
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Recipe Name and Servings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="recipeName" className="text-sm font-medium">Recipe Name</label>
                      <Input
                        id="recipeName"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        placeholder="e.g., Spaghetti Carbonara"
                      />
                    </div>
                    <div>
                      <label htmlFor="servings" className="text-sm font-medium">Servings</label>
                      <Input
                        id="servings"
                        type="number"
                        min="1"
                        value={createForm.servings}
                        onChange={(e) => setCreateForm({ ...createForm, servings: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="text-sm font-medium">Description</label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Brief description of the recipe..."
                      rows={2}
                    />
                  </div>

                  {/* Prep Time and Cook Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="prepTime" className="text-sm font-medium">Prep Time (minutes)</label>
                      <Input
                        id="prepTime"
                        type="number"
                        min="0"
                        value={createForm.prepTimeMinutes}
                        onChange={(e) => setCreateForm({ ...createForm, prepTimeMinutes: e.target.value })}
                        placeholder="15"
                      />
                    </div>
                    <div>
                      <label htmlFor="cookTime" className="text-sm font-medium">Cook Time (minutes)</label>
                      <Input
                        id="cookTime"
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
                    <div className="space-y-3 mt-1">
                      {createForm.ingredients.length > 0 && (
                        <div className="space-y-2 max-h-32 overflow-y-auto border p-2 rounded-md">
                          {createForm.ingredients.map((ingredient, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-md">
                              <div className="flex-1">
                                <span className="font-medium text-sm">{ingredient.name}</span>
                                <span className="text-gray-600 dark:text-gray-400 ml-2 text-sm">
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
                                className="text-red-500 hover:text-red-700 p-1 h-auto"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Add ingredient form */}
                      <div className="border rounded-lg p-3 space-y-2 mt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Input
                            value={currentIngredient.name}
                            onChange={(e) => setCurrentIngredient({ ...currentIngredient, name: e.target.value })}
                            placeholder="Ingredient name"
                            className="sm:col-span-2"
                          />
                          <Input
                            type="text" // Use text to allow for fractions like 1/2, parse to number on add
                            value={currentIngredient.quantity}
                            onChange={(e) => setCurrentIngredient({ ...currentIngredient, quantity: e.target.value })}
                            placeholder="Qty"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                           <select
                            value={currentIngredient.unit}
                            onChange={(e) => setCurrentIngredient({ ...currentIngredient, unit: e.target.value as Unit })}
                            className="w-full p-2 border rounded-md text-sm h-[40px] bg-background"
                          >
                            <option value="">Unit</option>
                            {COMMON_UNITS.map((unitOption) => (
                              <option key={unitOption} value={unitOption}>
                                {unitOption}
                              </option>
                            ))}
                          </select>
                          <Input
                            value={currentIngredient.category}
                            onChange={(e) => setCurrentIngredient({ ...currentIngredient, category: e.target.value })}
                            placeholder="Category (opt.)"
                          />
                          <Input
                            value={currentIngredient.notes}
                            onChange={(e) => setCurrentIngredient({ ...currentIngredient, notes: e.target.value })}
                            placeholder="Notes (opt.)"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={currentIngredient.optional}
                              onChange={(e) => setCurrentIngredient({ ...currentIngredient, optional: e.target.checked })}
                              className="form-checkbox h-4 w-4 text-primary rounded"
                            />
                            Optional
                          </label>
                          <Button onClick={handleAddIngredient} type="button" variant="outline" size="sm" className="min-h-[36px]">
                            Add Ingredient
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instructions Section */}
                  <div>
                    <label className="text-sm font-medium">Instructions</label>
                    <div className="space-y-2 mt-1">
                      {createForm.instructions.map((instruction, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 min-w-[1.5rem] pt-px">{index + 1}.</span>
                          <Textarea
                            value={instruction}
                            onChange={(e) => handleInstructionChange(index, e.target.value)}
                            placeholder={`Step ${index + 1}...`}
                            rows={2}
                            className="flex-1 text-sm"
                          />
                          {createForm.instructions.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveInstruction(index)}
                              className="text-red-500 hover:text-red-700 mt-1 h-auto p-1"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button onClick={handleAddInstruction} variant="outline" size="sm" className="min-h-[36px]">
                        Add Step
                      </Button>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div>
                    <label htmlFor="notes" className="text-sm font-medium">Notes (optional)</label>
                    <Textarea
                      id="notes"
                      value={createForm.notes}
                      onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                      placeholder="Additional notes about the recipe..."
                      rows={2}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (editingRecipe) setIsEditDialogOpen(false); 
                        else setIsCreateDialogOpen(false);
                        resetCreateForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingRecipe ? handleUpdateRecipe : handleCreateRecipe}
                      disabled={!createForm.name.trim() || createForm.ingredients.length === 0 || createRecipeMutation.isPending || updateRecipeMutation.isPending}
                    >
                      {editingRecipe 
                        ? (updateRecipeMutation.isPending ? "Saving..." : "Save Changes") 
                        : (createRecipeMutation.isPending ? "Creating..." : "Create Recipe")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {recipes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ChefHat className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium mb-2">No recipes yet</p>
              <p className="text-sm mb-4">Create your first recipe to start planning meals for your trip.</p>
              {canEdit && (
                <Button 
                  onClick={() => {
                    resetCreateForm(); // Ensure form is fresh
                    setIsCreateDialogOpen(true);
                  }}
                  className="min-h-[44px]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Recipe
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  canEdit={canEdit}
                  onDelete={() => handleDeleteRecipe(recipe.id, recipe.name)}
                  onEdit={() => handleEditRecipeClick(recipe)} // Pass onEdit handler
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
