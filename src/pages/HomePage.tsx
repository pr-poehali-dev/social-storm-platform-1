import { useEffect, useState } from 'react';
import { api, User } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Post {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  is_pinned: boolean;
  views: number;
  created_at: string;
  author: { id: number; username: string; avatar_url?: string; role: string };
}

interface HomePageProps {
  user: User | null;
  onAuthOpen: () => void;
  onPageChange: (p: string) => void;
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export default function HomePage({ user, onAuthOpen, onPageChange }: HomePageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.posts.list().then(r => {
      setPosts(r.posts || []);
      setLoading(false);
    });
  }, []);

  const features = [
    { icon: 'MessageCircle', label: 'Общий чат', desc: 'Общайся в режиме реального времени', page: 'chat', color: 'from-orange-400 to-orange-600' },
    { icon: 'Target', label: 'Задания', desc: 'Выполняй и получай очки', page: 'tasks', color: 'from-amber-400 to-orange-500' },
    { icon: 'GraduationCap', label: 'Экзамен', desc: 'Проверь свои знания', page: 'exams', color: 'from-orange-500 to-red-500' },
    { icon: 'Play', label: 'Видео', desc: 'Обучающие видеоматериалы', page: 'videos', color: 'from-yellow-400 to-orange-500' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider mb-6 animate-fade-in border border-orange-200">
            <span className="w-2 h-2 rounded-full bg-orange-500 pulse-ring" />
            Добро пожаловать!
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-black mb-5 animate-slide-up leading-[1.05]" style={{ animationDelay: '0.05s' }}>
            Социальная<br />
            <span className="text-gradient-orange">Гроза ⚡</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-8 animate-slide-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
            Активное сообщество, где ты можешь общаться, обучаться, выполнять задания и сдавать экзамены
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            {!user ? (
              <>
                <button onClick={onAuthOpen} className="btn-primary px-8 py-4 text-base flex items-center gap-2">
                  <Icon name="Zap" size={18} />
                  Присоединиться
                </button>
                <button onClick={() => onPageChange('chat')} className="btn-ghost px-8 py-4 text-base flex items-center gap-2">
                  <Icon name="MessageCircle" size={18} />
                  Посмотреть чат
                </button>
              </>
            ) : (
              <button onClick={() => onPageChange('exams')} className="btn-primary px-8 py-4 text-base flex items-center gap-2">
                <Icon name="GraduationCap" size={18} />
                Пройти экзамен
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <button
              key={f.page}
              onClick={() => onPageChange(f.page)}
              className="card-elevated rounded-2xl p-5 text-left group animate-slide-up"
              style={{ animationDelay: `${0.2 + i * 0.05}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                <Icon name={f.icon as 'Home'} size={22} />
              </div>
              <div className="font-display font-bold text-sm mb-1">{f.label}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-xs font-display font-bold uppercase tracking-wider text-orange-600 mb-1">Новости</div>
            <h2 className="font-display text-3xl font-black">Лента событий</h2>
          </div>
          <span className="text-sm text-muted-foreground font-display">{posts.length} публикаций</span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-elevated rounded-2xl p-6">
                <div className="h-5 bg-orange-100 rounded-lg w-3/4 mb-3 shimmer" />
                <div className="h-4 bg-orange-100 rounded-lg w-full mb-2 shimmer" />
                <div className="h-4 bg-orange-100 rounded-lg w-2/3 shimmer" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card-elevated rounded-3xl text-center py-16 px-6">
            <div className="text-6xl mb-4">📭</div>
            <p className="font-display font-bold text-lg">Постов пока нет</p>
            <p className="text-sm text-muted-foreground mt-2">Админы скоро опубликуют что-то интересное</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <article
                key={post.id}
                className="card-elevated rounded-2xl overflow-hidden animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {post.is_pinned && (
                  <div className="gradient-orange px-5 py-2 flex items-center gap-2">
                    <Icon name="Pin" size={12} className="text-white" />
                    <span className="text-xs font-display font-bold text-white uppercase tracking-wider">Закреплено</span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold font-display ${post.author.role === 'admin' ? 'gradient-orange-dark' : 'gradient-orange'}`}>
                      {post.author.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm">{post.author.username}</span>
                        {post.author.role === 'admin' && (
                          <span className="text-[10px] gradient-orange-dark text-white font-display font-bold px-2 py-0.5 rounded-full uppercase">ADMIN</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Icon name="Calendar" size={10} />
                        {formatDate(post.created_at)}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-display font-black text-xl leading-snug mb-3">{post.title}</h3>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && <img src={post.image_url} alt={post.title} className="mt-4 rounded-xl w-full object-cover max-h-96 border border-border" />}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
