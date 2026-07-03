const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || "Request failed", res.status);
  }

  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: import("@/types").User; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      company?: string;
      role?: string;
      inviteCode?: string;
    }) =>
      request<{ user: import("@/types").User; token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    becomeDeveloper: (inviteCode: string) =>
      request<{ user: import("@/types").User; token: string }>("/auth/become-developer", {
        method: "POST",
        body: JSON.stringify({ inviteCode }),
      }),
    me: () => request<{ user: import("@/types").User }>("/auth/me"),
    clients: () => request<{ clients: import("@/types").User[] }>("/auth/clients"),
    users: (role?: "CLIENT" | "DEVELOPER") =>
      request<{ users: import("@/types").User[] }>(
        `/auth/users${role ? `?role=${role}` : ""}`
      ),
    updateRole: (id: string, role: "CLIENT" | "DEVELOPER") =>
      request<{ user: import("@/types").User }>(`/auth/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    deleteUser: (id: string) =>
      request<{ success: boolean }>(`/auth/users/${id}`, { method: "DELETE" }),
  },
  projects: {
    list: () => request<{ projects: import("@/types").Project[] }>("/projects"),
    get: (id: string) => request<{ project: import("@/types").Project }>(`/projects/${id}`),
    create: (data: { name: string; description?: string; clientId: string }) =>
      request<{ project: import("@/types").Project }>("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ name: string; description: string; clientId: string; budget: number | null; status: string; deadline: string | null }>) =>
      request<{ project: import("@/types").Project }>(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ success: boolean }>(`/projects/${id}`, { method: "DELETE" }),
    uploadCover: (id: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return request<{ project: import("@/types").Project }>(`/projects/${id}/cover`, {
        method: "POST",
        body: form,
      });
    },
    removeCover: (id: string) =>
      request<{ project: import("@/types").Project }>(`/projects/${id}/cover`, { method: "DELETE" }),
  },
  orders: {
    list: (projectId?: string) =>
      request<{ orders: import("@/types").Order[] }>(
        `/orders${projectId ? `?projectId=${projectId}` : ""}`
      ),
    kanban: (projectId?: string) =>
      request<{ columns: Record<string, import("@/types").Order[]> }>(
        `/orders/kanban${projectId ? `?projectId=${projectId}` : ""}`
      ),
    get: (id: string) => request<{ order: import("@/types").Order }>(`/orders/${id}`),
    create: (data: {
      projectId: string;
      title: string;
      description?: string;
      status?: string;
      deadline?: string;
    }) =>
      request<{ order: import("@/types").Order }>("/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: Partial<{
        title: string;
        description: string;
        status: string;
        deadline: string | null;
        budget: number | null;
      }>
    ) =>
      request<{ order: import("@/types").Order }>(`/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ success: boolean }>(`/orders/${id}`, { method: "DELETE" }),
  },
  tasks: {
    listByOrder: (orderId: string) =>
      request<{ tasks: import("@/types").Task[] }>(`/tasks/order/${orderId}`),
    get: (id: string) => request<{ task: import("@/types").Task }>(`/tasks/${id}`),
    create: (data: {
      orderId: string;
      title: string;
      description: string;
      priority?: string;
      status?: string;
      deadline?: string;
    }) =>
      request<{ task: import("@/types").Task }>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: Partial<{
        title: string;
        description: string;
        priority: string;
        status: string;
        deadline: string | null;
      }>
    ) =>
      request<{ task: import("@/types").Task }>(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ success: boolean }>(`/tasks/${id}`, { method: "DELETE" }),
  },
  comments: {
    list: (taskId: string) =>
      request<{ comments: import("@/types").Comment[] }>(`/comments/task/${taskId}`),
    listProject: (projectId: string) =>
      request<{ comments: import("@/types").Comment[] }>(`/comments/project/${projectId}`),
    listOrder: (orderId: string) =>
      request<{ comments: import("@/types").Comment[] }>(`/comments/order/${orderId}`),
    create: (data: { taskId?: string; orderId?: string; projectId?: string; content: string }) =>
      request<{ comment: import("@/types").Comment }>("/comments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ success: boolean }>(`/comments/${id}`, { method: "DELETE" }),
  },
  attachments: {
    list: (taskId: string) =>
      request<{ attachments: import("@/types").Attachment[] }>(`/attachments/task/${taskId}`),
    listProject: (projectId: string) =>
      request<{ attachments: import("@/types").Attachment[] }>(`/attachments/project/${projectId}`),
    listOrder: (orderId: string) =>
      request<{ attachments: import("@/types").Attachment[] }>(`/attachments/order/${orderId}`),
    upload: (taskId: string, file: File) => {
      const form = new FormData();
      form.append("taskId", taskId);
      form.append("file", file);
      return request<{ attachment: import("@/types").Attachment }>("/attachments", {
        method: "POST",
        body: form,
      });
    },
    uploadProject: (projectId: string, file: File) => {
      const form = new FormData();
      form.append("projectId", projectId);
      form.append("file", file);
      return request<{ attachment: import("@/types").Attachment }>("/attachments", {
        method: "POST",
        body: form,
      });
    },
    uploadOrder: (orderId: string, file: File) => {
      const form = new FormData();
      form.append("orderId", orderId);
      form.append("file", file);
      return request<{ attachment: import("@/types").Attachment }>("/attachments", {
        method: "POST",
        body: form,
      });
    },
    delete: (id: string) =>
      request<{ success: boolean }>(`/attachments/${id}`, { method: "DELETE" }),
  },
  timeline: {
    get: (params?: { from?: string; to?: string; projectId?: string }) => {
      const search = new URLSearchParams();
      if (params?.from) search.set("from", params.from);
      if (params?.to) search.set("to", params.to);
      if (params?.projectId) search.set("projectId", params.projectId);
      const qs = search.toString();
      return request<{ events: import("@/types").TimelineEvent[]; range: { from: string; to: string } }>(
        `/timeline${qs ? `?${qs}` : ""}`
      );
    },
  },
  messages: {
    list: () => request<{ conversations: import("@/types").Conversation[] }>("/messages"),
    get: (id: string) =>
      request<{ conversation: import("@/types").ConversationDetail }>(`/messages/${id}`),
    create: (userId: string, projectId?: string) =>
      request<{ conversation: import("@/types").Conversation }>("/messages", {
        method: "POST",
        body: JSON.stringify({ userId, projectId }),
      }),
    send: (conversationId: string, content: string) =>
      request<{ message: import("@/types").DirectMessage }>(`/messages/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    sendMedia: (
      conversationId: string,
      file: File,
      options?: { content?: string; type?: import("@/types").MessageType; duration?: number }
    ) => {
      const form = new FormData();
      form.append("file", file);
      if (options?.content) form.append("content", options.content);
      if (options?.type) form.append("type", options.type);
      if (options?.duration != null) form.append("duration", String(options.duration));
      return request<{ message: import("@/types").DirectMessage }>(
        `/messages/${conversationId}/messages/media`,
        { method: "POST", body: form }
      );
    },
  },
  finance: {
    summary: () => request<{ summary: import("@/types").FinanceSummary }>("/finance/summary"),
    project: (projectId: string) =>
      request<{
        finance: {
          projectId: string;
          budget: number;
          paid: number;
          remaining: number;
          projectPayments: import("@/types").Payment[];
          orders: Array<{
            id: string;
            title: string;
            budget: number;
            paid: number;
            remaining: number;
            payments: import("@/types").Payment[];
          }>;
        };
      }>(`/finance/project/${projectId}`),
    order: (orderId: string) =>
      request<{
        finance: {
          orderId: string;
          budget: number;
          paid: number;
          remaining: number;
          payments: import("@/types").Payment[];
        };
      }>(`/finance/order/${orderId}`),
    addPayment: (data: {
      orderId?: string;
      projectId?: string;
      amount: number;
      note?: string;
      paidAt?: string;
    }) =>
      request<{ payment: import("@/types").Payment }>("/finance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deletePayment: (id: string) =>
      request<{ success: boolean }>(`/finance/${id}`, { method: "DELETE" }),
  },
  search: (q: string) =>
    request<{
      projects: import("@/types").Project[];
      orders: import("@/types").Order[];
      tasks: import("@/types").Task[];
      query: string;
    }>(`/search?q=${encodeURIComponent(q)}`),
  notifications: {
    list: () =>
      request<{ notifications: import("@/types").AppNotification[]; unreadCount: number }>(
        "/notifications"
      ),
    readAll: () => request<{ success: boolean }>("/notifications/read-all", { method: "PATCH" }),
    getVapidKey: () => request<{ publicKey: string | null }>("/notifications/vapid-public-key"),
    subscribePush: (subscription: PushSubscriptionJSON) =>
      request<{ success: boolean }>("/notifications/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        }),
      }),
    telegramLink: () =>
      request<{ code: string; botUsername: string | null; link: string | null }>(
        "/notifications/telegram/link"
      ),
  },
};

export { ApiError };
