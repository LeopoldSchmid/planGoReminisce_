-- supabase/migrations/20250615140000_create_shopping_lists_schema.sql

-- Create shopping_lists table
CREATE TABLE public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create shopping_list_items table
CREATE TABLE public.shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity DECIMAL DEFAULT 1,
    unit TEXT, -- e.g., "kg", "pieces", "bottles"
    notes TEXT,
    category TEXT, -- e.g., "food", "gear", "toiletries"
    added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_purchased BOOLEAN NOT NULL DEFAULT false,
    purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    purchased_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_shopping_lists_trip_id ON public.shopping_lists(trip_id);
CREATE INDEX idx_shopping_lists_created_by ON public.shopping_lists(created_by);
CREATE INDEX idx_shopping_list_items_list_id ON public.shopping_list_items(list_id);
CREATE INDEX idx_shopping_list_items_assigned_to ON public.shopping_list_items(assigned_to);
CREATE INDEX idx_shopping_list_items_purchased_by ON public.shopping_list_items(purchased_by);
CREATE INDEX idx_shopping_list_items_is_purchased ON public.shopping_list_items(is_purchased);

-- Create trigger to update 'updated_at' timestamp for shopping_lists
CREATE TRIGGER set_shopping_lists_updated_at
BEFORE UPDATE ON public.shopping_lists
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Create trigger to update 'updated_at' timestamp for shopping_list_items
CREATE TRIGGER set_shopping_list_items_updated_at
BEFORE UPDATE ON public.shopping_list_items
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.shopping_lists IS 'Shopping lists for trips';
COMMENT ON TABLE public.shopping_list_items IS 'Items within shopping lists';
COMMENT ON COLUMN public.shopping_list_items.quantity IS 'Quantity needed (e.g., 2.5 for 2.5kg)';
COMMENT ON COLUMN public.shopping_list_items.unit IS 'Unit of measurement (kg, pieces, bottles, etc.)';
COMMENT ON COLUMN public.shopping_list_items.category IS 'Item category for organization';
COMMENT ON COLUMN public.shopping_list_items.assigned_to IS 'User responsible for purchasing this item';
COMMENT ON COLUMN public.shopping_list_items.purchased_by IS 'User who actually purchased the item';

-- Enable RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shopping_lists

-- Trip members can view shopping lists for their trips
CREATE POLICY "Trip members can view shopping lists"
ON public.shopping_lists
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = shopping_lists.trip_id
        AND tm.user_id = auth.uid()
    )
);

-- Trip members can create shopping lists for their trips
CREATE POLICY "Trip members can create shopping lists"
ON public.shopping_lists
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = shopping_lists.trip_id
        AND tm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
);

-- List creator or trip owner/co-owner can update shopping lists
CREATE POLICY "Creator or trip owner/co-owner can update shopping lists"
ON public.shopping_lists
FOR UPDATE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = shopping_lists.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
)
WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = shopping_lists.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);

-- List creator or trip owner/co-owner can delete shopping lists
CREATE POLICY "Creator or trip owner/co-owner can delete shopping lists"
ON public.shopping_lists
FOR DELETE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = shopping_lists.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);

-- RLS Policies for shopping_list_items

-- Trip members can view items in shopping lists for their trips
CREATE POLICY "Trip members can view shopping list items"
ON public.shopping_list_items
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.shopping_lists sl
        JOIN public.trip_members tm ON tm.trip_id = sl.trip_id
        WHERE sl.id = shopping_list_items.list_id
        AND tm.user_id = auth.uid()
    )
);

-- Trip members can add items to shopping lists for their trips
CREATE POLICY "Trip members can add shopping list items"
ON public.shopping_list_items
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.shopping_lists sl
        JOIN public.trip_members tm ON tm.trip_id = sl.trip_id
        WHERE sl.id = shopping_list_items.list_id
        AND tm.user_id = auth.uid()
    )
    AND added_by = auth.uid()
);

-- Item adder, assignee, or trip owner/co-owner can update items
CREATE POLICY "Adder, assignee, or trip owner/co-owner can update shopping list items"
ON public.shopping_list_items
FOR UPDATE
USING (
    added_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.shopping_lists sl
        JOIN public.trip_members tm ON tm.trip_id = sl.trip_id
        WHERE sl.id = shopping_list_items.list_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
)
WITH CHECK (
    added_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.shopping_lists sl
        JOIN public.trip_members tm ON tm.trip_id = sl.trip_id
        WHERE sl.id = shopping_list_items.list_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);

-- Item adder or trip owner/co-owner can delete items
CREATE POLICY "Adder or trip owner/co-owner can delete shopping list items"
ON public.shopping_list_items
FOR DELETE
USING (
    added_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.shopping_lists sl
        JOIN public.trip_members tm ON tm.trip_id = sl.trip_id
        WHERE sl.id = shopping_list_items.list_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);