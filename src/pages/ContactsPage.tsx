import Icon from '@/components/ui/icon';

export default function ContactsPage() {
  const items = [
    { icon: 'Mail', title: 'Email', value: 'support@groza.ru', desc: 'Ответим в течение 24 часов', grad: 'from-blue-400 to-blue-600' },
    { icon: 'MessageCircle', title: 'Telegram', value: '@socialgroza', desc: 'Быстрые ответы в мессенджере', grad: 'from-sky-400 to-sky-600' },
    { icon: 'Globe', title: 'Сайт', value: 'groza.social', desc: 'Официальный сайт', grad: 'from-emerald-400 to-emerald-600' },
    { icon: 'Clock', title: 'Режим работы', value: '09:00 — 21:00', desc: 'Пн–Пт, МСК', grad: 'from-orange-400 to-orange-600' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="text-6xl mb-3 float">📬</div>
        <div className="text-xs font-display font-bold uppercase tracking-wider text-orange-600 mb-1">Мы на связи</div>
        <h1 className="font-display font-black text-4xl">Свяжитесь с нами</h1>
        <p className="text-muted-foreground mt-2">Есть вопросы? Мы всегда рады помочь!</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {items.map((it, i) => (
          <div key={it.title} className="card-elevated rounded-2xl p-5 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${it.grad} flex items-center justify-center text-white shadow-lg mb-3`}>
              <Icon name={it.icon as 'Mail'} size={22} />
            </div>
            <div className="text-xs font-display font-bold uppercase tracking-wide text-muted-foreground">{it.title}</div>
            <div className="font-display font-black text-lg">{it.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{it.desc}</div>
          </div>
        ))}
      </div>

      <div className="card-elevated rounded-3xl p-6 animate-fade-in">
        <h2 className="font-display font-black text-xl mb-4 flex items-center gap-2">
          <Icon name="Send" size={20} className="text-primary" />
          Написать сообщение
        </h2>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); alert('Сообщение отправлено! (свяжись через email или Telegram для быстрого ответа)'); }}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-foreground/70 mb-1.5">Имя</label>
              <input className="input-field" placeholder="Ваше имя" />
            </div>
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-foreground/70 mb-1.5">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-display font-bold uppercase tracking-wider text-foreground/70 mb-1.5">Сообщение</label>
            <textarea rows={5} className="input-field resize-none" placeholder="Напишите ваш вопрос или предложение..." />
          </div>
          <button type="submit" className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
            <Icon name="Send" size={16} />
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}
