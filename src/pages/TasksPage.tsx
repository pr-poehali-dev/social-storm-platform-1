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
  easy: { label: 'Легко', color: 'text-green-400 bg-green-400/10', icon: '🌱' },
  medium: { label: 'Средне', color: 'text-yellow-400 bg-yellow-400/10', icon: '⚡' },
  hard: { label: 'Сложно', color: 'text-red-400 bg-red-400/10', icon: '🔥' },
};

export default function TasksPage({ user, onAuthOpen }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const load = () => {
    api.tasks.list().then(r => {
      setTasks(r.tasks || []);
      setLoading(false);
    });
  };

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
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-10">
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg font-display font-semibold animate-slide-up flex items-center gap-2">
          <Icon name="CheckCircle" size={16} />
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Icon name="Target" size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl">Задания</h1>
          <p className="text-muted-foreground text-sm">Выполняй задания и зарабатывай очки</p>
        </div>
      </div>

      {user && total > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-display font-semibold">Твой прогресс</span>
            <span className="text-sm font-bold text-primary font-display">{done}/{total}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-orange-600 to-orange-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{progress}% заданий выполнено</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
              <div className="h-5 bg-secondary rounded w-1/2 mb-3" />
              <div className="h-4 bg-secondary rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">🎯</div>
          <p className="font-display font-medium">Заданий пока нет</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task, i) => {
            const diff = diffConfig[task.difficulty] || diffConfig.medium;
            return (
              <div
                key={task.id}
                className={`bg-card border rounded-2xl p-5 card-hover animate-fade-in transition-all duration-300 ${
                  task.completed ? 'border-green-500/30 opacity-75' : 'border-border'
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{diff.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className={`font-display font-bold ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-display font-semibold ${diff.color}`}>
                          {diff.label}
                        </span>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-display font-bold">
                          +{task.reward_points} очков
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{task.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  {task.completed ? (
                    <div className="flex items-center gap-1.5 text-green-400 text-sm font-display font-semibold">
                      <Icon name="CheckCircle2" size={16} />
                      Выполнено
                    </div>
                  ) : (
                    <button
                      onClick={() => complete(task.id)}
                      disabled={completing === task.id}
                      className="bg-primary hover:bg-orange-500 text-white text-sm font-display font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60 flex items-center gap-2"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
