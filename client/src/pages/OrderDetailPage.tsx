import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { OrderStatusBadge, TaskStatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { PRIORITY_LABELS, type Order, type TaskPriority } from "@/types";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as TaskPriority,
    deadline: "",
  });

  const load = () => {
    if (id) api.orders.get(id).then((r) => setOrder(r.order));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await api.tasks.create({
      orderId: id,
      title: form.title,
      description: form.description,
      priority: form.priority,
      deadline: form.deadline || undefined,
    });
    setOpen(false);
    setForm({ title: "", description: "", priority: "MEDIUM", deadline: "" });
    load();
  };

  if (!order) return null;

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground">← Заказы</Link>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{order.project?.name}</p>
            <h1 className="text-4xl font-bold tracking-tight">{order.title}</h1>
            {order.description && <p className="text-muted-foreground max-w-2xl">{order.description}</p>}
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        {order.deadline && (
          <p className="text-sm text-muted-foreground">Дедлайн: {formatDate(order.deadline)}</p>
        )}
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Правки</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4" /> Правка</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новая правка</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Приоритет</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                          <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Дедлайн</Label>
                    <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" className="w-full">Создать</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {order.tasks?.map((task) => (
            <Link key={task.id} to={`/tasks/${task.id}`} className="block cursor-pointer">
              <Card className="transition-all hover:shadow-md hover:border-foreground/20">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base font-medium">{task.title}</CardTitle>
                  <div className="flex gap-2">
                    <PriorityBadge priority={task.priority} />
                    <TaskStatusBadge status={task.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span>{formatDate(task.deadline)}</span>
                    <span>{task._count?.comments ?? 0} коммент.</span>
                    <span>{task._count?.attachments ?? 0} файлов</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {(!order.tasks || order.tasks.length === 0) && (
            <p className="text-center text-muted-foreground py-12">Правок пока нет</p>
          )}
        </div>
      </section>
    </div>
  );
}
