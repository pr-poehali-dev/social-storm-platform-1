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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-card border border-border rounded-2xl overflow-hidden orange-glow">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-orange-600 to-orange-800 p-8 text-center">
            <div className="text-5xl mb-3">⚡</div>
            <h1 className="font-display text-2xl font-bold text-white">Социальная Гроза</h1>
            <p className="text-orange-100 text-sm mt-1">
              {mode === 'login' ? 'Войди в свой аккаунт' : 'Создай аккаунт'}
            </p>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-3 text-sm font-medium font-display transition-colors ${
                  mode === m
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
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
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 font-display uppercase tracking-wide">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="groza_user"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 font-display uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 font-display uppercase tracking-wide">
                Пароль
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-orange-500 text-white font-display font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Icon name="Loader2" size={18} className="animate-spin" />
              ) : (
                <Icon name="Zap" size={18} />
              )}
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}