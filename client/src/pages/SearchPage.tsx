import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge, TaskStatusBadge } from "@/components/StatusBadge";
import type { Order, Project, Task } from "@/types";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [results, setResults] = useState<{
    projects: Project[];
    orders: Order[];
    tasks: Task[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = params.get("q") || "";
    setQuery(q);
    if (q.length >= 2) {
      setLoading(true);
      api.search(q).then((r) => {
        setResults({ projects: r.projects, orders: r.orders, tasks: r.tasks });
        setLoading(false);
      });
    } else {
      setResults(null);
    }
  }, [params]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setParams({ q: query.trim() });
    }
  };

  return (
    <div className="page-section">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="page-subtitle">Поиск</p>
          <h1 className="page-title">Найти в CRM</h1>
        </div>
        <form onSubmit={handleSubmit} className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Проекты, заказы, правки..."
            className="pl-10"
            autoFocus
          />
        </form>
      </header>

      {loading && <p className="text-muted-foreground">Поиск...</p>}

      {results && !loading && (
        <div className="space-y-8 mt-6">
          {results.projects.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Проекты ({results.projects.length})
              </h2>
              {results.projects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="block cursor-pointer">
                  <Card className="hover:shadow-md transition-all">
                    <CardContent className="py-4">
                      <p className="font-medium">{p.name}</p>
                      {p.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{p.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </section>
          )}

          {results.orders.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Заказы ({results.orders.length})
              </h2>
              {results.orders.map((o) => (
                <Link key={o.id} to={`/orders/${o.id}`} className="block cursor-pointer">
                  <Card className="hover:shadow-md transition-all">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{o.title}</p>
                        <p className="text-sm text-muted-foreground">{o.project?.name}</p>
                      </div>
                      <OrderStatusBadge status={o.status} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </section>
          )}

          {results.tasks.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Правки ({results.tasks.length})
              </h2>
              {results.tasks.map((t) => (
                <Link key={t.id} to={`/tasks/${t.id}`} className="block cursor-pointer">
                  <Card className="hover:shadow-md transition-all">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{t.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.order?.project?.name} · {t.order?.title}
                        </p>
                      </div>
                      <TaskStatusBadge status={t.status} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </section>
          )}

          {results.projects.length === 0 &&
            results.orders.length === 0 &&
            results.tasks.length === 0 && (
              <p className="text-center text-muted-foreground py-16">Ничего не найдено</p>
            )}
        </div>
      )}

      {(!params.get("q") || params.get("q")!.length < 2) && (
        <p className="text-center text-muted-foreground py-16">Введите минимум 2 символа</p>
      )}
    </div>
  );
}
