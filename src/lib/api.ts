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

async function req(base: string, path: string, method = 'GET', body?: object) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['X-Auth-Token'] = token;

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  auth: {
    register: (data: object) => req(URLS.auth, '/register', 'POST', data),
    login: (data: object) => req(URLS.auth, '/login', 'POST', data),
    logout: () => req(URLS.auth, '/logout', 'POST'),
    me: () => req(URLS.auth, '/me'),
    updateProfile: (data: object) => req(URLS.auth, '/profile', 'PUT', data),
    adminStats: () => req(URLS.auth, '/admin/stats'),
    adminUsers: () => req(URLS.auth, '/admin/users'),
    adminUpdateUser: (id: number, data: object) => req(URLS.auth, `/admin/users/${id}`, 'PUT', data),
  },
  posts: {
    list: () => req(URLS.posts, '/'),
    create: (data: object) => req(URLS.posts, '/', 'POST', data),
    delete: (id: number) => req(URLS.posts, `/${id}`, 'DELETE'),
  },
  chat: {
    messages: () => req(URLS.chat, '/'),
    send: (content: string) => req(URLS.chat, '/', 'POST', { content }),
    delete: (id: number) => req(URLS.chat, `/${id}`, 'DELETE'),
  },
  tasks: {
    list: () => req(URLS.tasks, '/'),
    complete: (id: number) => req(URLS.tasks, `/complete/${id}`, 'POST'),
    create: (data: object) => req(URLS.tasks, '/', 'POST', data),
    delete: (id: number) => req(URLS.tasks, `/${id}`, 'DELETE'),
  },
  videos: {
    list: () => req(URLS.videos, '/'),
    create: (data: object) => req(URLS.videos, '/', 'POST', data),
    view: (id: number) => req(URLS.videos, `/view/${id}`, 'POST'),
    delete: (id: number) => req(URLS.videos, `/${id}`, 'DELETE'),
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
