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
}

function formatDate(dt: string) {
  const d = new Date(dt);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function HomePage({ user, onAuthOpen }: HomePageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.posts.list().then(r => {
      setPosts(r.posts || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-950 via-background to-background border-b border-border/50">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #ff7800 0%, transparent 50%), radial-gradient(circle at 80% 20%, #ff4400 0%, transparent 40%)'
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-7xl mb-6 animate-fade-in" style={{ animationDelay: '0s' }}>⚡</div>
          <h1 className="font-display text-5xl md:text-6xl font-black text-foreground mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Социальная <span className="text-primary">Гроза</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Сообщество для активных. Посты, чат, задания и видео — всё в одном месте.
          </p>
          {!user && (
            <button
              onClick={onAuthOpen}
              className="animate-fade-in bg-primary hover:bg-orange-500 text-white font-display font-bold px-8 py-4 rounded-2xl text-lg transition-all duration-200 hover:scale-105 orange-glow-sm"
              style={{ animationDelay: '0.3s' }}
            >
              Присоединиться →
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon name="Rss" size={16} className="text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold">Лента событий</h2>
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm">{posts.length} публикаций</span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-secondary rounded-lg w-3/4 mb-3" />
                <div className="h-4 bg-secondary rounded-lg w-full mb-2" />
                <div className="h-4 bg-secondary rounded-lg w-2/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-display font-medium">Постов пока нет</p>
            <p className="text-sm mt-1">Администраторы скоро опубликуют что-то интересное</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <article
                key={post.id}
                className="bg-card border border-border rounded-2xl overflow-hidden card-hover animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {post.is_pinned && (
                  <div className="bg-primary/10 border-b border-primary/20 px-5 py-2 flex items-center gap-2">
                    <Icon name="Pin" size={12} className="text-primary" />
                    <span className="text-xs font-display font-semibold text-primary uppercase tracking-wide">Закреплено</span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-display font-bold text-lg text-foreground leading-snug">{post.title}</h3>
                    {post.author.role === 'admin' && (
                      <span className="shrink-0 text-xs bg-primary/20 text-primary font-display font-semibold px-2 py-0.5 rounded-full">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt={post.title} className="mt-4 rounded-xl w-full object-cover max-h-72" />
                  )}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {post.author.username[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{post.author.username}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Icon name="Calendar" size={12} />
                      {formatDate(post.created_at)}
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <Icon name="Eye" size={12} />
                      {post.views}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
