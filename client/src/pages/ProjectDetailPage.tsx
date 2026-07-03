import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImagePlus, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectCover } from "@/components/ProjectCover";
import { FinancePanel } from "@/components/FinancePanel";
import { EntityDiscussion } from "@/components/EntityDiscussion";
import { EntityFiles } from "@/components/EntityFiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatusBadge, ProjectStatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { PROJECT_STATUS_LABELS, type Project, type ProjectStatus, type User } from "@/types";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<User[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    clientId: "",
    status: "ACTIVE" as ProjectStatus,
    deadline: "",
  });

  const load = () => {
    if (id) api.projects.get(id).then((r) => setProject(r.project));
  };

  useEffect(() => {
    load();
    if (user?.role === "DEVELOPER") {
      api.auth.users("CLIENT").then((r) => setClients(r.users));
    }
  }, [id, user]);

  const handleDelete = async () => {
    if (!project) return;
    if (!confirm(`Удалить проект «${project.name}»? Все заказы и задачи будут удалены.`)) return;
    await api.projects.delete(project.id);
    navigate("/projects");
  };

  const handleCoverUpload = async (file: File) => {
    if (!project) return;
    const { project: updated } = await api.projects.uploadCover(project.id, file);
    setProject({ ...project, ...updated });
  };

  const openEdit = () => {
    if (!project) return;
    setEditForm({
      name: project.name,
      description: project.description || "",
      clientId: project.clientId,
      status: project.status || "ACTIVE",
      deadline: project.deadline ? project.deadline.slice(0, 10) : "",
    });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    const { project: updated } = await api.projects.update(project.id, {
      ...editForm,
      deadline: editForm.deadline || null,
    });
    setProject({ ...project, ...updated });
    setEditOpen(false);
  };

  const handleBudgetChange = async (budget: number | null) => {
    if (!project) return;
    const { project: updated } = await api.projects.update(project.id, { budget });
    setProject({ ...project, ...updated });
  };

  if (!project) return null;

  return (
    <div className="page-section">
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <ProjectCover name={project.name} coverImage={project.coverImage} className="h-48 sm:h-64 rounded-none" />
        {user?.role === "DEVELOPER" && (
          <div className="absolute top-3 right-3 flex flex-wrap gap-2 justify-end max-w-[70%]">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverUpload(file);
                e.target.value = "";
              }}
            />
            <Button size="sm" variant="secondary" onClick={() => coverInputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="bg-background/80" onClick={openEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <header className="space-y-3 mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="page-subtitle">Проект</p>
          {project.status && <ProjectStatusBadge status={project.status} />}
        </div>
        <h1 className="page-title break-words">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground max-w-2xl whitespace-pre-wrap">{project.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            Заказчик: {project.client?.profile?.firstName} {project.client?.profile?.lastName}
          </span>
          {project.deadline && <span>Дедлайн: {formatDate(project.deadline)}</span>}
          <Link to="/messages" className="inline-flex items-center gap-1 hover:text-foreground">
            <MessageSquare className="h-3.5 w-3.5" /> Чат с клиентом
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3 mt-8">
        <div className="lg:col-span-2 space-y-8">
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

          <div className="grid gap-8 md:grid-cols-2">
            <EntityDiscussion type="project" entityId={project.id} initialComments={project.comments} onUpdate={load} />
            <EntityFiles type="project" entityId={project.id} initialAttachments={project.attachments} onUpdate={load} />
          </div>
        </div>

        <FinancePanel
          projectId={project.id}
          budget={project.budget}
          editableBudget={user?.role === "DEVELOPER"}
          onBudgetChange={handleBudgetChange}
        />
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать проект</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Описание / бриф</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as ProjectStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>
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
              <Label>Заказчик</Label>
              <Select value={editForm.clientId} onValueChange={(v) => setEditForm({ ...editForm, clientId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.profile?.firstName} {c.profile?.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Сохранить</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
