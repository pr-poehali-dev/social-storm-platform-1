import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { User } from '@/lib/api';
import { api } from '@/lib/api';
import { getToken, getStoredUser, clearAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import HomePage from '@/pages/HomePage';
import ChatPage from '@/pages/ChatPage';
import TasksPage from '@/pages/TasksPage';
import VideosPage from '@/pages/VideosPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPage from '@/pages/AdminPage';
import ContactsPage from '@/pages/ContactsPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState('home');
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(stored);
      api.auth.me().then(res => {
        if (res.error) {
          clearAuth();
          setUser(null);
        } else {
          const updated = { ...stored, ...res };
          setUser(updated);
          localStorage.setItem('sg_user', JSON.stringify(updated));
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleUserUpdate = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem('sg_user', JSON.stringify(u));
  };

  const handlePageChange = (p: string) => {
    if ((p === 'profile' || p === 'admin') && !user) {
      setAuthOpen(true);
      return;
    }
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center bg-storm">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">⚡</div>
          <div className="font-display font-bold text-xl text-foreground">Социальная Гроза</div>
          <div className="mt-3 w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-storm">
      <Navbar
        user={user}
        activePage={page}
        onPageChange={handlePageChange}
        onAuthOpen={() => setAuthOpen(true)}
        onUserUpdate={handleUserUpdate}
      />

      <main className="pt-16">
        {page === 'home' && <HomePage user={user} onAuthOpen={() => setAuthOpen(true)} />}
        {page === 'chat' && <ChatPage user={user} onAuthOpen={() => setAuthOpen(true)} />}
        {page === 'tasks' && <TasksPage user={user} onAuthOpen={() => setAuthOpen(true)} />}
        {page === 'videos' && <VideosPage />}
        {page === 'contacts' && <ContactsPage />}
        {page === 'profile' && user && <ProfilePage user={user} onUserUpdate={handleUserUpdate} />}
        {page === 'admin' && user && user.role === 'admin' && <AdminPage user={user} />}
      </main>

      {authOpen && (
        <AuthModal
          onSuccess={u => {
            handleUserUpdate(u);
            setAuthOpen(false);
          }}
          onClose={() => setAuthOpen(false)}
        />
      )}

      <Toaster />
    </div>
  );
}
