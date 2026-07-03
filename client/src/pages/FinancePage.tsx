import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import type { FinanceSummary } from "@/types";

export function FinancePage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);

  useEffect(() => {
    api.finance.summary().then((r) => setSummary(r.summary));
  }, []);

  if (!summary) return null;

  return (
    <div className="page-section">
      <header className="space-y-2">
        <p className="page-subtitle">Финансы</p>
        <h1 className="page-title">Обзор оплат</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Общий бюджет</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatMoney(summary.totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Оплачено</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatMoney(summary.totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Остаток</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatMoney(summary.totalRemaining)}</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3 mt-8">
        <h2 className="text-lg font-semibold">По проектам</h2>
        {summary.projects.map((p) => (
          <Link key={p.id} to={`/projects/${p.id}`} className="block cursor-pointer">
            <Card className="transition-all hover:shadow-md">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatMoney(p.paid)} из {formatMoney(p.budget)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(p.remaining)}</p>
                  <p className="text-xs text-muted-foreground">остаток</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {summary.projects.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Нет данных по проектам</p>
        )}
      </section>

      {user?.role === "CLIENT" && (
        <p className="text-sm text-muted-foreground mt-6">
          Здесь отображаются бюджеты и оплаты по вашим проектам.
        </p>
      )}
    </div>
  );
}
