import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Paperclip, Send, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TaskStatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { TASK_STATUS_LABELS, type Task, type TaskStatus } from "@/types";

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (id) api.tasks.get(id).then((r) => setTask(r.task));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleStatusChange = async (status: TaskStatus) => {
    if (!id) return;
    await api.tasks.update(id, { status });
    load();
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !comment.trim()) return;
    setSending(true);
    try {
      await api.comments.create(id, comment.trim());
      setComment("");
      load();
    } finally {
      setSending(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!id || !file) return;
    await api.attachments.upload(id, file);
    if (fileRef.current) fileRef.current.value = "";
    load();
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    await api.attachments.delete(attachmentId);
    load();
  };

  if (!task) return null;

  const isImage = (mime: string) => mime.startsWith("image/");

  return (
    <div className="page-section">
      <header className="space-y-4">
        <Link to={`/orders/${task.orderId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {task.order?.title}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="space-y-2 min-w-0 flex-1">
            <p className="page-subtitle">{task.order?.project.name}</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl break-words">{task.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <PriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} />
          </div>
        </div>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">{task.description}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="text-sm text-muted-foreground">Дедлайн: {formatDate(task.deadline)}</span>
          <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
            <SelectTrigger className="w-full sm:w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Обсуждение</h2>
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
            {task.comments?.map((c) => (
              <div key={c.id} className={`flex gap-3 ${c.userId === user?.id ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(c.user?.profile?.firstName, c.user?.profile?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] space-y-1 ${c.userId === user?.id ? "text-right" : ""}`}>
                  <p className="text-xs text-muted-foreground">
                    {c.user?.profile?.firstName} · {formatDateTime(c.createdAt)}
                  </p>
                  <Card className={c.userId === user?.id ? "bg-primary text-primary-foreground" : ""}>
                    <CardContent className="p-3 text-sm">{c.content}</CardContent>
                  </Card>
                </div>
              </div>
            ))}
            {(!task.comments || task.comments.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">Начните обсуждение</p>
            )}
          </div>
          <form onSubmit={handleSendComment} className="flex flex-col gap-3 sm:flex-row">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Сообщение..."
              className="min-h-[48px] max-h-32 flex-1"
              rows={1}
            />
            <Button type="submit" className="sm:w-10 sm:px-0" size="icon" disabled={sending || !comment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>

        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Файлы</h2>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3 w-3" /> Загрузить
            </Button>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
          </div>
          <div className="grid gap-3">
            {task.attachments?.map((att) => (
              <Card key={att.id}>
                <CardContent className="p-3">
                  {isImage(att.mimeType) ? (
                    <a href={att.path} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                      <img src={att.path} alt={att.originalName} className="rounded-lg w-full max-h-48 object-cover" />
                    </a>
                  ) : (
                    <a href={att.path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm cursor-pointer hover:underline">
                      <Paperclip className="h-4 w-4" />
                      {att.originalName}
                    </a>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{formatDateTime(att.createdAt)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteAttachment(att.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!task.attachments || task.attachments.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">Нет вложений</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
