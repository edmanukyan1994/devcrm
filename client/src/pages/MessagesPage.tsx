import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime, getInitials } from "@/lib/utils";
import type { Conversation, ConversationDetail, DirectMessage, User } from "@/types";

function otherParticipant(conversation: Conversation, currentUserId: string) {
  return conversation.participants?.find((p) => p.userId !== currentUserId)?.user;
}

function lastMessage(conversation: Conversation): DirectMessage | undefined {
  return conversation.messages?.[0];
}

export function MessagesPage() {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<ConversationDetail | null>(null);
  const [text, setText] = useState("");
  const [clients, setClients] = useState<User[]>([]);
  const [newUserId, setNewUserId] = useState("");
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadList = () => api.messages.list().then((r) => setConversations(r.conversations));

  useEffect(() => {
    loadList();
    if (user?.role === "DEVELOPER") {
      api.auth.users("CLIENT").then((r) => setClients(r.users));
    }
  }, [user]);

  useEffect(() => {
    if (id) {
      api.messages.get(id).then((r) => setActive(r.conversation));
    } else {
      setActive(null);
    }
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !text.trim()) return;
    await api.messages.send(active.id, text.trim());
    setText("");
    const { conversation } = await api.messages.get(active.id);
    setActive(conversation);
    loadList();
  };

  const handleNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId) return;
    const { conversation } = await api.messages.create(newUserId);
    setOpen(false);
    setNewUserId("");
    loadList();
    window.location.href = `/messages/${conversation.id}`;
  };

  const activeId = id || active?.id;

  return (
    <div className="page-section">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="page-subtitle">Коммуникация</p>
          <h1 className="page-title">Сообщения</h1>
        </div>
        {user?.role === "DEVELOPER" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4" /> Новый чат</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Написать заказчику</DialogTitle></DialogHeader>
              <form onSubmit={handleNewChat} className="space-y-4">
                <div className="space-y-2">
                  <Label>Заказчик</Label>
                  <Select value={newUserId} onValueChange={setNewUserId}>
                    <SelectTrigger><SelectValue placeholder="Выберите пользователя" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.profile?.firstName} {c.profile?.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Создать</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6 min-h-[60vh]">
        <div className={`space-y-2 lg:col-span-2 ${activeId ? "hidden lg:block" : ""}`}>
          {conversations.map((c) => {
            const other = user ? otherParticipant(c, user.id) : null;
            const last = lastMessage(c);
            return (
              <Link key={c.id} to={`/messages/${c.id}`} className="block cursor-pointer">
                <Card className={`transition-all hover:shadow-md ${c.id === activeId ? "border-foreground/30" : ""}`}>
                  <CardContent className="flex gap-3 py-4">
                    <Avatar>
                      <AvatarFallback>{getInitials(other?.profile?.firstName, other?.profile?.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {other?.profile?.firstName} {other?.profile?.lastName}
                      </p>
                      {c.project && <p className="text-xs text-muted-foreground">{c.project.name}</p>}
                      {last && <p className="text-sm text-muted-foreground truncate mt-1">{last.content}</p>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {conversations.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Нет диалогов</p>
          )}
        </div>

        <div className={`lg:col-span-3 flex flex-col rounded-2xl border border-border bg-card min-h-[400px] ${!activeId ? "hidden lg:flex" : "flex"}`}>
          {active ? (
            <>
              <div className="border-b border-border p-4 flex items-center gap-3">
                <Link to="/messages" className="lg:hidden text-sm text-muted-foreground">←</Link>
                <div>
                  <p className="font-medium">
                    {otherParticipant(active, user!.id)?.profile?.firstName}{" "}
                    {otherParticipant(active, user!.id)?.profile?.lastName}
                  </p>
                  {active.project && <p className="text-xs text-muted-foreground">{active.project.name}</p>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {active.messages?.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-1 ${m.senderId === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="border-t border-border p-4 flex gap-2">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Сообщение..."
                  className="min-h-[44px] max-h-24 flex-1"
                  rows={1}
                />
                <Button type="submit" size="icon" disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Выберите диалог
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
