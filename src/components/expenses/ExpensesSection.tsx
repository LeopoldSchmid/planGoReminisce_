"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  getExpensesForTrip,
  createExpense,
  deleteExpense,
  getTripBalances,
  formatCurrency,
  calculateEqualSplit,
  type ExpenseSplit,
} from "@/services/expenseService";
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
import { LoadingSpinner, InlineSpinner } from "@/components/common/LoadingSpinner";
import { ExpenseCard } from "./ExpenseCard";
import { Plus, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface ExpensesSectionProps {
  tripId: string;
  tripMembers: Array<{ 
    user_id: string; 
    username: string | null; 
    full_name: string | null; 
    role: string;
  }>;
  currentUserRole?: string;
}

interface CreateExpenseFormData {
  name: string;
  description: string;
  totalAmount: string;
  currency: string;
  category: string;
  paidBy: string;
  splitMethod: 'equal' | 'by_amount';
  selectedParticipants: string[];
  customSplits: { [userId: string]: string };
}

export function ExpensesSection({ tripId, tripMembers, currentUserRole }: ExpensesSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateExpenseFormData>({
    name: "",
    description: "",
    totalAmount: "",
    currency: "USD",
    category: "",
    paidBy: user?.id || "",
    splitMethod: "equal",
    selectedParticipants: [],
    customSplits: {},
  });

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'co-owner' || currentUserRole === 'member';

  const { data: expensesData, isLoading: expensesLoading, error: expensesError } = useQuery({
    queryKey: ["expenses", tripId],
    queryFn: () => getExpensesForTrip(tripId),
    enabled: !!tripId,
  });

  const { data: balancesData, isLoading: balancesLoading } = useQuery({
    queryKey: ["tripBalances", tripId],
    queryFn: () => getTripBalances(tripId),
    enabled: !!tripId,
  });

  const createExpenseMutation = useMutation({
    mutationFn: (params: {
      tripId: string;
      name: string;
      description?: string;
      totalAmount: number;
      currency?: string;
      category?: string;
      paidBy: string;
      splitMethod?: 'equal' | 'by_amount';
      splits: ExpenseSplit[];
      userId: string;
    }) => createExpense(params),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to create expense");
      } else {
        toast.success("Expense created!");
        queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
        queryClient.invalidateQueries({ queryKey: ["tripBalances", tripId] });
        setIsCreateDialogOpen(false);
        resetCreateForm();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create expense");
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) => deleteExpense(expenseId),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to delete expense");
      } else {
        toast.success("Expense deleted");
        queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
        queryClient.invalidateQueries({ queryKey: ["tripBalances", tripId] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete expense");
    },
  });

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      description: "",
      totalAmount: "",
      currency: "USD",
      category: "",
      paidBy: user?.id || "",
      splitMethod: "equal",
      selectedParticipants: [],
      customSplits: {},
    });
  };

  const handleCreateExpense = () => {
    if (!createForm.name.trim() || !createForm.totalAmount || !user?.id) return;

    const totalAmount = parseFloat(createForm.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (createForm.selectedParticipants.length === 0) {
      toast.error("Please select at least one participant");
      return;
    }

    let splits: ExpenseSplit[];

    if (createForm.splitMethod === 'equal') {
      const splitAmount = calculateEqualSplit(totalAmount, createForm.selectedParticipants.length);
      splits = createForm.selectedParticipants.map(userId => ({
        userId,
        amount: splitAmount,
      }));
    } else {
      // Custom splits
      splits = createForm.selectedParticipants.map(userId => ({
        userId,
        amount: parseFloat(createForm.customSplits[userId] || "0"),
      }));

      const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        toast.error(`Split amounts (${formatCurrency(totalSplit)}) don't match total amount (${formatCurrency(totalAmount)})`);
        return;
      }
    }

    createExpenseMutation.mutate({
      tripId,
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
      totalAmount,
      currency: createForm.currency,
      category: createForm.category.trim() || undefined,
      paidBy: createForm.paidBy,
      splitMethod: createForm.splitMethod,
      splits,
      userId: user.id,
    });
  };

  const handleDeleteExpense = (expenseId: string, expenseName: string) => {
    if (confirm(`Are you sure you want to delete the expense "${expenseName}"? This will also delete all associated participant records and payments.`)) {
      deleteExpenseMutation.mutate(expenseId);
    }
  };

  const handleParticipantToggle = (userId: string) => {
    const newSelected = createForm.selectedParticipants.includes(userId)
      ? createForm.selectedParticipants.filter(id => id !== userId)
      : [...createForm.selectedParticipants, userId];
    
    setCreateForm({ ...createForm, selectedParticipants: newSelected });
  };

  if (expensesLoading) {
    return <LoadingSpinner message="Loading expenses..." />;
  }

  if (expensesError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500 text-center">
            Error loading expenses: {expensesError.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const expenses = expensesData?.expenses || [];
  const balances = balancesData?.balances || [];
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
            {user && balances.find(b => b.userId === user.id)?.balance && balances.find(b => b.userId === user.id)!.balance > 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-warning" />
            )}
          </CardHeader>
          <CardContent>
            {balancesLoading ? (
              <div className="flex items-center gap-2">
                <InlineSpinner size="sm" />
                <div className="text-sm text-muted-foreground">Calculating...</div>
              </div>
            ) : (
              <>
                <div className={`text-2xl font-bold ${
                  user && balances.find(b => b.userId === user.id)?.balance 
                    ? balances.find(b => b.userId === user.id)!.balance > 0
                      ? 'text-success'
                      : 'text-warning'
                    : 'text-muted-foreground'
                }`}>
                  {user ? formatCurrency(balances.find(b => b.userId === user.id)?.balance || 0) : "$0.00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user && balances.find(b => b.userId === user.id)?.balance
                    ? balances.find(b => b.userId === user.id)!.balance > 0
                      ? "You are owed"
                      : "You owe"
                    : "All settled"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tripMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Trip members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Expenses Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Expenses
            </CardTitle>
            <CardDescription>
              Track and split expenses for your trip
            </CardDescription>
          </div>
          {canEdit && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="min-h-[44px]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Expense Name</label>
                    <Input
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g., Dinner at restaurant, Hotel booking"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={createForm.totalAmount}
                        onChange={(e) => setCreateForm({ ...createForm, totalAmount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Currency</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={createForm.currency}
                        onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Input
                        value={createForm.category}
                        onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                        placeholder="food, accommodation, transport"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Paid by</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={createForm.paidBy}
                        onChange={(e) => setCreateForm({ ...createForm, paidBy: e.target.value })}
                      >
                        {tripMembers.map((member) => (
                          <option key={member.user_id} value={member.user_id}>
                            {member.username || member.full_name || "Unnamed User"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Additional details about this expense..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Split Method</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="equal"
                          checked={createForm.splitMethod === 'equal'}
                          onChange={(e) => setCreateForm({ ...createForm, splitMethod: e.target.value as 'equal' })}
                        />
                        Equal Split
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="by_amount"
                          checked={createForm.splitMethod === 'by_amount'}
                          onChange={(e) => setCreateForm({ ...createForm, splitMethod: e.target.value as 'by_amount' })}
                        />
                        Custom Amounts
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Participants</label>
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {tripMembers.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-2 border rounded">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={createForm.selectedParticipants.includes(member.user_id)}
                              onChange={() => handleParticipantToggle(member.user_id)}
                            />
                            {member.username || member.full_name || "Unnamed User"}
                          </label>
                          {createForm.splitMethod === 'by_amount' && createForm.selectedParticipants.includes(member.user_id) && (
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-20"
                              placeholder="0.00"
                              value={createForm.customSplits[member.user_id] || ""}
                              onChange={(e) => setCreateForm({
                                ...createForm,
                                customSplits: {
                                  ...createForm.customSplits,
                                  [member.user_id]: e.target.value
                                }
                              })}
                            />
                          )}
                          {createForm.splitMethod === 'equal' && createForm.selectedParticipants.includes(member.user_id) && createForm.totalAmount && (
                            <Badge variant="secondary" className="text-xs">
                              {formatCurrency(calculateEqualSplit(parseFloat(createForm.totalAmount) || 0, createForm.selectedParticipants.length))}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateExpense}
                      disabled={!createForm.name.trim() || !createForm.totalAmount || createForm.selectedParticipants.length === 0 || createExpenseMutation.isPending}
                    >
                      {createExpenseMutation.isPending ? "Creating..." : "Create Expense"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No expenses yet</p>
              <p className="text-sm mb-4">Add your first expense to start tracking costs for this trip.</p>
              {canEdit && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="min-h-[44px]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Expense Summary */}
              {(() => {
                const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total_amount, 0);
                const settledExpenses = expenses.filter(exp => {
                  const participants = exp.participants || [];
                  return participants.length > 0 && participants.every(p => p.is_settled);
                });
                const partiallySettled = expenses.filter(exp => {
                  const participants = exp.participants || [];
                  return participants.length > 0 && participants.some(p => p.is_settled) && !participants.every(p => p.is_settled);
                });
                const settlementRate = expenses.length > 0 ? (settledExpenses.length / expenses.length) * 100 : 0;
                
                return (
                  <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {expenses.length} expenses • {formatCurrency(totalExpenses)} total
                      </div>
                      <div className={`text-sm font-medium ${
                        settlementRate === 100 ? 'text-success' :
                        settlementRate > 0 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {Math.round(settlementRate)}% settled
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Settlement Progress</span>
                        <span>({settledExpenses.length}/{expenses.length})</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            settlementRate === 100 ? 'bg-success' :
                            settlementRate > 0 ? 'bg-warning' : 'bg-muted'
                          }`}
                          style={{ width: `${settlementRate}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-success rounded-full"></div>
                          <span className="text-success">{settledExpenses.length} fully settled</span>
                        </div>
                        {partiallySettled.length > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-warning rounded-full"></div>
                            <span className="text-warning">{partiallySettled.length} partially settled</span>
                          </div>
                        )}
                        {(expenses.length - settledExpenses.length - partiallySettled.length) > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-destructive rounded-full"></div>
                            <span className="text-destructive">{expenses.length - settledExpenses.length - partiallySettled.length} unsettled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Expense List */}
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  tripMembers={tripMembers}
                  canEdit={canEdit}
                  onDelete={() => handleDeleteExpense(expense.id, expense.name)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}