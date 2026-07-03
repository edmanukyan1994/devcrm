import { Download, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { DirectMessage } from "@/types";

interface MessageBubbleProps {
  message: DirectMessage;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const att = message.attachments?.[0];

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm space-y-2 ${
          isMine ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {message.type === "VOICE" && att && (
          <audio controls src={att.path} className="w-full max-w-xs h-9" preload="metadata" />
        )}

        {message.type === "IMAGE" && att && (
          <a href={att.path} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={att.path}
              alt={message.content || att.originalName}
              className="max-w-full max-h-64 rounded-xl object-cover"
            />
          </a>
        )}

        {message.type === "FILE" && att && (
          <a
            href={att.path}
            download={att.originalName}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
              isMine ? "bg-primary-foreground/10" : "bg-background"
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{att.originalName}</span>
            <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </a>
        )}

        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}

        <p
          className={`text-[10px] ${
            isMine ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {formatDateTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function messagePreview(message?: DirectMessage) {
  if (!message) return "";
  if (message.type === "VOICE") return "🎤 Голосовое";
  if (message.type === "IMAGE") return message.content || "📷 Фото";
  if (message.type === "FILE") return message.content || "📎 Файл";
  return message.content;
}
