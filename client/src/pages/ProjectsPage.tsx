import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectCover } from "@/components/ProjectCover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import type { Project, User } from "@/types";

export function ProjectsPage() {
  const { user } = useAuth();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", clientId: "" });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const load = () => api.projects.list().then((r) => setProjects(r.projects));

  useEffect(() => {
    load();
    if (user?.role === "DEVELOPER") {
      api.auth.users("CLIENT").then((r) => setClients(r.users));
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { project } = await api.projects.create(form);
    if (coverFile) await api.projects.uploadCover(project.id, coverFile);
    setOpen(false);
    setForm({ name: "", description: "", clientId: "" });
    setCoverFile(null);
    load();
  };

  const handleDelete = async (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Удалить проект «${project.name}»? Все заказы и задачи будут удалены.`)) return;
    await api.projects.delete(project.id);
    load();
  };

  const handleCoverChange = async (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await api.projects.uploadCover(project.id, file);
      load();
    };
    input.click();
  };

  return (
    <div className="page-section">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="page-subtitle">Проекты</p>
          <h1 className="page-title">Все проекты</h1>
        </div>
        {user?.role === "DEVELOPER" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Новый
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новый проект</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Заказчик</Label>
                  <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Заказчик из списка" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.profile?.firstName} {c.profile?.lastName} · {c.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Обложка</Label>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                  />
                  <Button type="button" variant="outline" className="w-full" onClick={() => coverInputRef.current?.click()}>
                    <ImagePlus className="h-4 w-4" />
                    {coverFile ? coverFile.name : "Выбрать изображение"}
                  </Button>
                </div>
                <Button type="submit" className="w-full">Создать</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="group relative">
            <Link to={`/projects/${project.id}`} className="cursor-pointer block">
              <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-foreground/20 pt-0 gap-0">
                <ProjectCover name={project.name} coverImage={project.coverImage} className="h-36" />
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{project.description || "—"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {project.client?.profile?.firstName} {project.client?.profile?.lastName}
                    </span>
                    <span>{project._count?.orders ?? 0} заказов</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
            {user?.role === "DEVELOPER" && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 shadow-md"
                  onClick={(e) => handleCoverChange(e, project)}
                  title="Сменить обложку"
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 shadow-md"
                  onClick={(e) => handleDelete(e, project)}
                  title="Удалить проект"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-center text-muted-foreground py-20">Проектов пока нет</p>
      )}
    </div>
  );
}
