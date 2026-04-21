const URLS = {
  auth: 'https://functions.poehali.dev/1c234e17-65c5-4b88-bcad-1ba4d2e6cff0',
  posts: 'https://functions.poehali.dev/2bf76235-a361-42cd-bb37-1630bb6647dc',
  chat: 'https://functions.poehali.dev/f02ef483-00c3-465b-86d2-42b5e2451c1f',
  tasks: 'https://functions.poehali.dev/c6aef82f-aba3-4733-a446-438dd1eb587a',
  videos: 'https://functions.poehali.dev/98308f6a-e759-49d0-a91b-105eaf027141',
};

function getToken() {
  return localStorage.getItem('sg_token') || '';
}

async function req(base: string, action: string, method = 'GET', body?: object, query?: Record<string, string | number>) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['X-Auth-Token'] = token;

  let url = `${base}?action=${action}`;
  if (query) {
    for (const k in query) url += `&${k}=${encodeURIComponent(query[k])}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  auth: {
    register: (data: object) => req(URLS.auth, 'register', 'POST', data),
    login: (data: object) => req(URLS.auth, 'login', 'POST', data),
    logout: () => req(URLS.auth, 'logout', 'POST'),
    me: () => req(URLS.auth, 'me', 'GET'),
    updateProfile: (data: object) => req(URLS.auth, 'profile', 'PUT', data),
    adminStats: () => req(URLS.auth, 'admin_stats', 'GET'),
    adminUsers: () => req(URLS.auth, 'admin_users', 'GET'),
    adminUpdateUser: (id: number, data: object) => req(URLS.auth, 'admin_update_user', 'PUT', { user_id: id, ...data }),
  },
  posts: {
    list: () => req(URLS.posts, 'list', 'GET'),
    create: (data: object) => req(URLS.posts, 'create', 'POST', data),
    delete: (id: number) => req(URLS.posts, 'delete', 'POST', { id }),
  },
  chat: {
    messages: () => req(URLS.chat, 'list', 'GET'),
    send: (content: string) => req(URLS.chat, 'send', 'POST', { content }),
    delete: (id: number) => req(URLS.chat, 'delete', 'POST', { id }),
  },
  tasks: {
    list: () => req(URLS.tasks, 'tasks_list', 'GET'),
    complete: (id: number) => req(URLS.tasks, 'tasks_complete', 'POST', { id }),
    create: (data: object) => req(URLS.tasks, 'tasks_create', 'POST', data),
    delete: (id: number) => req(URLS.tasks, 'tasks_delete', 'POST', { id }),
  },
  videos: {
    list: () => req(URLS.videos, 'list', 'GET'),
    create: (data: object) => req(URLS.videos, 'create', 'POST', data),
    view: (id: number) => req(URLS.videos, 'view', 'POST', { id }),
    delete: (id: number) => req(URLS.videos, 'delete', 'POST', { id }),
  },
  exams: {
    list: () => req(URLS.tasks, 'exams_list', 'GET'),
    get: (id: number) => req(URLS.tasks, 'exam_get', 'GET', undefined, { id }),
    submit: (data: object) => req(URLS.tasks, 'exam_submit', 'POST', data),
    create: (data: object) => req(URLS.tasks, 'exam_create', 'POST', data),
    delete: (id: number) => req(URLS.tasks, 'exam_delete', 'POST', { id }),
    attempts: (id: number) => req(URLS.tasks, 'exam_attempts', 'GET', undefined, { id }),
    addQuestion: (data: object) => req(URLS.tasks, 'question_add', 'POST', data),
    deleteQuestion: (id: number) => req(URLS.tasks, 'question_delete', 'POST', { id }),
  },
};

export type User = {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  bio?: string;
};

export type Exam = {
  id: number;
  title: string;
  description: string;
  pass_score: number;
  time_limit_min: number;
  questions_count: number;
  best_score?: number;
  created_at: string;
};

export type Question = {
  id: number;
  question: string;
  options: { a: string; b: string; c?: string; d?: string };
  correct_option: string;
  position: number;
};
