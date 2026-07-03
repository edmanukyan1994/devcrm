import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime, getInitials } from "@/lib/utils";
import type { Comment } from "@/types";

type EntityType = "project" | "order" | "task";

interface EntityDiscussionProps {
  type: EntityType;
  entityId: string;
  initialComments?: Comment[];
  onUpdate?: () => void;
}

export function EntityDiscussion({ type, entityId, initialComments, onUpdate }: EntityDiscussionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    const fetcher =
      type === "project"
        ? api.comments.listProject(entityId)
        : type === "order"
          ? api.comments.listOrder(entityId)
          : api.comments.list(entityId);
    fetcher.then((r) => setComments(r.comments));
  };

  useEffect(() => {
    if (initialComments) setComments(initialComments);
    else load();
  }, [entityId, type]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const payload =
        type === "project"
          ? { projectId: entityId, content: text.trim() }
          : type === "order"
            ? { orderId: entityId, content: text.trim() }
            : { taskId: entityId, content: text.trim() };
      await api.comments.create(payload);
      setText("");
      load();
      onUpdate?.();
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Обсуждение</h2>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
        {comments.map((c) => (
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
                <CardContent className="p-3 text-sm whitespace-pre-wrap">{c.content}</CardContent>
              </Card>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Пока нет комментариев</p>
        )}
      </div>
      <form onSubmit={handleSend} className="flex flex-col gap-3 sm:flex-row">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Комментарий..."
          className="min-h-[48px] max-h-32 flex-1"
          rows={1}
        />
        <Button type="submit" size="icon" disabled={sending || !text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </section>
  );
}
