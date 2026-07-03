import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
  PRIORITY_LABELS,
  type OrderStatus,
  type ProjectStatus,
  type TaskStatus,
  type TaskPriority,
} from "@/types";

const projectVariant: Record<ProjectStatus, "secondary" | "warning" | "outline" | "success"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "secondary",
};

const orderVariant: Record<OrderStatus, "secondary" | "warning" | "outline" | "success" | "destructive"> = {
  NEW: "secondary",
  IN_PROGRESS: "warning",
  REVIEW: "outline",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const taskVariant: Record<TaskStatus, "secondary" | "warning" | "outline" | "success"> = {
  NEW: "secondary",
  IN_PROGRESS: "warning",
  REVIEW: "outline",
  DONE: "success",
};

const priorityVariant: Record<TaskPriority, "secondary" | "outline" | "warning" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "outline",
  HIGH: "warning",
  URGENT: "destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={orderVariant[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={projectVariant[status]}>{PROJECT_STATUS_LABELS[status]}</Badge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={taskVariant[status]}>{TASK_STATUS_LABELS[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={priorityVariant[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}
