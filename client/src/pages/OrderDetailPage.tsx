import { useEffect, useState } from "react";
import { isStaff } from "@/lib/roles";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FinancePanel } from "@/components/FinancePanel";
import { EntityDiscussion } from "@/components/EntityDiscussion";
import { EntityFiles } from "@/components/EntityFiles";
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
import { PRIORITY_LABELS, ORDER_STATUS_LABELS, type Order, type OrderStatus, type TaskPriority } from "@/types";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "NEW" as OrderStatus,
    deadline: "",
    budget: "",
  });
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

  const handleDelete = async () => {
    if (!order) return;
    if (!confirm(`Удалить заказ «${order.title}»? Все задачи будут удалены.`)) return;
    await api.orders.delete(order.id);
    navigate("/orders");
  };

  const openEdit = () => {
    if (!order) return;
    setEditForm({
      title: order.title,
      description: order.description || "",
      status: order.status,
      deadline: order.deadline ? order.deadline.slice(0, 10) : "",
      budget: order.budget != null ? String(order.budget) : "",
    });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const { order: updated } = await api.orders.update(order.id, {
      title: editForm.title,
      description: editForm.description,
      status: editForm.status,
      deadline: editForm.deadline || null,
      budget: editForm.budget.trim() === "" ? null : parseFloat(editForm.budget),
    });
    setOrder({ ...order, ...updated });
    setEditOpen(false);
  };

  const handleBudgetChange = async (budget: number | null) => {
    if (!order) return;
    const { order: updated } = await api.orders.update(order.id, { budget });
    setOrder({ ...order, ...updated });
  };

  if (!order) return null;

  return (
    <div className="page-section">
      <header className="space-y-4">
        <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground">← Заказы</Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 min-w-0">
            <p className="page-subtitle">{order.project?.name}</p>
            <h1 className="page-title break-words">{order.title}</h1>
            {order.description && <p className="text-muted-foreground max-w-2xl">{order.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <OrderStatusBadge status={order.status} />
            {isStaff(user?.role) && (
              <>
                <Button size="sm" variant="outline" onClick={openEdit}>
                  <Pencil className="h-4 w-4" />
                  Изменить
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </Button>
              </>
            )}
          </div>
        </div>
        {order.deadline && (
          <p className="text-sm text-muted-foreground">Дедлайн: {formatDate(order.deadline)}</p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-2">
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

        <div className="grid gap-8 md:grid-cols-2 pt-4 border-t border-border">
          <EntityDiscussion type="order" entityId={order.id} initialComments={order.comments} onUpdate={load} />
          <EntityFiles type="order" entityId={order.id} initialAttachments={order.attachments} onUpdate={load} />
        </div>
      </section>
        </div>
        <FinancePanel
          orderId={order.id}
          budget={order.budget}
          editableBudget={isStaff(user?.role)}
          onBudgetChange={handleBudgetChange}
        />
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать заказ</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as OrderStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Дедлайн</Label>
                <Input type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Бюджет</Label>
              <Input type="number" min="0" value={editForm.budget} onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Сохранить</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
