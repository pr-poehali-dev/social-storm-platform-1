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
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
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

  const deleteMsg = async (id: number) => {
    await api.chat.delete(id);
    loadMessages();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 px-4 py-5 max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Icon name="MessageCircle" size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">Общий чат</h1>
            <p className="text-muted-foreground text-xs">
              {loading ? '...' : `${messages.length} сообщений · обновляется каждые 5 сек`}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 pulse-orange" />
            <span className="text-xs text-muted-foreground">онлайн</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 max-w-4xl w-full mx-auto space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Icon name="Loader2" size={32} className="text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-5xl mb-4">💬</div>
            <p className="font-display font-medium">Чат пустой</p>
            <p className="text-sm mt-1">Будь первым — напиши сообщение!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = user?.id === msg.user.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 animate-fade-in group ${isMe ? 'flex-row-reverse' : ''}`}
                style={{ animationDelay: `${i * 0.02}s` }}
              >
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  msg.user.role === 'admin' ? 'bg-orange-600' : 'bg-secondary border border-border'
                }`}>
                  {msg.user.username[0].toUpperCase()}
                </div>
                <div className={`max-w-xs md:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-display font-semibold text-foreground">{msg.user.username}</span>
                    {msg.user.role === 'admin' && (
                      <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-display">ADMIN</span>
                    )}
                    <span className="text-xs text-muted-foreground">{timeAgo(msg.created_at)}</span>
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-card border border-border rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => deleteMsg(msg.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all self-center"
                  >
                    <Icon name="Trash2" size={12} />
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-card/50 px-4 py-4 max-w-4xl w-full mx-auto">
        {user ? (
          <form onSubmit={send} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Написать сообщение..."
                maxLength={1000}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {text.length}/1000
              </span>
            </div>
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="w-11 h-11 bg-primary hover:bg-orange-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Войди чтобы писать в чат</span>
            <button
              onClick={onAuthOpen}
              className="bg-primary text-white text-sm font-display font-semibold px-4 py-1.5 rounded-lg hover:bg-orange-500 transition-colors"
            >
              Войти
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
