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
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => onPageChange('home')}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white text-lg font-bold shadow-lg group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <span className="font-display font-bold text-lg text-foreground hidden sm:block">
            Соц.<span className="text-primary">Гроза</span>
          </span>
        </button>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium font-display transition-all duration-200 ${
                activePage === item.id
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon name={item.icon as 'Home'} size={16} />
              <span className="hidden md:block">{item.label}</span>
            </button>
          ))}
          {user?.role === 'admin' && (
            <button
              onClick={() => onPageChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium font-display transition-all duration-200 ${
                activePage === 'admin'
                  ? 'bg-orange-800 text-white'
                  : 'text-orange-400 hover:bg-orange-400/10'
              }`}
            >
              <Icon name="Shield" size={16} />
              <span className="hidden md:block">Админ</span>
            </button>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => onPageChange('profile')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  activePage === 'profile' ? 'bg-secondary' : 'hover:bg-secondary'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.username}</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Выйти"
              >
                <Icon name="LogOut" size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={onAuthOpen}
              className="flex items-center gap-2 bg-primary hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-display font-semibold transition-all duration-200"
            >
              <Icon name="Zap" size={14} />
              Войти
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
