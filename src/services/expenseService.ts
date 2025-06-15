import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

const supabase = createSupabaseBrowserClient();

// Types
type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseParticipantRow = Database['public']['Tables']['expense_participants']['Row'];
type ExpensePaymentRow = Database['public']['Tables']['expense_payments']['Row'];

export interface ExpenseWithDetails extends ExpenseRow {
  participants?: ExpenseParticipantWithProfile[];
  payments?: ExpensePaymentWithProfile[];
  paid_by_profile?: {
    username: string | null;
    full_name: string | null;
  };
  created_by_profile?: {
    username: string | null;
    full_name: string | null;
  };
}

export interface ExpenseParticipantWithProfile extends ExpenseParticipantRow {
  user_profile?: {
    username: string | null;
    full_name: string | null;
  };
}

export interface ExpensePaymentWithProfile extends ExpensePaymentRow {
  from_user_profile?: {
    username: string | null;
    full_name: string | null;
  };
  to_user_profile?: {
    username: string | null;
    full_name: string | null;
  };
  created_by_profile?: {
    username: string | null;
    full_name: string | null;
  };
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
}

export interface BalanceInfo {
  userId: string;
  username: string | null;
  full_name: string | null;
  balance: number; // positive means they are owed money, negative means they owe money
  owesTo: Array<{
    userId: string;
    username: string | null;
    full_name: string | null;
    amount: number;
  }>;
  owedBy: Array<{
    userId: string;
    username: string | null;
    full_name: string | null;
    amount: number;
  }>;
}

// Expense CRUD Operations

export async function getExpensesForTrip(tripId: string): Promise<{
  expenses: ExpenseWithDetails[] | null;
  error: any;
}> {
  try {
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        *,
        participants:expense_participants(*),
        payments:expense_payments(*)
      `)
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false });

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      return { expenses: null, error: expensesError };
    }

    return { expenses: expenses || [], error: null };
  } catch (err: unknown) {
    console.error('Unexpected error fetching expenses:', err);
    return { expenses: null, error: { message: (err as Error).message } };
  }
}

export async function createExpense(params: {
  tripId: string;
  name: string;
  description?: string;
  totalAmount: number;
  currency?: string;
  category?: string;
  paidBy: string;
  splitMethod?: 'equal' | 'by_amount' | 'by_percentage';
  expenseDate?: string;
  splits: ExpenseSplit[];
  userId: string;
}): Promise<{ expense: ExpenseRow | null; error: any }> {
  try {
    // Start a transaction
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        trip_id: params.tripId,
        name: params.name,
        description: params.description || null,
        total_amount: params.totalAmount,
        currency: params.currency || 'USD',
        category: params.category || null,
        paid_by: params.paidBy,
        split_method: params.splitMethod || 'equal',
        expense_date: params.expenseDate || new Date().toISOString(),
        created_by: params.userId,
      } as ExpenseInsert)
      .select()
      .single();

    if (expenseError) {
      console.error('Error creating expense:', expenseError);
      return { expense: null, error: expenseError };
    }

    // Create expense participants
    const participantInserts = params.splits.map(split => ({
      expense_id: expense.id,
      user_id: split.userId,
      amount_owed: split.amount,
    }));

    const { error: participantsError } = await supabase
      .from('expense_participants')
      .insert(participantInserts);

    if (participantsError) {
      console.error('Error creating expense participants:', participantsError);
      // Should rollback the expense creation, but Supabase doesn't support transactions
      // In a real implementation, we'd use RPC functions or handle cleanup
      return { expense: null, error: participantsError };
    }

    return { expense, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error creating expense:', err);
    return { expense: null, error: { message: (err as Error).message } };
  }
}

export async function updateExpense(
  expenseId: string,
  updates: {
    name?: string;
    description?: string;
    total_amount?: number;
    currency?: string;
    category?: string;
    expense_date?: string;
  }
): Promise<{ expense: ExpenseRow | null; error: any }> {
  try {
    const { data: expense, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return { expense: null, error };
    }

    return { expense, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error updating expense:', err);
    return { expense: null, error: { message: (err as Error).message } };
  }
}

export async function deleteExpense(expenseId: string): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      console.error('Error deleting expense:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error deleting expense:', err);
    return { success: false, error: { message: (err as Error).message } };
  }
}

// Expense Participant Operations

export async function updateExpenseParticipant(
  participantId: string,
  updates: {
    amount_owed?: number;
    is_settled?: boolean;
  }
): Promise<{ participant: ExpenseParticipantRow | null; error: any }> {
  try {
    const updateData = { ...updates };
    if (updates.is_settled === true) {
      updateData.settled_at = new Date().toISOString();
    } else if (updates.is_settled === false) {
      updateData.settled_at = null;
    }

    const { data: participant, error } = await supabase
      .from('expense_participants')
      .update(updateData)
      .eq('id', participantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense participant:', error);
      return { participant: null, error };
    }

    return { participant, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error updating expense participant:', err);
    return { participant: null, error: { message: (err as Error).message } };
  }
}

export async function markParticipantAsSettled(
  participantId: string
): Promise<{ participant: ExpenseParticipantRow | null; error: any }> {
  return updateExpenseParticipant(participantId, { is_settled: true });
}

export async function markParticipantAsUnsettled(
  participantId: string
): Promise<{ participant: ExpenseParticipantRow | null; error: any }> {
  return updateExpenseParticipant(participantId, { is_settled: false });
}

// Payment Operations

export async function recordPayment(params: {
  expenseId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  paymentMethod?: string;
  notes?: string;
  userId: string;
}): Promise<{ payment: ExpensePaymentRow | null; error: any }> {
  try {
    const { data: payment, error } = await supabase
      .from('expense_payments')
      .insert({
        expense_id: params.expenseId,
        from_user: params.fromUser,
        to_user: params.toUser,
        amount: params.amount,
        payment_method: params.paymentMethod || null,
        notes: params.notes || null,
        created_by: params.userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording payment:', error);
      return { payment: null, error };
    }

    return { payment, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error recording payment:', err);
    return { payment: null, error: { message: (err as Error).message } };
  }
}

export async function deletePayment(paymentId: string): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase
      .from('expense_payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('Error deleting payment:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error deleting payment:', err);
    return { success: false, error: { message: (err as Error).message } };
  }
}

// Balance and Settlement Calculations

export async function getTripBalances(tripId: string): Promise<{
  balances: BalanceInfo[] | null;
  error: any;
}> {
  try {
    // Get all expenses with participants and payments for the trip
    const { expenses, error: expensesError } = await getExpensesForTrip(tripId);

    if (expensesError || !expenses) {
      return { balances: null, error: expensesError };
    }

    // Calculate balances
    const userBalances = new Map<string, {
      username: string | null;
      full_name: string | null;
      totalPaid: number;
      totalOwed: number;
    }>();

    // Initialize user balances
    expenses.forEach(expense => {
      expense.participants?.forEach(participant => {
        if (!userBalances.has(participant.user_id)) {
          userBalances.set(participant.user_id, {
            username: participant.user_profile?.username || null,
            full_name: participant.user_profile?.full_name || null,
            totalPaid: 0,
            totalOwed: 0,
          });
        }
      });

      // Add the person who paid
      if (!userBalances.has(expense.paid_by)) {
        userBalances.set(expense.paid_by, {
          username: expense.paid_by_profile?.username || null,
          full_name: expense.paid_by_profile?.full_name || null,
          totalPaid: 0,
          totalOwed: 0,
        });
      }
    });

    // Calculate total paid and total owed for each user
    expenses.forEach(expense => {
      // Add to total paid for the person who paid
      const paidByBalance = userBalances.get(expense.paid_by);
      if (paidByBalance) {
        paidByBalance.totalPaid += expense.total_amount;
      }

      // Add to total owed for each participant
      expense.participants?.forEach(participant => {
        if (!participant.is_settled) {
          const participantBalance = userBalances.get(participant.user_id);
          if (participantBalance) {
            participantBalance.totalOwed += participant.amount_owed;
          }
        }
      });
    });

    // Convert to balance info format
    const balances: BalanceInfo[] = Array.from(userBalances.entries()).map(([userId, balance]) => {
      const netBalance = balance.totalPaid - balance.totalOwed;
      
      return {
        userId,
        username: balance.username,
        full_name: balance.full_name,
        balance: netBalance,
        owesTo: [], // We'll calculate this in a more complex implementation
        owedBy: [], // We'll calculate this in a more complex implementation
      };
    });

    return { balances, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error calculating trip balances:', err);
    return { balances: null, error: { message: (err as Error).message } };
  }
}

// Utility functions

export function calculateEqualSplit(totalAmount: number, participantCount: number): number {
  return Math.round((totalAmount / participantCount) * 100) / 100;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Function to add new members to existing expenses retroactively
export async function addMemberToExpense(
  expenseId: string,
  userId: string,
  amount: number
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('expense_participants')
      .insert({
        expense_id: expenseId,
        user_id: userId,
        amount_owed: amount,
        is_settled: false,
      });

    if (error) {
      console.error('Error adding member to expense:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Unexpected error adding member to expense:', err);
    return { success: false, error: { message: (err as Error).message } };
  }
}