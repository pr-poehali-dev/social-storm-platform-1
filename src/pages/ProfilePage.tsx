import { useState } from 'react';
import { api, User } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface ProfilePageProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export default function ProfilePage({ user, onUserUpdate }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: user.username, bio: user.bio || '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.auth.updateProfile(form);
    if (!res.error) {
      onUserUpdate({ ...user, ...res });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setLoading(false);
  };

  const joinDate = new Date(user.id > 0 ? Date.now() - 86400000 * 30 : Date.now());

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-10">
      {saved && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl font-display font-semibold animate-slide-up flex items-center gap-2">
          <Icon name="CheckCircle" size={16} />
          Профиль обновлён
        </div>
      )}

      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-br from-orange-900 via-orange-800 to-background relative">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, #ff7800 0%, transparent 60%)'
          }} />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-bold font-display border-4 border-card shadow-lg">
              {user.username[0].toUpperCase()}
            </div>
            {user.role === 'admin' && (
              <span className="bg-primary/20 text-primary text-xs font-display font-bold px-3 py-1 rounded-full border border-primary/30 flex items-center gap-1">
                <Icon name="Shield" size={12} />
                Администратор
              </span>
            )}
          </div>

          {!editing ? (
            <>
              <h1 className="font-display font-black text-2xl">{user.username}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{user.email}</p>
              {user.bio && (
                <p className="text-sm text-foreground mt-3 leading-relaxed">{user.bio}</p>
              )}
              {!user.bio && (
                <p className="text-sm text-muted-foreground mt-3 italic">Расскажи о себе...</p>
              )}
              <button
                onClick={() => setEditing(true)}
                className="mt-5 flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-sm font-display font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <Icon name="Pencil" size={14} />
                Редактировать профиль
              </button>
            </>
          ) : (
            <form onSubmit={save} className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Имя пользователя
                </label>
                <input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  О себе
                </label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  placeholder="Напиши что-нибудь о себе..."
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-white font-display font-semibold py-2.5 rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Icon name="Loader2" size={14} className="animate-spin" />}
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 bg-secondary text-sm font-display font-semibold rounded-xl hover:bg-secondary/80 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Участник с', value: joinDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }), icon: 'Calendar' },
          { label: 'Роль', value: user.role === 'admin' ? 'Администратор' : 'Пользователь', icon: 'User' },
          { label: 'Email', value: user.email.split('@')[0] + '...', icon: 'Mail' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center animate-fade-in">
            <Icon name={stat.icon as 'Calendar'} size={18} className="text-primary mx-auto mb-2" />
            <div className="font-display font-bold text-sm">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
