import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/StatusBadge";
import type { Project } from "@/types";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (id) api.projects.get(id).then((r) => setProject(r.project));
  }, [id]);

  if (!project) return null;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Проект</p>
        <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground max-w-2xl">{project.description}</p>
        )}
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Заказы</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {project.orders?.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="cursor-pointer">
              <Card className="transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-base">{order.title}</CardTitle>
                  <OrderStatusBadge status={order.status} />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{order._count?.tasks ?? 0} правок</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {(!project.orders || project.orders.length === 0) && (
          <p className="text-muted-foreground py-8 text-center">Заказов нет</p>
        )}
      </section>

      {user?.role === "DEVELOPER" && (
        <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground">
          Управление заказами →
        </Link>
      )}
    </div>
  );
}
