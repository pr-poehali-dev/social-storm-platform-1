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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {saved && (
        <div className="fixed top-20 right-4 z-50 gradient-orange text-white px-6 py-3.5 rounded-2xl font-display font-bold animate-slide-up shadow-xl flex items-center gap-2">
          <Icon name="CheckCircle" size={18} />
          Профиль обновлён
        </div>
      )}

      <div className="card-elevated rounded-3xl overflow-hidden animate-scale-in">
        <div className="h-40 gradient-orange-dark relative overflow-hidden">
          <div className="absolute inset-0 lightning-bg opacity-50" />
          <div className="absolute inset-0 dot-pattern opacity-20" />
        </div>

        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-12 mb-5">
            <div className="w-24 h-24 rounded-3xl gradient-orange flex items-center justify-center text-white text-4xl font-display font-black border-4 border-card shadow-xl">
              {user.username[0].toUpperCase()}
            </div>
            {user.role === 'admin' && (
              <div className="gradient-orange-dark text-white text-xs font-display font-black px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg">
                <Icon name="Shield" size={14} />
                АДМИНИСТРАТОР
              </div>
            )}
          </div>

          {!editing ? (
            <>
              <h1 className="font-display font-black text-3xl">{user.username}</h1>
              <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
                <Icon name="Mail" size={12} />
                {user.email}
              </p>
              <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                {user.bio ? (
                  <p className="text-sm leading-relaxed">{user.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Расскажи что-нибудь о себе...</p>
                )}
              </div>
              <button onClick={() => setEditing(true)} className="btn-ghost mt-5 px-5 py-2.5 flex items-center gap-2 text-sm">
                <Icon name="Pencil" size={14} />
                Редактировать профиль
              </button>
            </>
          ) : (
            <form onSubmit={save} className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-wider text-foreground/70 mb-1.5">Имя пользователя</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="input-field" minLength={3} />
              </div>
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-wider text-foreground/70 mb-1.5">О себе</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Несколько слов о себе..." className="input-field resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {loading && <Icon name="Loader2" size={14} className="animate-spin" />}
                  Сохранить
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-ghost px-5">Отмена</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
