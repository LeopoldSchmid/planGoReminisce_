"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  markParticipantAsSettled,
  markParticipantAsUnsettled,
  recordPayment,
  deletePayment,
  formatCurrency,
  type ExpenseWithDetails,
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Receipt, 
  User, 
  Calendar, 
  CreditCard, 
  Check, 
  X, 
  DollarSign, 
  Trash2,
  ArrowRightLeft
} from "lucide-react";
import { toast } from "sonner";

interface ExpenseCardProps {
  expense: ExpenseWithDetails;
  tripMembers: Array<{ 
    user_id: string; 
    username: string | null; 
    full_name: string | null; 
  }>;
  canEdit: boolean;
  onDelete: () => void;
}

interface PaymentFormData {
  fromUser: string;
  toUser: string;
  amount: string;
  paymentMethod: string;
  notes: string;
}

export function ExpenseCard({ expense, tripMembers, canEdit, onDelete }: ExpenseCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    fromUser: user?.id || "",
    toUser: "",
    amount: "",
    paymentMethod: "",
    notes: "",
  });

  const settleParticipantMutation = useMutation({
    mutationFn: ({ participantId, settled }: { participantId: string; settled: boolean }) => {
      return settled 
        ? markParticipantAsSettled(participantId)
        : markParticipantAsUnsettled(participantId);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to update settlement");
      } else {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["tripBalances"] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update settlement");
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (params: {
      expenseId: string;
      fromUser: string;
      toUser: string;
      amount: number;
      paymentMethod?: string;
      notes?: string;
      userId: string;
    }) => recordPayment(params),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to record payment");
      } else {
        toast.success("Payment recorded!");
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["tripBalances"] });
        setIsPaymentDialogOpen(false);
        setPaymentForm({
          fromUser: user?.id || "",
          toUser: "",
          amount: "",
          paymentMethod: "",
          notes: "",
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to record payment");
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => deletePayment(paymentId),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error.message || "Failed to delete payment");
      } else {
        toast.success("Payment deleted");
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["tripBalances"] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete payment");
    },
  });

  const handleSettlementToggle = (participantId: string, currentlySettled: boolean) => {
    settleParticipantMutation.mutate({
      participantId,
      settled: !currentlySettled,
    });
  };

  const handleRecordPayment = () => {
    if (!paymentForm.fromUser || !paymentForm.toUser || !paymentForm.amount || !user?.id) return;

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (paymentForm.fromUser === paymentForm.toUser) {
      toast.error("From and To users cannot be the same");
      return;
    }

    recordPaymentMutation.mutate({
      expenseId: expense.id,
      fromUser: paymentForm.fromUser,
      toUser: paymentForm.toUser,
      amount,
      paymentMethod: paymentForm.paymentMethod || undefined,
      notes: paymentForm.notes || undefined,
      userId: user.id,
    });
  };

  const handleDeletePayment = (paymentId: string) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
      deletePaymentMutation.mutate(paymentId);
    }
  };

  const getUserName = (userId: string) => {
    const member = tripMembers.find(m => m.user_id === userId);
    return member?.username || member?.full_name || "Unknown User";
  };

  const participants = expense.participants || [];
  const payments = expense.payments || [];
  const settledCount = participants.filter(p => p.is_settled).length;
  const totalOwed = participants.reduce((sum, p) => sum + p.amount_owed, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-lg">{expense.name}</CardTitle>
            {expense.category && (
              <Badge variant="outline" className="text-xs">
                {expense.category}
              </Badge>
            )}
          </div>
          <CardDescription className="space-y-1">
            {expense.description && <div>{expense.description}</div>}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span className="font-semibold">{formatCurrency(expense.total_amount, expense.currency)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Paid by {expense.paid_by_profile?.username || expense.paid_by_profile?.full_name || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
              </div>
            </div>
          </CardDescription>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="min-h-[32px]">
                  <CreditCard className="mr-1 h-3 w-3" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Record Payment for {expense.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">From</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={paymentForm.fromUser}
                        onChange={(e) => setPaymentForm({ ...paymentForm, fromUser: e.target.value })}
                      >
                        {tripMembers.map((member) => (
                          <option key={member.user_id} value={member.user_id}>
                            {member.username || member.full_name || "Unnamed User"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">To</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={paymentForm.toUser}
                        onChange={(e) => setPaymentForm({ ...paymentForm, toUser: e.target.value })}
                      >
                        <option value="">Select recipient</option>
                        {tripMembers.filter(m => m.user_id !== paymentForm.fromUser).map((member) => (
                          <option key={member.user_id} value={member.user_id}>
                            {member.username || member.full_name || "Unnamed User"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Method</label>
                      <Input
                        value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                        placeholder="cash, venmo, etc."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsPaymentDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRecordPayment}
                      disabled={!paymentForm.fromUser || !paymentForm.toUser || !paymentForm.amount || recordPaymentMutation.isPending}
                    >
                      {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-500 hover:text-red-700 min-h-[32px]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Participants Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">
                Participants ({settledCount}/{participants.length} settled)
              </h4>
              <Badge variant={settledCount === participants.length ? "default" : "secondary"}>
                {formatCurrency(totalOwed)} total owed
              </Badge>
            </div>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={participant.is_settled}
                      onCheckedChange={() => handleSettlementToggle(participant.id, participant.is_settled)}
                      disabled={!canEdit}
                    />
                    <div>
                      <span className={`font-medium ${participant.is_settled ? 'line-through text-gray-500' : ''}`}>
                        {getUserName(participant.user_id)}
                      </span>
                      <div className="text-sm text-gray-600">
                        Owes {formatCurrency(participant.amount_owed, expense.currency)}
                        {participant.is_settled && participant.settled_at && (
                          <span className="text-green-600 ml-2">
                            • Settled {new Date(participant.settled_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {participant.is_settled ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payments Section */}
          {payments.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-3">Payment History</h4>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-3 w-3 text-gray-500" />
                      <div className="text-sm">
                        <span className="font-medium">{getUserName(payment.from_user)}</span>
                        <span className="text-gray-600"> paid </span>
                        <span className="font-medium">{getUserName(payment.to_user)}</span>
                        <span className="text-gray-600"> </span>
                        <span className="font-semibold">{formatCurrency(payment.amount, expense.currency)}</span>
                        {payment.payment_method && (
                          <span className="text-gray-500"> via {payment.payment_method}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </span>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePayment(payment.id)}
                          className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}