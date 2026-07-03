export type MessageType = "TEXT" | "VOICE" | "IMAGE" | "FILE";

export interface MessageAttachment {
  id: string;
  messageId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  duration?: number | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId?: string | null;
  projectId?: string | null;
  amount: number | string;
  note?: string | null;
  paidAt: string;
  createdAt: string;
}

export interface FinanceSummary {
  totalBudget: number;
  totalPaid: number;
  totalRemaining: number;
  projects: Array<{
    id: string;
    name: string;
    budget: number;
    paid: number;
    remaining: number;
  }>;
}

export type Role = "OWNER" | "DEVELOPER" | "CLIENT";

export type OrderStatus = "NEW" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "CANCELLED";
export type ProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED";
export type TaskStatus = "NEW" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  company?: string | null;
  phone?: string | null;
  avatar?: string | null;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  profile?: Profile | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  budget?: number | string | null;
  status?: ProjectStatus;
  deadline?: string | null;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    email: string;
    profile?: Profile | null;
  };
  _count?: { orders: number };
  orders?: Order[];
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Order {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: OrderStatus;
  budget?: number | string | null;
  deadline?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; clientId?: string };
  tasks?: Task[];
  comments?: Comment[];
  attachments?: Attachment[];
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  orderId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    title: string;
    project: { id: string; name: string; clientId: string };
  };
  comments?: Comment[];
  attachments?: Attachment[];
  _count?: { comments: number; attachments: number };
}

export interface Comment {
  id: string;
  taskId?: string | null;
  orderId?: string | null;
  projectId?: string | null;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    role: Role;
    profile?: Profile | null;
  };
}

export interface Attachment {
  id: string;
  taskId?: string | null;
  orderId?: string | null;
  projectId?: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
  uploadedBy?: {
    profile?: Profile | null;
  };
}

export interface TimelineEvent {
  id: string;
  type: "order" | "task";
  title: string;
  deadline: string | null;
  status: string;
  priority?: TaskPriority;
  project?: { id: string; name: string };
  order?: { id: string; title: string; project: { id: string; name: string } };
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    role: Role;
    profile?: Profile | null;
  };
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string } | null;
  participants?: Array<{
    userId: string;
    user: {
      id: string;
      role: Role;
      profile?: Profile | null;
    };
  }>;
  messages?: DirectMessage[];
}

export interface ConversationDetail extends Conversation {
  messages: DirectMessage[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Руководитель",
  DEVELOPER: "Исполнитель",
  CLIENT: "Заказчик",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Активен",
  PAUSED: "На паузе",
  COMPLETED: "Завершён",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Новый",
  IN_PROGRESS: "В работе",
  REVIEW: "Проверка",
  COMPLETED: "Готово",
  CANCELLED: "Отменён",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  REVIEW: "Проверка",
  DONE: "Готово",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  URGENT: "Срочный",
};
