import { useEffect, useRef, useState } from "react";
import { Paperclip, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { Attachment } from "@/types";

type EntityType = "project" | "order" | "task";

interface EntityFilesProps {
  type: EntityType;
  entityId: string;
  initialAttachments?: Attachment[];
  onUpdate?: () => void;
}

export function EntityFiles({ type, entityId, initialAttachments, onUpdate }: EntityFilesProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments || []);

  const load = () => {
    const fetcher =
      type === "project"
        ? api.attachments.listProject(entityId)
        : type === "order"
          ? api.attachments.listOrder(entityId)
          : api.attachments.list(entityId);
    fetcher.then((r) => setAttachments(r.attachments));
  };

  useEffect(() => {
    if (initialAttachments) setAttachments(initialAttachments);
    else load();
  }, [entityId, type]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "project") await api.attachments.uploadProject(entityId, file);
    else if (type === "order") await api.attachments.uploadOrder(entityId, file);
    else await api.attachments.upload(entityId, file);
    if (fileRef.current) fileRef.current.value = "";
    load();
    onUpdate?.();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить файл?")) return;
    await api.attachments.delete(id);
    load();
    onUpdate?.();
  };

  const isImage = (mime: string) => mime.startsWith("image/");

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Файлы</h2>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3 w-3" /> Загрузить
        </Button>
        <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.zip" className="hidden" onChange={handleUpload} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {attachments.map((att) => (
          <Card key={att.id}>
            <CardContent className="p-3">
              {isImage(att.mimeType) ? (
                <a href={att.path} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                  <img src={att.path} alt={att.originalName} className="rounded-lg w-full max-h-40 object-cover" />
                </a>
              ) : (
                <a
                  href={att.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm cursor-pointer hover:underline"
                >
                  <Paperclip className="h-4 w-4 shrink-0" />
                  <span className="truncate">{att.originalName}</span>
                </a>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{formatDateTime(att.createdAt)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(att.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {attachments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6 sm:col-span-2">Нет файлов</p>
        )}
      </div>
    </section>
  );
}
