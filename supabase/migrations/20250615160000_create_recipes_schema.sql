-- supabase/migrations/20250615160000_create_recipes_schema.sql

-- Create recipes table
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    servings INTEGER NOT NULL DEFAULT 1, -- base servings this recipe is written for
    prep_time_minutes INTEGER, -- preparation time in minutes
    cook_time_minutes INTEGER, -- cooking time in minutes
    instructions TEXT[], -- array of instruction steps
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create recipe_ingredients table
CREATE TABLE public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- ingredient name (e.g., "spaghetti", "eggs", "parmesan cheese")
    quantity DECIMAL NOT NULL, -- base quantity for the recipe's base servings
    unit TEXT, -- e.g., "g", "kg", "pieces", "cups", "tbsp"
    notes TEXT, -- e.g., "finely grated", "room temperature"
    category TEXT, -- e.g., "protein", "dairy", "vegetables", "pantry"
    optional BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0, -- for ordering ingredients in recipe display
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create meal_plans table (for planning meals on specific days)
CREATE TABLE public.meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    planned_date DATE NOT NULL,
    meal_type TEXT NOT NULL DEFAULT 'dinner', -- 'breakfast', 'lunch', 'dinner', 'snack'
    planned_servings INTEGER NOT NULL DEFAULT 1, -- how many servings to make
    notes TEXT,
    assigned_cook UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- who's cooking
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create shopping_list_recipe_items table (items added from recipes)
CREATE TABLE public.shopping_list_recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_item_id UUID NOT NULL REFERENCES public.shopping_list_items(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE CASCADE, -- optional link to meal plan
    scaled_servings INTEGER NOT NULL, -- servings this item was scaled for
    original_quantity DECIMAL NOT NULL, -- original recipe quantity
    scaled_quantity DECIMAL NOT NULL, -- quantity after scaling
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(shopping_list_item_id) -- one shopping list item can only come from one recipe scaling
);

-- Create indexes for better performance
CREATE INDEX idx_recipes_trip_id ON public.recipes(trip_id);
CREATE INDEX idx_recipes_created_by ON public.recipes(created_by);
CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_category ON public.recipe_ingredients(category);
CREATE INDEX idx_meal_plans_trip_id ON public.meal_plans(trip_id);
CREATE INDEX idx_meal_plans_planned_date ON public.meal_plans(planned_date);
CREATE INDEX idx_meal_plans_recipe_id ON public.meal_plans(recipe_id);
CREATE INDEX idx_meal_plans_assigned_cook ON public.meal_plans(assigned_cook);
CREATE INDEX idx_shopping_list_recipe_items_recipe_id ON public.shopping_list_recipe_items(recipe_id);
CREATE INDEX idx_shopping_list_recipe_items_meal_plan_id ON public.shopping_list_recipe_items(meal_plan_id);

-- Create triggers to update 'updated_at' timestamp
CREATE TRIGGER set_recipes_updated_at
BEFORE UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER set_meal_plans_updated_at
BEFORE UPDATE ON public.meal_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.recipes IS 'Recipes for trip meals';
COMMENT ON TABLE public.recipe_ingredients IS 'Ingredients for each recipe with base quantities';
COMMENT ON TABLE public.meal_plans IS 'Planned meals for specific dates during the trip';
COMMENT ON TABLE public.shopping_list_recipe_items IS 'Links shopping list items to their source recipes';
COMMENT ON COLUMN public.recipes.servings IS 'Base number of servings this recipe is written for';
COMMENT ON COLUMN public.recipe_ingredients.quantity IS 'Quantity needed for the recipe base servings';
COMMENT ON COLUMN public.meal_plans.planned_servings IS 'Number of servings to prepare for this meal';
COMMENT ON COLUMN public.shopping_list_recipe_items.scaled_servings IS 'Servings the shopping item was scaled for';

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_recipe_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes

-- Trip members can view recipes for their trips
CREATE POLICY "Trip members can view recipes"
ON public.recipes
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = recipes.trip_id
        AND tm.user_id = auth.uid()
    )
);

-- Trip members can create recipes for their trips
CREATE POLICY "Trip members can create recipes"
ON public.recipes
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = recipes.trip_id
        AND tm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
);

-- Recipe creator or trip owner/co-owner can update recipes
CREATE POLICY "Creator or trip managers can update recipes"
ON public.recipes
FOR UPDATE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = recipes.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
)
WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = recipes.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);

-- Recipe creator or trip owner/co-owner can delete recipes
CREATE POLICY "Creator or trip managers can delete recipes"
ON public.recipes
FOR DELETE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = recipes.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);

-- RLS Policies for recipe_ingredients

-- Trip members can view ingredients for recipes in their trips
CREATE POLICY "Trip members can view recipe ingredients"
ON public.recipe_ingredients
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.recipes r
        JOIN public.trip_members tm ON tm.trip_id = r.trip_id
        WHERE r.id = recipe_ingredients.recipe_id
        AND tm.user_id = auth.uid()
    )
);

-- Trip members can add ingredients to recipes in their trips
CREATE POLICY "Trip members can add recipe ingredients"
ON public.recipe_ingredients
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.recipes r
        JOIN public.trip_members tm ON tm.trip_id = r.trip_id
        WHERE r.id = recipe_ingredients.recipe_id
        AND tm.user_id = auth.uid()
    )
);

-- Recipe creator or trip managers can update/delete ingredients
CREATE POLICY "Recipe creators or trip managers can update recipe ingredients"
ON public.recipe_ingredients
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.recipes r
        JOIN public.trip_members tm ON tm.trip_id = r.trip_id
        WHERE r.id = recipe_ingredients.recipe_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner' OR r.created_by = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.recipes r
        JOIN public.trip_members tm ON tm.trip_id = r.trip_id
        WHERE r.id = recipe_ingredients.recipe_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner' OR r.created_by = auth.uid())
    )
);

CREATE POLICY "Recipe creators or trip managers can delete recipe ingredients"
ON public.recipe_ingredients
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.recipes r
        JOIN public.trip_members tm ON tm.trip_id = r.trip_id
        WHERE r.id = recipe_ingredients.recipe_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner' OR r.created_by = auth.uid())
    )
);

-- RLS Policies for meal_plans

-- Trip members can view meal plans for their trips
CREATE POLICY "Trip members can view meal plans"
ON public.meal_plans
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = meal_plans.trip_id
        AND tm.user_id = auth.uid()
    )
);

-- Trip members can create meal plans for their trips
CREATE POLICY "Trip members can create meal plans"
ON public.meal_plans
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = meal_plans.trip_id
        AND tm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
);

-- Meal plan creator, assigned cook, or trip managers can update meal plans
CREATE POLICY "Creator, assigned cook, or trip managers can update meal plans"
ON public.meal_plans
FOR UPDATE
USING (
    created_by = auth.uid() OR
    assigned_cook = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = meal_plans.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
)
WITH CHECK (
    created_by = auth.uid() OR
    assigned_cook = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = meal_plans.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);

-- Meal plan creator or trip managers can delete meal plans
CREATE POLICY "Creator or trip managers can delete meal plans"
ON public.meal_plans
FOR DELETE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = meal_plans.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);

-- RLS Policies for shopping_list_recipe_items (same as parent shopping list items)

CREATE POLICY "Trip members can view shopping list recipe items"
ON public.shopping_list_recipe_items
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.shopping_list_items sli
        JOIN public.shopping_lists sl ON sl.id = sli.list_id
        JOIN public.trip_members tm ON tm.trip_id = sl.trip_id
        WHERE sli.id = shopping_list_recipe_items.shopping_list_item_id
        AND tm.user_id = auth.uid()
    )
);

CREATE POLICY "Trip members can create shopping list recipe items"
ON public.shopping_list_recipe_items
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.shopping_list_items sli
        JOIN public.shopping_lists sl ON sl.id = sli.list_id
        JOIN public.trip_members tm ON tm.trip_id = sl.trip_id
        WHERE sli.id = shopping_list_recipe_items.shopping_list_item_id
        AND tm.user_id = auth.uid()
    )
);

CREATE POLICY "Trip members can update shopping list recipe items"
ON public.shopping_list_recipe_items
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.shopping_list_items sli
        JOIN public.shopping_lists sl ON sl.id = sli.list_id
        JOIN public.trip_members tm ON tm.trip_id = sl.trip_id
        WHERE sli.id = shopping_list_recipe_items.shopping_list_item_id
        AND tm.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.shopping_list_items sli
        JOIN public.shopping_lists sl ON sl.id = sli.list_id
        JOIN public.trip_members tm ON tm.trip_id = sl.trip_id
        WHERE sli.id = shopping_list_recipe_items.shopping_list_item_id
        AND tm.user_id = auth.uid()
    )
);

CREATE POLICY "Trip members can delete shopping list recipe items"
ON public.shopping_list_recipe_items
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.shopping_list_items sli
        JOIN public.shopping_lists sl ON sl.id = sli.list_id
        JOIN public.trip_members tm ON tm.trip_id = sl.trip_id
        WHERE sli.id = shopping_list_recipe_items.shopping_list_item_id
        AND tm.user_id = auth.uid()
    )
);