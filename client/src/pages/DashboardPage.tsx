import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, FolderKanban, Layers } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/StatusBadge";
import { formatDate, isOverdue } from "@/lib/utils";
import type { Order, Project, TimelineEvent } from "@/types";

export function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    Promise.all([api.projects.list(), api.orders.list(), api.timeline.get()]).then(
      ([p, o, t]) => {
        setProjects(p.projects);
        setOrders(o.orders);
        setEvents(t.events.slice(0, 5));
      }
    );
  }, []);

  const activeOrders = orders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status));
  const upcoming = events.filter((e) => e.deadline && !isOverdue(e.deadline));

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Обзор</p>
        <h1 className="text-4xl font-bold tracking-tight">
          {user?.profile?.firstName ? `${user.profile.firstName}` : "Панель"}
        </h1>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Проекты</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{projects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Активные заказы</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ближайшие сроки</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{upcoming.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Заказы</h2>
            <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              Все <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeOrders.slice(0, 5).map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="block cursor-pointer">
                <Card className="transition-all duration-200 hover:shadow-md hover:border-foreground/20">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{order.title}</p>
                      <p className="text-xs text-muted-foreground">{order.project?.name}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </CardContent>
                </Card>
              </Link>
            ))}
            {activeOrders.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Нет активных заказов</p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Сроки</h2>
            <Link to="/timeline" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              Календарь <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {events.map((event) => (
              <Card key={`${event.type}-${event.id}`}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{event.type === "order" ? "Заказ" : "Правка"}</p>
                  </div>
                  <span className={`text-sm ${isOverdue(event.deadline) ? "text-destructive" : "text-muted-foreground"}`}>
                    {formatDate(event.deadline)}
                  </span>
                </CardContent>
              </Card>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Нет предстоящих сроков</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
