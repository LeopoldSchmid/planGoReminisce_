-- supabase/migrations/20250615150000_create_expenses_schema.sql

-- Create expenses table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    category TEXT, -- e.g., "food", "accommodation", "transport", "activities"
    paid_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    split_method TEXT NOT NULL DEFAULT 'equal', -- 'equal', 'by_amount', 'by_percentage'
    receipt_url TEXT, -- Optional receipt image/document URL
    expense_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create expense_participants table (who owes money for this expense)
CREATE TABLE public.expense_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_owed DECIMAL(10,2) NOT NULL,
    is_settled BOOLEAN NOT NULL DEFAULT false,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure a user can only be a participant once per expense
    UNIQUE(expense_id, user_id)
);

-- Create expense_payments table (track actual payments between users)
CREATE TABLE public.expense_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT, -- e.g., "cash", "bank_transfer", "venmo", "paypal"
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Prevent users from paying themselves
    CHECK (from_user != to_user)
);

-- Create indexes for better performance
CREATE INDEX idx_expenses_trip_id ON public.expenses(trip_id);
CREATE INDEX idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_expense_participants_expense_id ON public.expense_participants(expense_id);
CREATE INDEX idx_expense_participants_user_id ON public.expense_participants(user_id);
CREATE INDEX idx_expense_participants_is_settled ON public.expense_participants(is_settled);
CREATE INDEX idx_expense_payments_expense_id ON public.expense_payments(expense_id);
CREATE INDEX idx_expense_payments_from_user ON public.expense_payments(from_user);
CREATE INDEX idx_expense_payments_to_user ON public.expense_payments(to_user);

-- Create triggers to update 'updated_at' timestamp
CREATE TRIGGER set_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER set_expense_participants_updated_at
BEFORE UPDATE ON public.expense_participants
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.expenses IS 'Expenses for trips';
COMMENT ON TABLE public.expense_participants IS 'Who owes money for each expense';
COMMENT ON TABLE public.expense_payments IS 'Actual payments made between users';
COMMENT ON COLUMN public.expenses.split_method IS 'How the expense is split: equal, by_amount, by_percentage';
COMMENT ON COLUMN public.expenses.paid_by IS 'User who initially paid for the expense';
COMMENT ON COLUMN public.expense_participants.amount_owed IS 'Amount this user owes for this expense';
COMMENT ON COLUMN public.expense_participants.is_settled IS 'Whether this users portion has been paid';
COMMENT ON COLUMN public.expense_payments.from_user IS 'User making the payment';
COMMENT ON COLUMN public.expense_payments.to_user IS 'User receiving the payment';
COMMENT ON COLUMN public.expense_payments.amount IS 'Amount of the payment';

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses

-- Trip members can view expenses for their trips
CREATE POLICY "Trip members can view expenses"
ON public.expenses
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = expenses.trip_id
        AND tm.user_id = auth.uid()
    )
);

-- Trip members can create expenses for their trips
CREATE POLICY "Trip members can create expenses"
ON public.expenses
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = expenses.trip_id
        AND tm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
);

-- Expense creator or trip owner/co-owner can update expenses
CREATE POLICY "Creator or trip owner/co-owner can update expenses"
ON public.expenses
FOR UPDATE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = expenses.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
)
WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = expenses.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);

-- Expense creator or trip owner/co-owner can delete expenses
CREATE POLICY "Creator or trip owner/co-owner can delete expenses"
ON public.expenses
FOR DELETE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = expenses.trip_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);

-- RLS Policies for expense_participants

-- Trip members can view participants for expenses in their trips
CREATE POLICY "Trip members can view expense participants"
ON public.expense_participants
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.expenses e
        JOIN public.trip_members tm ON tm.trip_id = e.trip_id
        WHERE e.id = expense_participants.expense_id
        AND tm.user_id = auth.uid()
    )
);

-- Trip members can add participants for expenses in their trips
CREATE POLICY "Trip members can add expense participants"
ON public.expense_participants
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.expenses e
        JOIN public.trip_members tm ON tm.trip_id = e.trip_id
        WHERE e.id = expense_participants.expense_id
        AND tm.user_id = auth.uid()
    )
);

-- Participants can update their own records, creators and trip owners/co-owners can update any
CREATE POLICY "Participants or trip managers can update expense participants"
ON public.expense_participants
FOR UPDATE
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.expenses e
        JOIN public.trip_members tm ON tm.trip_id = e.trip_id
        WHERE e.id = expense_participants.expense_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner' OR e.created_by = auth.uid())
    )
)
WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.expenses e
        JOIN public.trip_members tm ON tm.trip_id = e.trip_id
        WHERE e.id = expense_participants.expense_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner' OR e.created_by = auth.uid())
    )
);

-- Expense creator or trip owner/co-owner can delete participants
CREATE POLICY "Trip managers can delete expense participants"
ON public.expense_participants
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.expenses e
        JOIN public.trip_members tm ON tm.trip_id = e.trip_id
        WHERE e.id = expense_participants.expense_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner' OR e.created_by = auth.uid())
    )
);

-- RLS Policies for expense_payments

-- Trip members can view payments for expenses in their trips
CREATE POLICY "Trip members can view expense payments"
ON public.expense_payments
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.expenses e
        JOIN public.trip_members tm ON tm.trip_id = e.trip_id
        WHERE e.id = expense_payments.expense_id
        AND tm.user_id = auth.uid()
    )
);

-- Trip members can record payments for expenses in their trips
CREATE POLICY "Trip members can record expense payments"
ON public.expense_payments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.expenses e
        JOIN public.trip_members tm ON tm.trip_id = e.trip_id
        WHERE e.id = expense_payments.expense_id
        AND tm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
);

-- Payment creator or trip owner/co-owner can update payments
CREATE POLICY "Creator or trip managers can update expense payments"
ON public.expense_payments
FOR UPDATE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.expenses e
        JOIN public.trip_members tm ON tm.trip_id = e.trip_id
        WHERE e.id = expense_payments.expense_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
)
WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.expenses e
        JOIN public.trip_members tm ON tm.trip_id = e.trip_id
        WHERE e.id = expense_payments.expense_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);

-- Payment creator or trip owner/co-owner can delete payments
CREATE POLICY "Creator or trip managers can delete expense payments"
ON public.expense_payments
FOR DELETE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1
        FROM public.expenses e
        JOIN public.trip_members tm ON tm.trip_id = e.trip_id
        WHERE e.id = expense_payments.expense_id
        AND tm.user_id = auth.uid()
        AND (tm.role = 'owner' OR tm.role = 'co-owner')
    )
);