import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
  type Project,
} from "@/types";

const KANBAN_COLUMNS: OrderStatus[] = ["NEW", "IN_PROGRESS", "REVIEW", "COMPLETED"];

export function OrdersPage() {
  const { user } = useAuth();
  const [columns, setColumns] = useState<Record<string, Order[]>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: "",
    deadline: "",
  });

  const load = () => {
    const pid = projectId === "all" ? undefined : projectId;
    api.orders.kanban(pid).then((r) => setColumns(r.columns));
  };

  useEffect(() => {
    load();
    api.projects.list().then((r) => setProjects(r.projects));
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.orders.create({
      ...form,
      deadline: form.deadline || undefined,
    });
    setOpen(false);
    setForm({ projectId: "", title: "", description: "", deadline: "" });
    load();
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await api.orders.update(orderId, { status });
    load();
  };

  const handleDelete = async (order: Order) => {
    if (!confirm(`Удалить заказ «${order.title}»? Все задачи будут удалены.`)) return;
    await api.orders.delete(order.id);
    load();
  };

  return (
    <div className="page-section">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="page-subtitle">Заказы</p>
          <h1 className="page-title">Канбан</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Проект" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все проекты</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {user?.role === "DEVELOPER" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" /> Заказ</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новый заказ</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Проект</Label>
                    <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                      <SelectTrigger><SelectValue placeholder="Проект" /></SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Дедлайн</Label>
                    <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">Создать</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <div className="kanban-scroll lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:snap-none">
        {KANBAN_COLUMNS.map((status) => (
          <div key={status} className="kanban-column space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {ORDER_STATUS_LABELS[status]}
              </h3>
              <span className="text-xs text-muted-foreground">{(columns[status] || []).length}</span>
            </div>
            <div className="space-y-3 min-h-[200px] rounded-2xl bg-muted/40 p-3">
              {(columns[status] || []).map((order) => (
                <Card key={order.id} className="shadow-sm transition-all hover:shadow-md">
                  <CardContent className="p-4 space-y-3">
                    <Link to={`/orders/${order.id}`} className="block cursor-pointer">
                      <p className="font-medium leading-snug">{order.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{order.project?.name}</p>
                    </Link>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{formatDate(order.deadline)}</span>
                      <span className="text-xs text-muted-foreground">{order._count?.tasks ?? 0} правок</span>
                    </div>
                    {user?.role === "DEVELOPER" && (
                      <div className="flex items-center gap-2">
                        {status !== "COMPLETED" && (
                          <Select
                            value={order.status}
                            onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {KANBAN_COLUMNS.map((s) => (
                                <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(order)}
                          title="Удалить заказ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
