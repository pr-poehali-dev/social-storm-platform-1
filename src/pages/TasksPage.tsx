import { useEffect, useState } from 'react';
import { api, User } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Task {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reward_points: number;
  completed: boolean;
  created_at: string;
}

interface TasksPageProps {
  user: User | null;
  onAuthOpen: () => void;
}

const diffConfig = {
  easy: { label: 'Легко', color: 'text-emerald-700 bg-emerald-100', emoji: '🌱', grad: 'from-emerald-400 to-emerald-600' },
  medium: { label: 'Средне', color: 'text-orange-700 bg-orange-100', emoji: '⚡', grad: 'from-orange-400 to-orange-600' },
  hard: { label: 'Сложно', color: 'text-red-700 bg-red-100', emoji: '🔥', grad: 'from-red-400 to-red-600' },
};

export default function TasksPage({ user, onAuthOpen }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const load = () => api.tasks.list().then(r => { setTasks(r.tasks || []); setLoading(false); });
  useEffect(() => { load(); }, [user]);

  const complete = async (id: number) => {
    if (!user) { onAuthOpen(); return; }
    setCompleting(id);
    const res = await api.tasks.complete(id);
    if (res.ok) {
      setToast(res.message || 'Выполнено!');
      setTimeout(() => setToast(''), 3000);
      load();
    }
    setCompleting(null);
  };

  const done = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const totalPoints = tasks.filter(t => t.completed).reduce((s, t) => s + t.reward_points, 0);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed top-20 right-4 z-50 gradient-orange text-white px-6 py-3.5 rounded-2xl shadow-xl font-display font-bold animate-slide-up flex items-center gap-2.5">
          <Icon name="CheckCircle" size={18} />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-display font-bold uppercase tracking-wider text-orange-600 mb-1">Испытания</div>
        <h1 className="font-display text-4xl font-black">Задания 🎯</h1>
        <p className="text-muted-foreground mt-2">Выполняй задания и зарабатывай очки репутации</p>
      </div>

      {/* Progress */}
      {user && total > 0 && (
        <div className="card-elevated rounded-3xl p-6 mb-8 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-200/30 rounded-full blur-3xl" />
          <div className="relative grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-display font-bold uppercase text-muted-foreground tracking-wider mb-1">Прогресс</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-display font-black text-gradient-orange">{done}</span>
                <span className="text-lg text-muted-foreground">/{total}</span>
              </div>
              <div className="mt-2 w-full bg-orange-100 rounded-full h-2 overflow-hidden">
                <div className="gradient-orange h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div>
              <div className="text-xs font-display font-bold uppercase text-muted-foreground tracking-wider mb-1">Очков набрано</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-black text-gradient-orange">{totalPoints}</span>
                <span className="text-lg">⚡</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-display font-bold uppercase text-muted-foreground tracking-wider mb-1">Выполнено</div>
              <div className="text-4xl font-display font-black text-gradient-orange">{progress}<span className="text-2xl">%</span></div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-elevated rounded-2xl p-6 shimmer">
              <div className="h-5 bg-orange-100 rounded w-1/2 mb-3" />
              <div className="h-4 bg-orange-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card-elevated rounded-3xl text-center py-16 px-6">
          <div className="text-6xl mb-4">🎯</div>
          <p className="font-display font-bold text-lg">Заданий пока нет</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task, i) => {
            const diff = diffConfig[task.difficulty] || diffConfig.medium;
            return (
              <div
                key={task.id}
                className={`card-elevated rounded-2xl p-6 animate-slide-up transition-all ${task.completed ? 'opacity-70 bg-emerald-50/50' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${diff.grad} flex items-center justify-center text-2xl shadow-lg`}>
                    {diff.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <h3 className={`font-display font-black text-lg ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-display font-bold ${diff.color}`}>
                          {diff.label}
                        </span>
                        <span className="text-xs gradient-orange text-white px-2.5 py-1 rounded-full font-display font-bold flex items-center gap-1">
                          <span>⚡</span>+{task.reward_points}
                        </span>
                      </div>
                    </div>
                    <p className="text-foreground/70 text-sm leading-relaxed mb-4">{task.description}</p>
                    <div className="flex justify-end">
                      {task.completed ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-display font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <Icon name="CheckCircle2" size={16} />
                          Выполнено
                        </div>
                      ) : (
                        <button
                          onClick={() => complete(task.id)}
                          disabled={completing === task.id}
                          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
                        >
                          {completing === task.id ? (
                            <Icon name="Loader2" size={14} className="animate-spin" />
                          ) : (
                            <Icon name="Check" size={14} />
                          )}
                          Выполнить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
