import { useEffect, useState } from "react";
import { isStaff } from "@/lib/roles";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Payment } from "@/types";

interface FinancePanelProps {
  orderId?: string;
  projectId?: string;
  onBudgetChange?: (budget: number | null) => void;
  budget?: number | string | null;
  editableBudget?: boolean;
}

export function FinancePanel({
  orderId,
  projectId,
  onBudgetChange,
  budget,
  editableBudget,
}: FinancePanelProps) {
  const { user } = useAuth();
  const [finance, setFinance] = useState<{
    budget: number;
    paid: number;
    remaining: number;
    payments: Payment[];
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [budgetInput, setBudgetInput] = useState(budget != null ? String(budget) : "");

  const load = () => {
    if (orderId) {
      api.finance.order(orderId).then((r) => setFinance(r.finance));
    } else if (projectId) {
      api.finance.project(projectId).then((r) =>
        setFinance({
          budget: r.finance.budget,
          paid: r.finance.paid,
          remaining: r.finance.remaining,
          payments: [...r.finance.projectPayments, ...r.finance.orders.flatMap((o) => o.payments)],
        })
      );
    }
  };

  useEffect(() => {
    load();
  }, [orderId, projectId]);

  useEffect(() => {
    setBudgetInput(budget != null ? String(budget) : "");
  }, [budget]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    await api.finance.addPayment({
      orderId,
      projectId: orderId ? undefined : projectId,
      amount: parseFloat(amount),
      note: note || undefined,
    });
    setAmount("");
    setNote("");
    load();
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm("Удалить платёж?")) return;
    await api.finance.deletePayment(id);
    load();
  };

  const handleBudgetSave = () => {
    const val = budgetInput.trim() === "" ? null : parseFloat(budgetInput);
    onBudgetChange?.(val);
  };

  if (!finance) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Финансы</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Бюджет</p>
            <p className="font-semibold">{formatMoney(finance.budget)}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Оплачено</p>
            <p className="font-semibold text-green-600 dark:text-green-400">{formatMoney(finance.paid)}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Остаток</p>
            <p className="font-semibold">{formatMoney(finance.remaining)}</p>
          </div>
        </div>

        {editableBudget && isStaff(user?.role) && onBudgetChange && (
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Бюджет</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="0"
              />
            </div>
            <Button type="button" size="sm" onClick={handleBudgetSave}>
              Сохранить
            </Button>
          </div>
        )}

        {isStaff(user?.role) && (
          <form onSubmit={handleAddPayment} className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Добавить платёж</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="0"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Сумма"
                required
              />
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Комментарий" />
            </div>
            <Button type="submit" size="sm" className="w-full">
              <Plus className="h-4 w-4" /> Записать оплату
            </Button>
          </form>
        )}

        {finance.payments.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">История платежей</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {finance.payments
                .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm rounded-lg bg-muted/40 px-3 py-2">
                    <div>
                      <p className="font-medium">{formatMoney(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.paidAt)}
                        {p.note ? ` · ${p.note}` : ""}
                      </p>
                    </div>
                    {isStaff(user?.role) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeletePayment(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
