"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  addMemberToExpense,
  updateExpense,
  formatCurrency,
  calculateEqualSplit,
  type ExpenseWithDetails,
} from "@/services/expenseService";
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
import { UserPlus, Calculator } from "lucide-react";
import { toast } from "sonner";

interface RetroactiveExpenseManagerProps {
  expenses: ExpenseWithDetails[];
  tripMembers: Array<{ 
    user_id: string; 
    username: string | null; 
    full_name: string | null; 
  }>;
  newMember: {
    user_id: string;
    username: string | null;
    full_name: string | null;
  };
}

interface ExpenseSelection {
  expenseId: string;
  include: boolean;
  customAmount?: number;
  useEqualSplit: boolean;
}

export function RetroactiveExpenseManager({ 
  expenses, 
  tripMembers, 
  newMember 
}: RetroactiveExpenseManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selections, setSelections] = useState<{ [expenseId: string]: ExpenseSelection }>({});

  const addMemberMutation = useMutation({
    mutationFn: async (params: { expenseId: string; amount: number }) => {
      return addMemberToExpense(params.expenseId, newMember.user_id, params.amount);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to add member to expense");
      } else {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["tripBalances"] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add member to expense");
    },
  });

  const handleExpenseToggle = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    const currentParticipants = expense.participants?.length || 0;
    const equalSplitAmount = calculateEqualSplit(expense.total_amount, currentParticipants + 1);

    setSelections(prev => ({
      ...prev,
      [expenseId]: {
        expenseId,
        include: !prev[expenseId]?.include,
        customAmount: equalSplitAmount,
        useEqualSplit: true,
      }
    }));
  };

  const handleAmountChange = (expenseId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setSelections(prev => ({
      ...prev,
      [expenseId]: {
        ...prev[expenseId],
        customAmount: numAmount,
        useEqualSplit: false,
      }
    }));
  };

  const handleUseEqualSplit = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    const currentParticipants = expense.participants?.length || 0;
    const equalSplitAmount = calculateEqualSplit(expense.total_amount, currentParticipants + 1);

    setSelections(prev => ({
      ...prev,
      [expenseId]: {
        ...prev[expenseId],
        customAmount: equalSplitAmount,
        useEqualSplit: true,
      }
    }));
  };

  const handleAddToSelectedExpenses = async () => {
    if (!user?.id) return;

    const selectedExpenses = Object.values(selections).filter(s => s.include);
    if (selectedExpenses.length === 0) {
      toast.error("Please select at least one expense");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const selection of selectedExpenses) {
      const result = await addMemberToExpense(
        selection.expenseId,
        newMember.user_id,
        selection.customAmount || 0
      );

      if (result.error) {
        errorCount++;
      } else {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Added ${newMember.username || newMember.full_name} to ${successCount} expense${successCount === 1 ? '' : 's'}!`);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["tripBalances"] });
      setIsDialogOpen(false);
      setSelections({});
    }

    if (errorCount > 0) {
      toast.error(`Failed to add to ${errorCount} expense${errorCount === 1 ? '' : 's'}`);
    }
  };

  const getUserName = (userId: string) => {
    const member = tripMembers.find(m => m.user_id === userId);
    return member?.username || member?.full_name || "Unknown User";
  };

  const getMemberName = () => {
    return newMember.username || newMember.full_name || "New Member";
  };

  // Filter out expenses where the new member is already a participant
  const availableExpenses = expenses.filter(expense => 
    !expense.participants?.some(p => p.user_id === newMember.user_id)
  );

  if (availableExpenses.length === 0) {
    return null; // Don't show if no expenses to add to
  }

  const selectedCount = Object.values(selections).filter(s => s.include).length;
  const totalAmount = Object.values(selections)
    .filter(s => s.include)
    .reduce((sum, s) => sum + (s.customAmount || 0), 0);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-[44px]">
          <UserPlus className="mr-2 h-4 w-4" />
          Add {getMemberName()} to Past Expenses
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add {getMemberName()} to Existing Expenses</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Select which past expenses should include {getMemberName()}. 
              They will become responsible for their portion of the selected expenses.
            </p>
          </div>

          {selectedCount > 0 && (
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {selectedCount} expense{selectedCount === 1 ? '' : 's'} selected
                </span>
                <Badge variant="secondary">
                  Total: {formatCurrency(totalAmount)}
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableExpenses.map((expense) => {
              const selection = selections[expense.id];
              const isSelected = selection?.include || false;
              const currentParticipants = expense.participants?.length || 0;
              const equalSplitAmount = calculateEqualSplit(expense.total_amount, currentParticipants + 1);

              return (
                <div 
                  key={expense.id} 
                  className={`border rounded-lg p-4 ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleExpenseToggle(expense.id)}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium">{expense.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(expense.total_amount, expense.currency)} • 
                          Paid by {getUserName(expense.paid_by)} • 
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </div>
                        {expense.category && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {expense.category}
                          </Badge>
                        )}
                      </div>
                    </label>
                  </div>

                  {isSelected && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Amount for {getMemberName()}:</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={selection.customAmount || ""}
                          onChange={(e) => handleAmountChange(expense.id, e.target.value)}
                          className="w-24"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUseEqualSplit(expense.id)}
                          className="text-xs"
                        >
                          <Calculator className="mr-1 h-3 w-3" />
                          Equal Split ({formatCurrency(equalSplitAmount)})
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Current participants: {currentParticipants} • 
                        Equal split would be: {formatCurrency(equalSplitAmount)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToSelectedExpenses}
              disabled={selectedCount === 0 || addMemberMutation.isPending}
            >
              {addMemberMutation.isPending 
                ? "Adding..." 
                : `Add to ${selectedCount} Expense${selectedCount === 1 ? '' : 's'}`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}