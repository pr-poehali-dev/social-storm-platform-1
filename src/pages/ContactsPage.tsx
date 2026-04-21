import Icon from '@/components/ui/icon';

export default function ContactsPage() {
  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-12 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Icon name="Mail" size={28} className="text-primary" />
        </div>
        <h1 className="font-display font-black text-3xl mb-2">Свяжитесь с нами</h1>
        <p className="text-muted-foreground">Есть вопросы или предложения? Мы всегда открыты к общению</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 mb-10">
        {[
          { icon: 'Mail', title: 'Email', value: 'support@groza.ru', desc: 'Ответим в течение 24 часов', color: 'text-blue-400' },
          { icon: 'MessageCircle', title: 'Telegram', value: '@socialgroza', desc: 'Быстрые ответы в мессенджере', color: 'text-sky-400' },
          { icon: 'Globe', title: 'Сайт', value: 'groza.social', desc: 'Всегда актуальная информация', color: 'text-green-400' },
          { icon: 'Clock', title: 'Режим работы', value: '09:00 — 21:00', desc: 'Пн–Пт, московское время', color: 'text-orange-400' },
        ].map((item, i) => (
          <div
            key={item.title}
            className="bg-card border border-border rounded-2xl p-5 card-hover animate-fade-in"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3 ${item.color}`}>
              <Icon name={item.icon as 'Mail'} size={20} />
            </div>
            <div className="font-display font-bold">{item.title}</div>
            <div className={`font-semibold text-sm mt-0.5 ${item.color}`}>{item.value}</div>
            <p className="text-muted-foreground text-xs mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
          <Icon name="Send" size={18} className="text-primary" />
          Написать сообщение
        </h2>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); alert('Сообщение отправлено! Свяжитесь с нами через email или Telegram.'); }}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Имя</label>
              <input
                type="text"
                placeholder="Ваше имя"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Сообщение</label>
            <textarea
              rows={5}
              placeholder="Напишите ваш вопрос или предложение..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-orange-500 text-white font-display font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Icon name="Send" size={16} />
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}
