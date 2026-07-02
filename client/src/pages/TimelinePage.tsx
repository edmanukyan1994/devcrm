import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatusBadge, TaskStatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import type { Project, TimelineEvent } from "@/types";

export function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("all");

  useEffect(() => {
    api.projects.list().then((r) => setProjects(r.projects));
  }, []);

  useEffect(() => {
    const pid = projectId === "all" ? undefined : projectId;
    api.timeline.get({ projectId: pid }).then((r) => setEvents(r.events));
  }, [projectId]);

  const grouped = events.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
    if (!event.deadline) return acc;
    const key = new Date(event.deadline).toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="page-section">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="page-subtitle">Сроки</p>
          <h1 className="page-title">Таймлайн</h1>
        </div>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Проект" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все проекты</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <div className="relative space-y-8 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
        {sortedDates.map((date) => (
          <div key={date} className="relative pl-10">
            <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-foreground bg-background" />
            <p className="text-sm font-semibold mb-4">{formatDate(date)}</p>
            <div className="space-y-3">
              {grouped[date].map((event) => (
                <Link
                  key={`${event.type}-${event.id}`}
                  to={event.type === "order" ? `/orders/${event.id}` : `/tasks/${event.id}`}
                  className="block cursor-pointer"
                >
                  <Card className={cn("transition-all hover:shadow-md", isOverdue(event.deadline) && "border-destructive/50")}>
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.type === "order" ? event.project?.name : event.order?.project.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.type === "task" && event.priority && (
                          <PriorityBadge priority={event.priority} />
                        )}
                        {event.type === "order" ? (
                          <OrderStatusBadge status={event.status as import("@/types").OrderStatus} />
                        ) : (
                          <TaskStatusBadge status={event.status as import("@/types").TaskStatus} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
        {sortedDates.length === 0 && (
          <p className="text-center text-muted-foreground py-20">Нет событий с дедлайнами</p>
        )}
      </div>
    </div>
  );
}
