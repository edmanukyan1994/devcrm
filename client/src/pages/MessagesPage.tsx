import { useEffect, useRef, useState } from "react";
import { isStaff } from "@/lib/roles";
import { Link, useParams } from "react-router-dom";
import { Image, Mic, Paperclip, Plus, Send, Square } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { MessageBubble, messagePreview } from "@/components/MessageBubble";
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
import { getInitials } from "@/lib/utils";
import type { Conversation, ConversationDetail, User } from "@/types";

function otherParticipant(conversation: Conversation, currentUserId: string) {
  return conversation.participants?.find((p) => p.userId !== currentUserId)?.user;
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
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadList = () => api.messages.list().then((r) => setConversations(r.conversations));

  const reloadActive = async (conversationId: string) => {
    const { conversation } = await api.messages.get(conversationId);
    setActive(conversation);
    loadList();
  };

  useEffect(() => {
    loadList();
    if (isStaff(user?.role)) {
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

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      mediaRecorderRef.current?.stop();
    };
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!active || !text.trim()) return;
    await api.messages.send(active.id, text.trim());
    setText("");
    await reloadActive(active.id);
  };

  const handleMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFileUpload = async (file: File, type?: "IMAGE" | "FILE" | "VOICE", duration?: number) => {
    if (!active) return;
    await api.messages.sendMedia(active.id, file, { type, duration });
    await reloadActive(active.id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, asImage: boolean) => {
    const file = e.target.files?.[0];
    if (file) void handleFileUpload(file, asImage ? "IMAGE" : "FILE");
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const duration = Math.round((Date.now() - recordStartRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        if (active && duration >= 1) {
          await handleFileUpload(file, "VOICE", duration);
        }
        setRecording(false);
        setRecordSeconds(0);
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      };
      mediaRecorderRef.current = recorder;
      recordStartRef.current = Date.now();
      recorder.start();
      setRecording(true);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds(Math.round((Date.now() - recordStartRef.current) / 1000));
      }, 500);
    } catch {
      alert("Нет доступа к микрофону");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
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
        {isStaff(user?.role) && (
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
            const last = c.messages?.[0];
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
                      {last && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {messagePreview(last)}
                        </p>
                      )}
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
                  <MessageBubble key={m.id} message={m} isMine={m.senderId === user?.id} />
                ))}
                <div ref={bottomRef} />
              </div>

              {recording ? (
                <div className="border-t border-border p-4 flex items-center justify-between gap-3 bg-destructive/10">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    Запись {recordSeconds}с
                  </div>
                  <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
                    <Square className="h-4 w-4" /> Отправить
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSend} className="border-t border-border p-4 space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, true)}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, false)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => imageInputRef.current?.click()}
                      title="Фото"
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      title="Файл"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="shrink-0"
                      onClick={startRecording}
                      title="Голосовое"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={handleMessageKeyDown}
                      placeholder="Сообщение... (Enter — отправить)"
                      className="min-h-[44px] max-h-24 flex-1"
                      rows={1}
                    />
                    <Button type="submit" size="icon" disabled={!text.trim()} className="shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}
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
