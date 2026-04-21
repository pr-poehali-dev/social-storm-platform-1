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

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function getYoutubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  return m ? m[1] : null;
}

function getYoutubeThumbnail(url: string) {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    api.videos.list().then(r => {
      setVideos(r.videos || []);
      setLoading(false);
    });
  }, []);

  const openVideo = async (video: Video) => {
    setActive(video);
    await api.videos.view(video.id);
    setVideos(prev => prev.map(v => v.id === video.id ? { ...v, views: v.views + 1 } : v));
  };

  const getEmbedUrl = (url: string) => {
    const ytId = getYoutubeId(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1`;
    return url;
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Icon name="Play" size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl">Видеотека</h1>
          <p className="text-muted-foreground text-sm">Видеоролики от команды «Социальной Грозы»</p>
        </div>
        <div className="flex-1 h-px bg-border ml-4" />
        <span className="text-muted-foreground text-sm">{videos.length} видео</span>
      </div>

      {/* Player modal */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setActive(null)}>
          <div className="w-full max-w-4xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="relative aspect-video bg-black">
                <iframe
                  src={getEmbedUrl(active.video_url)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              </div>
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-lg">{active.title}</h2>
                  {active.description && <p className="text-muted-foreground text-sm mt-1">{active.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Icon name="Eye" size={12} />{formatViews(active.views + 1)} просмотров</span>
                    <span>{formatDate(active.created_at)}</span>
                  </div>
                </div>
                <button onClick={() => setActive(null)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <Icon name="X" size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-secondary" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">🎬</div>
          <p className="font-display font-medium">Видео пока нет</p>
          <p className="text-sm mt-1">Администраторы скоро добавят ролики</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((video, i) => {
            const thumb = video.thumbnail_url || getYoutubeThumbnail(video.video_url);
            return (
              <button
                key={video.id}
                onClick={() => openVideo(video)}
                className="bg-card border border-border rounded-2xl overflow-hidden card-hover text-left animate-fade-in group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative aspect-video bg-secondary overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="Play" size={40} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Icon name="Play" size={20} className="text-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-sm leading-snug mb-1 line-clamp-2">{video.title}</h3>
                  {video.description && (
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-2">{video.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{video.author.username}</span>
                    <span className="flex items-center gap-1">
                      <Icon name="Eye" size={11} />
                      {formatViews(video.views)}
                    </span>
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
