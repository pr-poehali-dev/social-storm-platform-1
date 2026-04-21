import { User } from './api';

export function saveAuth(token: string, user: User) {
  localStorage.setItem('sg_token', token);
  localStorage.setItem('sg_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('sg_token');
  localStorage.removeItem('sg_user');
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('sg_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function getToken(): string {
  return localStorage.getItem('sg_token') || '';
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}
