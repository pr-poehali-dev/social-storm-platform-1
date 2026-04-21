import { useEffect, useState } from 'react';
import { api, User } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Stats {
  users: number;
  posts: number;
  messages: number;
  videos: number;
  tasks: number;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_seen: string;
}

interface AdminPageProps {
  user: User;
}

type Tab = 'overview' | 'posts' | 'tasks' | 'videos' | 'users';

export default function AdminPage({ user }: AdminPageProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [postForm, setPostForm] = useState({ title: '', content: '', is_pinned: false });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', difficulty: 'easy', reward_points: 10 });
  const [videoForm, setVideoForm] = useState({ title: '', video_url: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    if (user.role !== 'admin') return;
    Promise.all([api.auth.adminStats(), api.auth.adminUsers()]).then(([s, u]) => {
      setStats(s);
      setUsers(u.users || []);
      setLoading(false);
    });
  }, [user]);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api.posts.create(postForm);
    if (res.ok) {
      showToast('Пост опубликован!');
      setPostForm({ title: '', content: '', is_pinned: false });
    } else showToast(res.error || 'Ошибка');
    setSaving(false);
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api.tasks.create(taskForm);
    if (res.ok) {
      showToast('Задание создано!');
      setTaskForm({ title: '', description: '', difficulty: 'easy', reward_points: 10 });
    } else showToast(res.error || 'Ошибка');
    setSaving(false);
  };

  const createVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api.videos.create(videoForm);
    if (res.ok) {
      showToast('Видео добавлено!');
      setVideoForm({ title: '', video_url: '', description: '' });
    } else showToast(res.error || 'Ошибка');
    setSaving(false);
  };

  const toggleUser = async (u: AdminUser) => {
    await api.auth.adminUpdateUser(u.id, { is_active: !u.is_active });
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x));
  };

  const toggleRole = async (u: AdminUser) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    await api.auth.adminUpdateUser(u.id, { role: newRole });
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
  };

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-display font-bold text-xl">Нет доступа</h2>
          <p className="text-muted-foreground mt-2">Только администраторы могут просматривать эту страницу</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Обзор', icon: 'BarChart3' },
    { id: 'posts', label: 'Посты', icon: 'FileText' },
    { id: 'tasks', label: 'Задания', icon: 'Target' },
    { id: 'videos', label: 'Видео', icon: 'Play' },
    { id: 'users', label: 'Пользователи', icon: 'Users' },
  ];

  const inputCls = 'w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors';
  const labelCls = 'block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide mb-1.5';

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-10">
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg font-display font-semibold animate-slide-up flex items-center gap-2">
          <Icon name="CheckCircle" size={16} />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
          <Icon name="Shield" size={20} className="text-orange-400" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl">Панель управления</h1>
          <p className="text-muted-foreground text-sm">Управление сайтом «Социальная Гроза»</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-8 bg-card border border-border rounded-2xl p-1.5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-semibold transition-all flex-1 justify-center ${
              tab === t.id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={t.icon as 'Home'} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="h-8 bg-secondary rounded-lg mb-2" />
                <div className="h-4 bg-secondary rounded w-2/3" />
              </div>
            ))
          ) : stats && (
            [
              { label: 'Пользователей', value: stats.users, icon: 'Users', color: 'text-blue-400' },
              { label: 'Постов', value: stats.posts, icon: 'FileText', color: 'text-green-400' },
              { label: 'Сообщений', value: stats.messages, icon: 'MessageCircle', color: 'text-sky-400' },
              { label: 'Видео', value: stats.videos, icon: 'Play', color: 'text-purple-400' },
              { label: 'Заданий', value: stats.tasks, icon: 'Target', color: 'text-orange-400' },
            ].map((s, i) => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-5 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <Icon name={s.icon as 'Home'} size={20} className={`${s.color} mb-2`} />
                <div className="font-display font-black text-3xl">{s.value}</div>
                <div className="text-muted-foreground text-xs mt-0.5">{s.label}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create post */}
      {tab === 'posts' && (
        <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in">
          <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
            <Icon name="Plus" size={18} className="text-primary" />
            Создать пост
          </h2>
          <form onSubmit={createPost} className="space-y-4">
            <div>
              <label className={labelCls}>Заголовок</label>
              <input value={postForm.title} onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))} placeholder="Заголовок поста" className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Содержание</label>
              <textarea value={postForm.content} onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))} rows={6} placeholder="Текст поста..." className={`${inputCls} resize-none`} required />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setPostForm(f => ({ ...f, is_pinned: !f.is_pinned }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${postForm.is_pinned ? 'bg-primary' : 'bg-secondary border border-border'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${postForm.is_pinned ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm font-display font-semibold">Закрепить пост</span>
            </label>
            <button type="submit" disabled={saving} className="w-full bg-primary hover:bg-orange-500 text-white font-display font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Icon name="Loader2" size={16} className="animate-spin" />}
              Опубликовать
            </button>
          </form>
        </div>
      )}

      {/* Create task */}
      {tab === 'tasks' && (
        <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in">
          <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
            <Icon name="Plus" size={18} className="text-primary" />
            Создать задание
          </h2>
          <form onSubmit={createTask} className="space-y-4">
            <div>
              <label className={labelCls}>Название</label>
              <input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Название задания" className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Описание</label>
              <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Что нужно сделать..." className={`${inputCls} resize-none`} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Сложность</label>
                <select value={taskForm.difficulty} onChange={e => setTaskForm(f => ({ ...f, difficulty: e.target.value }))} className={inputCls}>
                  <option value="easy">🌱 Легко</option>
                  <option value="medium">⚡ Средне</option>
                  <option value="hard">🔥 Сложно</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Очков за выполнение</label>
                <input type="number" value={taskForm.reward_points} onChange={e => setTaskForm(f => ({ ...f, reward_points: Number(e.target.value) }))} className={inputCls} min={1} max={1000} />
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-primary hover:bg-orange-500 text-white font-display font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Icon name="Loader2" size={16} className="animate-spin" />}
              Создать задание
            </button>
          </form>
        </div>
      )}

      {/* Add video */}
      {tab === 'videos' && (
        <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in">
          <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
            <Icon name="Plus" size={18} className="text-primary" />
            Добавить видео
          </h2>
          <form onSubmit={createVideo} className="space-y-4">
            <div>
              <label className={labelCls}>Название</label>
              <input value={videoForm.title} onChange={e => setVideoForm(f => ({ ...f, title: e.target.value }))} placeholder="Название видео" className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Ссылка на видео (YouTube или прямая)</label>
              <input value={videoForm.video_url} onChange={e => setVideoForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Описание (необязательно)</label>
              <textarea value={videoForm.description} onChange={e => setVideoForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Краткое описание видео..." className={`${inputCls} resize-none`} />
            </div>
            <button type="submit" disabled={saving} className="w-full bg-primary hover:bg-orange-500 text-white font-display font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Icon name="Loader2" size={16} className="animate-spin" />}
              Добавить видео
            </button>
          </form>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="animate-fade-in">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Icon name="Users" size={18} className="text-primary" />
              <h2 className="font-display font-bold">{users.length} пользователей</h2>
            </div>
            <div className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-secondary" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-secondary rounded w-1/4" />
                      <div className="h-3 bg-secondary rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : (
                users.map(u => (
                  <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${u.role === 'admin' ? 'bg-orange-600' : 'bg-secondary border border-border text-foreground'}`}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-sm">{u.username}</span>
                        {u.role === 'admin' && (
                          <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-display">ADMIN</span>
                        )}
                        {!u.is_active && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-display">Заблокирован</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleRole(u)}
                        title={u.role === 'admin' ? 'Снять роль' : 'Назначить админом'}
                        className="text-xs bg-secondary hover:bg-orange-500/20 hover:text-orange-400 font-display font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        {u.role === 'admin' ? 'Разжаловать' : 'Назначить'}
                      </button>
                      <button
                        onClick={() => toggleUser(u)}
                        className={`text-xs font-display font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                          u.is_active
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        }`}
                      >
                        {u.is_active ? 'Блок.' : 'Разблок.'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
