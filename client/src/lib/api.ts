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
    }) =>
      request<{ user: import("@/types").User; token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    me: () => request<{ user: import("@/types").User }>("/auth/me"),
    clients: () => request<{ clients: import("@/types").User[] }>("/auth/clients"),
  },
  projects: {
    list: () => request<{ projects: import("@/types").Project[] }>("/projects"),
    get: (id: string) => request<{ project: import("@/types").Project }>(`/projects/${id}`),
    create: (data: { name: string; description?: string; clientId: string }) =>
      request<{ project: import("@/types").Project }>("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ name: string; description: string; clientId: string }>) =>
      request<{ project: import("@/types").Project }>(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ success: boolean }>(`/projects/${id}`, { method: "DELETE" }),
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
      data: Partial<{ title: string; description: string; status: string; deadline: string | null }>
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
    create: (taskId: string, content: string) =>
      request<{ comment: import("@/types").Comment }>("/comments", {
        method: "POST",
        body: JSON.stringify({ taskId, content }),
      }),
    delete: (id: string) => request<{ success: boolean }>(`/comments/${id}`, { method: "DELETE" }),
  },
  attachments: {
    list: (taskId: string) =>
      request<{ attachments: import("@/types").Attachment[] }>(`/attachments/task/${taskId}`),
    upload: (taskId: string, file: File) => {
      const form = new FormData();
      form.append("taskId", taskId);
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
};

export { ApiError };
