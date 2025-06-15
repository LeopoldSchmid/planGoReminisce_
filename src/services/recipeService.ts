import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import type { Unit } from '@/types';

const supabase = createSupabaseBrowserClient();

// Types
type RecipeRow = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
type RecipeIngredientRow = Database['public']['Tables']['recipe_ingredients']['Row'];
type RecipeIngredientInsert = Database['public']['Tables']['recipe_ingredients']['Insert'];
type MealPlanRow = Database['public']['Tables']['meal_plans']['Row'];
type MealPlanInsert = Database['public']['Tables']['meal_plans']['Insert'];

export interface RecipeWithIngredients extends RecipeRow {
  ingredients?: RecipeIngredientRow[];
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit?: Unit;
  notes?: string;
  category?: string;
  optional?: boolean;
}

export interface ScaledIngredient extends RecipeIngredient {
  scaledQuantity: number;
  originalQuantity: number;
}

// Recipe CRUD Operations

export async function getRecipesForTrip(tripId: string): Promise<{
  recipes: RecipeWithIngredients[] | null;
  error: any;
}> {
  try {
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(*)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (recipesError) {
      console.error('Error fetching recipes:', recipesError);
      return { recipes: null, error: recipesError };
    }

    return { recipes: recipes || [], error: null };
  } catch (err: unknown) {
    console.error('Unexpected error fetching recipes:', err);
    return { recipes: null, error: { message: (err as Error).message } };
  }
}

export async function createRecipe(params: {
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
}): Promise<{ recipe: RecipeRow | null; error: any }> {
  try {
    // Create the recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        trip_id: params.tripId,
        name: params.name,
        description: params.description || null,
        servings: params.servings,
        prep_time_minutes: params.prepTimeMinutes || null,
        cook_time_minutes: params.cookTimeMinutes || null,
        instructions: params.instructions || null,
        notes: params.notes || null,
        created_by: params.userId,
      } as RecipeInsert)
      .select()
      .single();

    if (recipeError) {
      console.error('Error creating recipe:', recipeError);
      return { recipe: null, error: recipeError };
    }

    // Create the ingredients
    if (params.ingredients.length > 0) {
      const ingredientInserts = params.ingredients.map((ingredient, index) => ({
        recipe_id: recipe.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit || null,
        notes: ingredient.notes || null,
        category: ingredient.category || null,
        optional: ingredient.optional || false,
        order_index: index,
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientInserts);

      if (ingredientsError) {
        console.error('Error creating recipe ingredients:', ingredientsError);
        // Should rollback the recipe creation in a real implementation
        return { recipe: null, error: ingredientsError };
      }
    }

    return { recipe, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error creating recipe:', err);
    return { recipe: null, error: { message: (err as Error).message } };
  }
}

export async function updateRecipe(params: {
  recipeId: string;
  updates: {
    name?: string;
    description?: string;
    servings?: number;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    instructions?: string[];
    notes?: string;
    ingredients: RecipeIngredient[]; // Added ingredients to updates
  };
  // userId?: string; // Optional: if you want to track who updated
}): Promise<{ recipe: RecipeWithIngredients | null; error: any }> {
  try {
    // 1. Update core recipe details
    const recipeCoreUpdates = {
      name: params.updates.name,
      description: params.updates.description,
      servings: params.updates.servings,
      prep_time_minutes: params.updates.prepTimeMinutes,
      cook_time_minutes: params.updates.cookTimeMinutes,
      instructions: params.updates.instructions,
      notes: params.updates.notes,
      // updated_at will be handled by Supabase, add updated_by if needed
      // updated_by: params.userId,
    };

    const { data: updatedRecipeData, error: recipeUpdateError } = await supabase
      .from('recipes')
      .update(recipeCoreUpdates)
      .eq('id', params.recipeId)
      .select()
      .single();

    if (recipeUpdateError) {
      console.error('Error updating core recipe details:', recipeUpdateError);
      return { recipe: null, error: recipeUpdateError };
    }

    if (!updatedRecipeData) {
      return { recipe: null, error: { message: 'Recipe not found after update.' } };
    }

    // 2. Delete existing ingredients for this recipe
    const { error: deleteIngredientsError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', params.recipeId);

    if (deleteIngredientsError) {
      console.error('Error deleting existing recipe ingredients:', deleteIngredientsError);
      // Potentially rollback recipe update or handle inconsistency
      return { recipe: updatedRecipeData, error: deleteIngredientsError }; // Return updated recipe but with ingredient error
    }

    // 3. Insert new/updated ingredients
    let newIngredientsData: RecipeIngredientRow[] = [];
    if (params.updates.ingredients && params.updates.ingredients.length > 0) {
      const ingredientInserts: RecipeIngredientInsert[] = params.updates.ingredients.map((ingredient, index) => ({
        recipe_id: params.recipeId,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit || null,
        notes: ingredient.notes || null,
        category: ingredient.category || null,
        optional: ingredient.optional || false,
        order_index: index, // Maintain order from the form
      }));

      const { data: insertedIngredients, error: ingredientsInsertError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientInserts)
        .select();

      if (ingredientsInsertError) {
        console.error('Error inserting new recipe ingredients:', ingredientsInsertError);
        // Recipe core details were updated, but ingredients failed.
        return { 
          recipe: { ...updatedRecipeData, ingredients: [] }, 
          error: ingredientsInsertError 
        };
      }
      newIngredientsData = insertedIngredients || [];
    }

    // Return the updated recipe with its new ingredients
    return { 
      recipe: { ...updatedRecipeData, ingredients: newIngredientsData }, 
      error: null 
    };
  } catch (err: unknown) {
    console.error('Unexpected error updating recipe:', err);
    return { recipe: null, error: { message: (err as Error).message } };
  }
}

export async function deleteRecipe(recipeId: string): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) {
      console.error('Error deleting recipe:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error deleting recipe:', err);
    return { success: false, error: { message: (err as Error).message } };
  }
}

// Recipe Ingredient Operations

export async function updateRecipeIngredient(
  ingredientId: string,
  updates: {
    name?: string;
    quantity?: number;
    unit?: Unit;
    notes?: string;
    category?: string;
    optional?: boolean;
  }
): Promise<{ ingredient: RecipeIngredientRow | null; error: any }> {
  try {
    const { data: ingredient, error } = await supabase
      .from('recipe_ingredients')
      .update(updates)
      .eq('id', ingredientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating recipe ingredient:', error);
      return { ingredient: null, error };
    }

    return { ingredient, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error updating recipe ingredient:', err);
    return { ingredient: null, error: { message: (err as Error).message } };
  }
}

export async function addRecipeIngredient(params: {
  recipeId: string;
  name: string;
  quantity: number;
  unit?: Unit;
  notes?: string;
  category?: string;
  optional?: boolean;
}): Promise<{ ingredient: RecipeIngredientRow | null; error: any }> {
  try {
    // Get the next order index
    const { data: existingIngredients } = await supabase
      .from('recipe_ingredients')
      .select('order_index')
      .eq('recipe_id', params.recipeId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = existingIngredients && existingIngredients.length > 0 
      ? existingIngredients[0].order_index + 1 
      : 0;

    const { data: ingredient, error } = await supabase
      .from('recipe_ingredients')
      .insert({
        recipe_id: params.recipeId,
        name: params.name,
        quantity: params.quantity,
        unit: params.unit || null,
        notes: params.notes || null,
        category: params.category || null,
        optional: params.optional || false,
        order_index: nextOrderIndex,
      } as RecipeIngredientInsert)
      .select()
      .single();

    if (error) {
      console.error('Error adding recipe ingredient:', error);
      return { ingredient: null, error };
    }

    return { ingredient, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error adding recipe ingredient:', err);
    return { ingredient: null, error: { message: (err as Error).message } };
  }
}

export async function deleteRecipeIngredient(ingredientId: string): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('id', ingredientId);

    if (error) {
      console.error('Error deleting recipe ingredient:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error deleting recipe ingredient:', err);
    return { success: false, error: { message: (err as Error).message } };
  }
}

// Recipe Scaling and Shopping List Integration

export function scaleRecipe(recipe: RecipeWithIngredients, targetServings: number): {
  scaledIngredients: ScaledIngredient[];
  scalingFactor: number;
} {
  const scalingFactor = targetServings / recipe.servings;
  
  const scaledIngredients = (recipe.ingredients || []).map(ingredient => ({
    ...ingredient, // ingredient is RecipeIngredientRow
    // Explicitly map properties from RecipeIngredientRow to ensure ScaledIngredient type compatibility
    unit: ingredient.unit === null ? "" : ingredient.unit as Unit, // db: string | null -> app: Unit (where "" is a valid Unit for 'no unit')
    notes: ingredient.notes === null ? undefined : ingredient.notes, // db: string | null -> app: string | undefined
    category: ingredient.category === null ? undefined : ingredient.category, // db: string | null -> app: string | undefined
    // 'name', 'quantity', 'optional' from RecipeIngredientRow are compatible or handled by spread
    originalQuantity: ingredient.quantity, // Specific to ScaledIngredient
    scaledQuantity: Math.round((ingredient.quantity * scalingFactor) * 100) / 100, // Specific to ScaledIngredient
  }));

  return { scaledIngredients, scalingFactor };
}

export async function addScaledRecipeToShoppingList(params: {
  recipeId: string;
  shoppingListId: string;
  targetServings: number;
  userId: string;
  mealPlanId?: string;
}): Promise<{ success: boolean; error: any; addedItems?: number }> {
  try {
    // Get the recipe with ingredients
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(*)
      `)
      .eq('id', params.recipeId)
      .single();

    if (recipeError || !recipe) {
      return { success: false, error: recipeError || { message: 'Recipe not found' } };
    }

    const { scaledIngredients } = scaleRecipe(recipe, params.targetServings);
    
    let addedCount = 0;
    
    // Add each ingredient to the shopping list
    for (const ingredient of scaledIngredients) {
      if (ingredient.optional) continue; // Skip optional ingredients

      // Create shopping list item
      const { data: shoppingItem, error: itemError } = await supabase
        .from('shopping_list_items')
        .insert({
          list_id: params.shoppingListId,
          name: ingredient.name,
          quantity: ingredient.scaledQuantity,
          unit: ingredient.unit || null, // ingredient.unit is Unit | undefined, ensure null for DB if undefined
          notes: ingredient.notes ? `${ingredient.notes} (from ${recipe.name})` : `From ${recipe.name}`,
          category: ingredient.category,
          added_by: params.userId,
        })
        .select()
        .single();

      if (itemError) {
        console.error('Error adding shopping list item:', itemError);
        continue; // Continue with other ingredients
      }

      // Create recipe link
      const { error: linkError } = await supabase
        .from('shopping_list_recipe_items')
        .insert({
          shopping_list_item_id: shoppingItem.id,
          recipe_id: params.recipeId,
          meal_plan_id: params.mealPlanId || null,
          scaled_servings: params.targetServings,
          original_quantity: ingredient.originalQuantity,
          scaled_quantity: ingredient.scaledQuantity,
        });

      if (linkError) {
        console.error('Error creating recipe link:', linkError);
        // Continue, the item was still added to the list
      }

      addedCount++;
    }

    return { 
      success: addedCount > 0, 
      error: addedCount === 0 ? { message: 'No ingredients were added' } : null,
      addedItems: addedCount
    };
  } catch (err: unknown) {
    console.error('Unexpected error adding recipe to shopping list:', err);
    return { success: false, error: { message: (err as Error).message } };
  }
}

// Meal Planning Operations

export async function getMealPlansForTrip(tripId: string): Promise<{
  mealPlans: MealPlanRow[] | null;
  error: any;
}> {
  try {
    const { data: mealPlans, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('trip_id', tripId)
      .order('planned_date', { ascending: true })
      .order('meal_type', { ascending: true });

    if (error) {
      console.error('Error fetching meal plans:', error);
      return { mealPlans: null, error };
    }

    return { mealPlans: mealPlans || [], error: null };
  } catch (err: unknown) {
    console.error('Unexpected error fetching meal plans:', err);
    return { mealPlans: null, error: { message: (err as Error).message } };
  }
}

export async function createMealPlan(params: {
  tripId: string;
  recipeId: string;
  plannedDate: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  plannedServings: number;
  notes?: string;
  assignedCook?: string;
  userId: string;
}): Promise<{ mealPlan: MealPlanRow | null; error: any }> {
  try {
    const { data: mealPlan, error } = await supabase
      .from('meal_plans')
      .insert({
        trip_id: params.tripId,
        recipe_id: params.recipeId,
        planned_date: params.plannedDate,
        meal_type: params.mealType,
        planned_servings: params.plannedServings,
        notes: params.notes || null,
        assigned_cook: params.assignedCook || null,
        created_by: params.userId,
      } as MealPlanInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating meal plan:', error);
      return { mealPlan: null, error };
    }

    return { mealPlan, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error creating meal plan:', err);
    return { mealPlan: null, error: { message: (err as Error).message } };
  }
}

export async function updateMealPlan(
  mealPlanId: string,
  updates: {
    planned_date?: string;
    meal_type?: string;
    planned_servings?: number;
    notes?: string;
    assigned_cook?: string;
    is_completed?: boolean;
  }
): Promise<{ mealPlan: MealPlanRow | null; error: any }> {
  try {
    const { data: mealPlan, error } = await supabase
      .from('meal_plans')
      .update(updates)
      .eq('id', mealPlanId)
      .select()
      .single();

    if (error) {
      console.error('Error updating meal plan:', error);
      return { mealPlan: null, error };
    }

    return { mealPlan, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error updating meal plan:', err);
    return { mealPlan: null, error: { message: (err as Error).message } };
  }
}

export async function deleteMealPlan(mealPlanId: string): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', mealPlanId);

    if (error) {
      console.error('Error deleting meal plan:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error deleting meal plan:', err);
    return { success: false, error: { message: (err as Error).message } };
  }
}

// Utility functions

export function formatServings(servings: number): string {
  return servings === 1 ? '1 serving' : `${servings} servings`;
}

export function formatCookTime(prepTime?: number, cookTime?: number): string {
  const parts = [];
  if (prepTime) parts.push(`${prepTime}min prep`);
  if (cookTime) parts.push(`${cookTime}min cook`);
  return parts.join(', ') || 'Time not specified';
}

export function formatQuantity(quantity: number, unit?: string): string {
  const formattedQuantity = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
  return unit ? `${formattedQuantity} ${unit}` : formattedQuantity;
}