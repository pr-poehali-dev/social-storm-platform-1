import { useEffect, useRef, useState } from 'react';
import { api, User } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  content: string;
  created_at: string;
  user: { id: number; username: string; avatar_url?: string; role: string };
}

interface ChatPageProps {
  user: User | null;
  onAuthOpen: () => void;
}

function timeAgo(dt: string) {
  const d = new Date(dt);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ChatPage({ user, onAuthOpen }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    api.chat.messages().then(r => {
      setMessages(r.messages || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await api.chat.send(text.trim());
    if (!res.error) {
      setMessages(prev => [...prev, res]);
      setText('');
    }
    setSending(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="card-elevated rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="gradient-orange p-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 lightning-bg opacity-40" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon name="MessageCircle" size={22} />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-black text-xl">Общий чат</h1>
              <p className="text-white/80 text-xs">{loading ? '...' : `${messages.length} сообщений`} · обновление каждые 5 сек</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-300 pulse-ring" />
              <span className="text-xs font-semibold">онлайн</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Icon name="Loader2" size={32} className="text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">💬</div>
              <p className="font-display font-bold text-lg">Чат пустой</p>
              <p className="text-sm text-muted-foreground mt-1">Будь первым — напиши сообщение!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = user?.id === msg.user.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 animate-fade-in ${isMe ? 'flex-row-reverse' : ''}`}
                  style={{ animationDelay: `${Math.min(i * 0.02, 0.5)}s` }}
                >
                  <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white text-sm font-bold font-display ${
                    msg.user.role === 'admin' ? 'gradient-orange-dark' : 'gradient-orange'
                  }`}>
                    {msg.user.username[0].toUpperCase()}
                  </div>
                  <div className={`flex flex-col gap-1 max-w-xs md:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 text-xs ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="font-display font-bold">{msg.user.username}</span>
                      {msg.user.role === 'admin' && (
                        <span className="text-[9px] gradient-orange-dark text-white px-1.5 py-0.5 rounded font-display font-bold">ADMIN</span>
                      )}
                      <span className="text-muted-foreground">{timeAgo(msg.created_at)}</span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isMe
                        ? 'gradient-orange text-white rounded-tr-sm'
                        : 'bg-orange-50 border border-orange-100 rounded-tl-sm text-foreground'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 bg-orange-50/40">
          {user ? (
            <form onSubmit={send} className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Напиши сообщение..."
                  maxLength={1000}
                  className="input-field pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-display">
                  {text.length}/1000
                </span>
              </div>
              <button type="submit" disabled={!text.trim() || sending} className="btn-primary w-12 h-12 flex items-center justify-center">
                {sending ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Send" size={18} />}
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between bg-orange-50 rounded-2xl px-4 py-3 border border-orange-200">
              <span className="text-sm text-foreground/70">Войди чтобы писать в чат</span>
              <button onClick={onAuthOpen} className="btn-primary px-4 py-1.5 text-sm">
                Войти
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
