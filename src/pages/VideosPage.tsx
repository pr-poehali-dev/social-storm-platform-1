import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Video {
  id: number;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  views: number;
  created_at: string;
  author: { id: number; username: string };
}

function formatViews(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

function getYoutubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  return m ? m[1] : null;
}

function getYoutubeThumb(url: string) {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    api.videos.list().then(r => { setVideos(r.videos || []); setLoading(false); });
  }, []);

  const open = async (v: Video) => {
    setActive(v);
    await api.videos.view(v.id);
    setVideos(prev => prev.map(x => x.id === v.id ? { ...x, views: x.views + 1 } : x));
  };

  const embed = (url: string) => {
    const id = getYoutubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-xs font-display font-bold uppercase tracking-wider text-orange-600 mb-1">Медиа</div>
        <h1 className="font-display text-4xl font-black">Видеотека 🎬</h1>
        <p className="text-muted-foreground mt-2">Обучающие и развлекательные видео от команды</p>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-900/50 backdrop-blur-md animate-fade-in" onClick={() => setActive(null)}>
          <div className="w-full max-w-4xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="card-elevated rounded-3xl overflow-hidden">
              <div className="relative aspect-video bg-black">
                <iframe src={embed(active.video_url)} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
                <button onClick={() => setActive(null)} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors">
                  <Icon name="X" size={18} />
                </button>
              </div>
              <div className="p-6">
                <h2 className="font-display font-black text-xl mb-2">{active.title}</h2>
                {active.description && <p className="text-sm text-foreground/70 leading-relaxed mb-3">{active.description}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="User" size={12} />{active.author.username}</span>
                  <span className="flex items-center gap-1"><Icon name="Eye" size={12} />{formatViews(active.views + 1)} просмотров</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card-elevated rounded-2xl overflow-hidden shimmer">
              <div className="aspect-video bg-orange-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-orange-100 rounded w-3/4" />
                <div className="h-3 bg-orange-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="card-elevated rounded-3xl text-center py-20 px-6">
          <div className="text-6xl mb-4">🎬</div>
          <p className="font-display font-bold text-lg">Видео пока нет</p>
          <p className="text-sm text-muted-foreground mt-2">Админы скоро добавят первые ролики</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((v, i) => {
            const thumb = v.thumbnail_url || getYoutubeThumb(v.video_url);
            return (
              <button
                key={v.id}
                onClick={() => open(v)}
                className="card-elevated rounded-2xl overflow-hidden text-left group animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative aspect-video bg-orange-100 overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center gradient-orange">
                      <Icon name="Play" size={40} className="text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full gradient-orange flex items-center justify-center shadow-xl">
                      <Icon name="Play" size={22} className="text-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-black text-sm leading-snug mb-2 line-clamp-2">{v.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-display font-semibold">{v.author.username}</span>
                    <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{formatViews(v.views)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
