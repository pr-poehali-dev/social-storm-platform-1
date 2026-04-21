import { useState } from 'react';
import { api, User } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface AuthModalProps {
  onSuccess: (user: User) => void;
  onClose: () => void;
}

export default function AuthModal({ onSuccess, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = mode === 'login'
        ? await api.auth.login({ email: form.email, password: form.password })
        : await api.auth.register(form);
      if (res.error) { setError(res.error); return; }
      saveAuth(res.token, res.user);
      onSuccess(res.user);
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-orange-900/40 backdrop-blur-md" />
      <div className="relative w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-card rounded-3xl overflow-hidden glow-orange-lg border border-orange-200">
          {/* Header */}
          <div className="relative gradient-orange p-8 text-center overflow-hidden">
            <div className="absolute inset-0 lightning-bg opacity-60" />
            <div className="relative">
              <div className="text-6xl mb-3 float">⚡</div>
              <h1 className="font-display text-2xl font-black text-white">Социальная Гроза</h1>
              <p className="text-white/90 text-sm mt-1 font-medium">
                {mode === 'login' ? 'С возвращением!' : 'Присоединяйся к сообществу'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-3.5 text-sm font-display font-semibold transition-all ${
                  mode === m
                    ? 'text-primary bg-orange-50 border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-orange-50/50'
                }`}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handle} className="p-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-display font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="groza_user"
                  className="input-field"
                  required
                  minLength={3}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-display font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-display font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
                Пароль
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="input-field"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Zap" size={18} />}
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>

            <p className="text-xs text-center text-muted-foreground pt-2">
              {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-primary font-semibold hover:underline"
              >
                {mode === 'login' ? 'Создать' : 'Войти'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
