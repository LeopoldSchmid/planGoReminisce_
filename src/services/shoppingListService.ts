import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

const supabase = createSupabaseBrowserClient();

// Types
type ShoppingListRow = Database['public']['Tables']['shopping_lists']['Row'];
type ShoppingListInsert = Database['public']['Tables']['shopping_lists']['Insert'];
type ShoppingListItemRow = Database['public']['Tables']['shopping_list_items']['Row'];
type ShoppingListItemInsert = Database['public']['Tables']['shopping_list_items']['Insert'];

export interface ShoppingListWithItems extends ShoppingListRow {
  items?: ShoppingListItemWithProfile[];
}

export interface ShoppingListItemWithProfile extends ShoppingListItemRow {
  added_by_profile?: {
    username: string | null;
    full_name: string | null;
  };
  assigned_to_profile?: {
    username: string | null;
    full_name: string | null;
  };
  purchased_by_profile?: {
    username: string | null;
    full_name: string | null;
  };
}

// Shopping Lists CRUD

export async function getShoppingListsForTrip(tripId: string): Promise<{
  lists: ShoppingListWithItems[] | null;
  error: any;
}> {
  try {
    const { data: lists, error: listsError } = await supabase
      .from('shopping_lists')
      .select(`
        *,
        items:shopping_list_items(*)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (listsError) {
      console.error('Error fetching shopping lists:', listsError);
      return { lists: null, error: listsError };
    }

    return { lists: lists || [], error: null };
  } catch (err: unknown) {
    console.error('Unexpected error fetching shopping lists:', err);
    return { lists: null, error: { message: (err as Error).message } };
  }
}

export async function createShoppingList(params: {
  tripId: string;
  name: string;
  description?: string;
  userId: string;
}): Promise<{ list: ShoppingListRow | null; error: any }> {
  try {
    const { data: list, error } = await supabase
      .from('shopping_lists')
      .insert({
        trip_id: params.tripId,
        name: params.name,
        description: params.description || null,
        created_by: params.userId,
      } as ShoppingListInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating shopping list:', error);
      return { list: null, error };
    }

    return { list, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error creating shopping list:', err);
    return { list: null, error: { message: (err as Error).message } };
  }
}

export async function updateShoppingList(
  listId: string,
  updates: { name?: string; description?: string }
): Promise<{ list: ShoppingListRow | null; error: any }> {
  try {
    const { data: list, error } = await supabase
      .from('shopping_lists')
      .update(updates)
      .eq('id', listId)
      .select()
      .single();

    if (error) {
      console.error('Error updating shopping list:', error);
      return { list: null, error };
    }

    return { list, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error updating shopping list:', err);
    return { list: null, error: { message: (err as Error).message } };
  }
}

export async function deleteShoppingList(listId: string): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId);

    if (error) {
      console.error('Error deleting shopping list:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error deleting shopping list:', err);
    return { success: false, error: { message: (err as Error).message } };
  }
}

// Shopping List Items CRUD

export async function getShoppingListItems(listId: string): Promise<{
  items: ShoppingListItemWithProfile[] | null;
  error: any;
}> {
  try {
    const { data: items, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching shopping list items:', error);
      return { items: null, error };
    }

    return { items: items || [], error: null };
  } catch (err: unknown) {
    console.error('Unexpected error fetching shopping list items:', err);
    return { items: null, error: { message: (err as Error).message } };
  }
}

export async function addShoppingListItem(params: {
  listId: string;
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  category?: string;
  assignedTo?: string;
  userId: string;
}): Promise<{ item: ShoppingListItemRow | null; error: any }> {
  try {
    const { data: item, error } = await supabase
      .from('shopping_list_items')
      .insert({
        list_id: params.listId,
        name: params.name,
        quantity: params.quantity || 1,
        unit: params.unit || null,
        notes: params.notes || null,
        category: params.category || null,
        assigned_to: params.assignedTo || null,
        added_by: params.userId,
      } as ShoppingListItemInsert)
      .select()
      .single();

    if (error) {
      console.error('Error adding shopping list item:', error);
      return { item: null, error };
    }

    return { item, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error adding shopping list item:', err);
    return { item: null, error: { message: (err as Error).message } };
  }
}

export async function updateShoppingListItem(
  itemId: string,
  updates: {
    name?: string;
    quantity?: number;
    unit?: string;
    notes?: string;
    category?: string;
    assigned_to?: string;
    is_purchased?: boolean;
    purchased_by?: string;
  }
): Promise<{ item: ShoppingListItemRow | null; error: any }> {
  try {
    // If marking as purchased, set purchased_at timestamp
    const updateData = { ...updates };
    if (updates.is_purchased === true && !updates.purchased_by) {
      // If marking as purchased but no purchased_by specified, we'll need the current user
      // This should be handled by the calling code, but we can add a safeguard
      console.warn('Item marked as purchased but no purchased_by specified');
    }
    if (updates.is_purchased === true) {
      updateData.purchased_at = new Date().toISOString();
    } else if (updates.is_purchased === false) {
      updateData.purchased_at = null;
      updateData.purchased_by = null;
    }

    const { data: item, error } = await supabase
      .from('shopping_list_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating shopping list item:', error);
      return { item: null, error };
    }

    return { item, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error updating shopping list item:', err);
    return { item: null, error: { message: (err as Error).message } };
  }
}

export async function markItemAsPurchased(
  itemId: string,
  purchasedBy: string
): Promise<{ item: ShoppingListItemRow | null; error: any }> {
  return updateShoppingListItem(itemId, {
    is_purchased: true,
    purchased_by: purchasedBy,
  });
}

export async function markItemAsUnpurchased(
  itemId: string
): Promise<{ item: ShoppingListItemRow | null; error: any }> {
  return updateShoppingListItem(itemId, {
    is_purchased: false,
  });
}

export async function deleteShoppingListItem(itemId: string): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting shopping list item:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error deleting shopping list item:', err);
    return { success: false, error: { message: (err as Error).message } };
  }
}