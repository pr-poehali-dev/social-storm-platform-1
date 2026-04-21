import { User } from '@/lib/api';
import { clearAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface NavbarProps {
  user: User | null;
  activePage: string;
  onPageChange: (page: string) => void;
  onAuthOpen: () => void;
  onUserUpdate: (user: User | null) => void;
}

const navItems = [
  { id: 'home', label: 'Лента', icon: 'Home' },
  { id: 'chat', label: 'Чат', icon: 'MessageCircle' },
  { id: 'tasks', label: 'Задания', icon: 'Target' },
  { id: 'exams', label: 'Экзамен', icon: 'GraduationCap' },
  { id: 'videos', label: 'Видео', icon: 'Play' },
  { id: 'contacts', label: 'Контакты', icon: 'Mail' },
];

export default function Navbar({ user, activePage, onPageChange, onAuthOpen, onUserUpdate }: NavbarProps) {
  const handleLogout = async () => {
    await api.auth.logout();
    clearAuth();
    onUserUpdate(null);
    onPageChange('home');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-orange-200/50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button onClick={() => onPageChange('home')} className="flex items-center gap-2.5 group shrink-0">
          <div className="relative w-10 h-10 rounded-xl gradient-orange flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-orange-500/40 group-hover:scale-110 transition-transform duration-300">
            ⚡
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-black text-base leading-none text-gradient-orange">
              СОЦ.ГРОЗА
            </div>
            <div className="text-[10px] text-muted-foreground font-display uppercase tracking-wider mt-0.5">
              Сообщество
            </div>
          </div>
        </button>

        {/* Nav */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-display font-semibold transition-all duration-200 whitespace-nowrap ${
                activePage === item.id
                  ? 'bg-primary text-white shadow-md shadow-orange-500/30'
                  : 'text-foreground/70 hover:text-foreground hover:bg-orange-100'
              }`}
            >
              <Icon name={item.icon as 'Home'} size={16} />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          ))}
          {user?.role === 'admin' && (
            <button
              onClick={() => onPageChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-display font-semibold transition-all duration-200 ${
                activePage === 'admin'
                  ? 'gradient-orange-dark text-white shadow-md'
                  : 'text-orange-700 bg-orange-100/60 hover:bg-orange-200'
              }`}
            >
              <Icon name="Shield" size={16} />
              <span className="hidden lg:block">Админ</span>
            </button>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <button
                onClick={() => onPageChange('profile')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-200 ${
                  activePage === 'profile' ? 'bg-orange-100 border border-orange-300' : 'hover:bg-orange-100'
                }`}
              >
                <div className="w-7 h-7 rounded-full gradient-orange flex items-center justify-center text-white text-xs font-bold font-display">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-sm font-display font-semibold hidden md:block">{user.username}</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Выйти"
              >
                <Icon name="LogOut" size={16} />
              </button>
            </>
          ) : (
            <button onClick={onAuthOpen} className="btn-primary px-5 py-2 text-sm flex items-center gap-1.5">
              <Icon name="Zap" size={14} />
              Войти
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
