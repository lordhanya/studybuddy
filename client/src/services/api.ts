const API_BASE = import.meta.env.VITE_API_BASE || "";

async function request(input: RequestInfo | URL, init?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${input}`, {
    ...init,
    headers,
    credentials: "include",
  });

  let data: any = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    const err: any = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (path: string, init?: RequestInit) => request(path, { ...init, method: "GET" }),
  post: (path: string, body: any, init?: RequestInit) =>
    request(path, { ...init, method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body: any, init?: RequestInit) =>
    request(path, { ...init, method: "PUT", body: JSON.stringify(body) }),
  del: (path: string, init?: RequestInit) => request(path, { ...init, method: "DELETE" }),

  // Auth
  auth: {
    register: (body: any) => api.post("/api/auth/register", body),
    login: (body: any) => api.post("/api/auth/login", body),
    logout: () => api.post("/api/auth/logout", null),
    me: () => api.get("/api/auth/me"),
  },

  // Workspaces
  workspaces: {
    list: () => api.get("/api/workspaces"),
    create: (body: any) => api.post("/api/workspaces", body),
    get: (id: string) => api.get(`/api/workspaces/${id}`),
    update: (id: string, body: any) => api.put(`/api/workspaces/${id}`, body),
    remove: (id: string) => api.del(`/api/workspaces/${id}`),
  },

  // Syllabus
  subjects: {
    list: (workspaceId: string) => api.get(`/api/syllabus/subjects?workspaceId=${workspaceId}`),
    create: (body: any) => api.post("/api/syllabus/subjects", body),
  },
  chapters: {
    list: (subjectId: string) => api.get(`/api/syllabus/chapters?subjectId=${subjectId}`),
    create: (body: any) => api.post("/api/syllabus/chapters", body),
  },
  topics: {
    list: (chapterId: string) => api.get(`/api/syllabus/topics?chapterId=${chapterId}`),
    create: (body: any) => api.post("/api/syllabus/topics", body),
  },

  // Progress
  progress: {
    update: (topicId: string, status: string) =>
      api.post(`/api/progress/topics?topicId=${topicId}`, { status }),
    list: (workspaceId: string) =>
      api.get(`/api/progress/topics?workspaceId=${workspaceId}`),
    summary: (workspaceId: string) =>
      api.get(`/api/progress/summary?workspaceId=${workspaceId}`),
  },

  // Activities
  activities: {
    list: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/activities?${qs}`);
    },
    create: (body: any) => api.post("/api/activities", body),
    get: (id: string) => api.get(`/api/activities/${id}`),
    remove: (id: string) => api.del(`/api/activities/${id}`),
    reactions: {
      list: (activityId: string) => api.get(`/api/activities/${activityId}/reactions`),
      add: (activityId: string, type: string) =>
        api.post(`/api/activities/${activityId}/reactions`, { type }),
    },
    comments: {
      list: (activityId: string) => api.get(`/api/activities/${activityId}/comments`),
      add: (activityId: string, content: string) =>
        api.post(`/api/activities/${activityId}/comments`, { content }),
    },
  },

  // Groups
  groups: {
    list: () => api.get("/api/groups"),
    create: (body: any) => api.post("/api/groups", body),
    get: (id: string) => api.get(`/api/groups/${id}`),
    join: (body: any) => api.post("/api/groups/join", body),
  },

  // Daily updates (check-ins)
  dailyUpdates: {
    list: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/dailyUpdates?${qs}`);
    },
    upsert: (body: any) => api.post("/api/dailyUpdates", body),
  },

  // Presence
  presence: {
    ping: () => api.post("/api/presence/ping", null),
  },

  // Goals
  goals: {
    list: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/goals?${qs}`);
    },
    create: (body: any) => api.post("/api/goals", body),
    get: (id: string) => api.get(`/api/goals/${id}`),
    update: (id: string, body: any) => api.put(`/api/goals/${id}`, body),
    remove: (id: string) => api.del(`/api/goals/${id}`),
  },

  // Study Sessions
  sessions: {
    list: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/sessions?${qs}`);
    },
    create: (body: any) => api.post("/api/sessions", body),
    get: (id: string) => api.get(`/api/sessions/${id}`),
    update: (id: string, body: any) => api.put(`/api/sessions/${id}`, body),
    remove: (id: string) => api.del(`/api/sessions/${id}`),
  },

  // Mock Tests
  tests: {
    list: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/api/tests?${qs}`);
    },
    create: (body: any) => api.post("/api/tests", body),
    get: (id: string) => api.get(`/api/tests/${id}`),
    update: (id: string, body: any) => api.put(`/api/tests/${id}`, body),
    remove: (id: string) => api.del(`/api/tests/${id}`),
  },

  // Leaderboard
  leaderboard: {
    get: (workspaceId: string, metric?: string) =>
      api.get(`/api/leaderboard?workspaceId=${workspaceId}${metric ? `&metric=${metric}` : ""}`),
  },

  // Analytics
  analytics: {
    get: (workspaceId: string) => api.get(`/api/analytics?workspaceId=${workspaceId}`),
  },
};
