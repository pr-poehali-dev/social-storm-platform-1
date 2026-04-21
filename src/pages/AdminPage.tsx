import { useEffect, useState } from 'react';
import { api, User, Exam, Question } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Stats { users: number; posts: number; messages: number; videos: number; tasks: number; }
interface AdminUser { id: number; username: string; email: string; role: string; is_active: boolean; created_at: string; last_seen: string; }
interface AdminPageProps { user: User; }
type Tab = 'overview' | 'posts' | 'tasks' | 'exams' | 'videos' | 'users';

export default function AdminPage({ user }: AdminPageProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);

  const [postForm, setPostForm] = useState({ title: '', content: '', is_pinned: false });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', difficulty: 'easy', reward_points: 10 });
  const [videoForm, setVideoForm] = useState({ title: '', video_url: '', description: '' });
  const [examForm, setExamForm] = useState({ title: '', description: '', pass_score: 70, time_limit_min: 30 });
  const [qForm, setQForm] = useState({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', position: 0 });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadAll = () => {
    api.auth.adminStats().then(setStats);
    api.auth.adminUsers().then(r => setUsers(r.users || []));
    api.exams.list().then(r => setExams(r.exams || []));
  };

  const loadExamQuestions = (id: number) => {
    api.exams.get(id).then(r => setExamQuestions(r.questions || []));
  };

  useEffect(() => { if (user.role === 'admin') loadAll(); }, [user]);

  useEffect(() => {
    if (selectedExamId) loadExamQuestions(selectedExamId);
  }, [selectedExamId]);

  const inputCls = 'input-field';
  const labelCls = 'block text-xs font-display font-bold text-foreground/70 uppercase tracking-wider mb-1.5';

  if (user.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        <div>
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="font-display font-black text-2xl">Доступ запрещён</h2>
          <p className="text-muted-foreground mt-2">Только для администраторов</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Обзор', icon: 'BarChart3' },
    { id: 'posts', label: 'Посты', icon: 'FileText' },
    { id: 'tasks', label: 'Задания', icon: 'Target' },
    { id: 'exams', label: 'Экзамены', icon: 'GraduationCap' },
    { id: 'videos', label: 'Видео', icon: 'Play' },
    { id: 'users', label: 'Люди', icon: 'Users' },
  ];

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const res = await api.posts.create(postForm);
    if (res.ok) { showToast('✅ Пост опубликован'); setPostForm({ title: '', content: '', is_pinned: false }); }
    else showToast(res.error || 'Ошибка');
    setSaving(false);
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const res = await api.tasks.create(taskForm);
    if (res.ok) { showToast('✅ Задание создано'); setTaskForm({ title: '', description: '', difficulty: 'easy', reward_points: 10 }); }
    else showToast(res.error || 'Ошибка');
    setSaving(false);
  };

  const createVideo = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const res = await api.videos.create(videoForm);
    if (res.ok) { showToast('✅ Видео добавлено'); setVideoForm({ title: '', video_url: '', description: '' }); }
    else showToast(res.error || 'Ошибка');
    setSaving(false);
  };

  const createExam = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const res = await api.exams.create(examForm);
    if (res.ok) {
      showToast('✅ Экзамен создан. Теперь добавь вопросы!');
      setExamForm({ title: '', description: '', pass_score: 70, time_limit_min: 30 });
      api.exams.list().then(r => setExams(r.exams || []));
      setSelectedExamId(res.id);
    } else showToast(res.error || 'Ошибка');
    setSaving(false);
  };

  const deleteExam = async (id: number) => {
    if (!confirm('Удалить экзамен?')) return;
    await api.exams.delete(id);
    showToast('✅ Удалено');
    if (selectedExamId === id) setSelectedExamId(null);
    api.exams.list().then(r => setExams(r.exams || []));
  };

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    setSaving(true);
    const res = await api.exams.addQuestion({ ...qForm, exam_id: selectedExamId, position: examQuestions.length });
    if (res.ok) {
      showToast('✅ Вопрос добавлен');
      setQForm({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', position: 0 });
      loadExamQuestions(selectedExamId);
      api.exams.list().then(r => setExams(r.exams || []));
    } else showToast(res.error || 'Ошибка');
    setSaving(false);
  };

  const deleteQuestion = async (qid: number) => {
    if (!confirm('Удалить вопрос?')) return;
    await api.exams.deleteQuestion(qid);
    if (selectedExamId) loadExamQuestions(selectedExamId);
  };

  const toggleUser = async (u: AdminUser) => {
    await api.auth.adminUpdateUser(u.id, { is_active: !u.is_active });
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x));
  };
  const toggleRole = async (u: AdminUser) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    await api.auth.adminUpdateUser(u.id, { role: newRole });
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed top-20 right-4 z-50 gradient-orange text-white px-6 py-3.5 rounded-2xl shadow-xl font-display font-bold animate-slide-up">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl gradient-orange-dark flex items-center justify-center text-white shadow-lg">
          <Icon name="Shield" size={22} />
        </div>
        <div>
          <div className="text-xs font-display font-bold uppercase tracking-wider text-orange-600">Управление</div>
          <h1 className="font-display font-black text-3xl">Админ-панель</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin card-elevated rounded-2xl p-1.5 mb-8">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-bold transition-all whitespace-nowrap flex-1 justify-center ${
              tab === t.id ? 'gradient-orange text-white shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-orange-50'
            }`}
          >
            <Icon name={t.icon as 'Home'} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in">
          {stats && [
            { label: 'Пользователи', value: stats.users, icon: 'Users', grad: 'from-blue-400 to-blue-600' },
            { label: 'Посты', value: stats.posts, icon: 'FileText', grad: 'from-emerald-400 to-emerald-600' },
            { label: 'Сообщения', value: stats.messages, icon: 'MessageCircle', grad: 'from-sky-400 to-sky-600' },
            { label: 'Видео', value: stats.videos, icon: 'Play', grad: 'from-purple-400 to-purple-600' },
            { label: 'Задания', value: stats.tasks, icon: 'Target', grad: 'from-orange-400 to-orange-600' },
          ].map((s, i) => (
            <div key={s.label} className="card-elevated rounded-2xl p-5 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center text-white mb-3`}>
                <Icon name={s.icon as 'Home'} size={18} />
              </div>
              <div className="font-display font-black text-3xl">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-display font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Posts */}
      {tab === 'posts' && (
        <div className="card-elevated rounded-2xl p-6 animate-fade-in max-w-2xl">
          <h2 className="font-display font-black text-xl mb-5 flex items-center gap-2">
            <Icon name="Plus" size={18} className="text-primary" /> Создать пост
          </h2>
          <form onSubmit={createPost} className="space-y-4">
            <div><label className={labelCls}>Заголовок</label><input value={postForm.title} onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))} placeholder="Заголовок" className={inputCls} required /></div>
            <div><label className={labelCls}>Содержание</label><textarea value={postForm.content} onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Текст поста..." className={`${inputCls} resize-none`} required /></div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setPostForm(f => ({ ...f, is_pinned: !f.is_pinned }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${postForm.is_pinned ? 'gradient-orange' : 'bg-secondary border border-border'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${postForm.is_pinned ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm font-display font-bold">Закрепить пост</span>
            </label>
            <button type="submit" disabled={saving} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              {saving && <Icon name="Loader2" size={16} className="animate-spin" />} Опубликовать
            </button>
          </form>
        </div>
      )}

      {/* Tasks */}
      {tab === 'tasks' && (
        <div className="card-elevated rounded-2xl p-6 animate-fade-in max-w-2xl">
          <h2 className="font-display font-black text-xl mb-5 flex items-center gap-2">
            <Icon name="Plus" size={18} className="text-primary" /> Создать задание
          </h2>
          <form onSubmit={createTask} className="space-y-4">
            <div><label className={labelCls}>Название</label><input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} className={inputCls} required /></div>
            <div><label className={labelCls}>Описание</label><textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputCls} resize-none`} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Сложность</label>
                <select value={taskForm.difficulty} onChange={e => setTaskForm(f => ({ ...f, difficulty: e.target.value }))} className={inputCls}>
                  <option value="easy">🌱 Легко</option>
                  <option value="medium">⚡ Средне</option>
                  <option value="hard">🔥 Сложно</option>
                </select>
              </div>
              <div><label className={labelCls}>Очков</label><input type="number" value={taskForm.reward_points} onChange={e => setTaskForm(f => ({ ...f, reward_points: Number(e.target.value) }))} className={inputCls} min={1} /></div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              {saving && <Icon name="Loader2" size={16} className="animate-spin" />} Создать
            </button>
          </form>
        </div>
      )}

      {/* Videos */}
      {tab === 'videos' && (
        <div className="card-elevated rounded-2xl p-6 animate-fade-in max-w-2xl">
          <h2 className="font-display font-black text-xl mb-5 flex items-center gap-2">
            <Icon name="Plus" size={18} className="text-primary" /> Добавить видео
          </h2>
          <form onSubmit={createVideo} className="space-y-4">
            <div><label className={labelCls}>Название</label><input value={videoForm.title} onChange={e => setVideoForm(f => ({ ...f, title: e.target.value }))} className={inputCls} required /></div>
            <div><label className={labelCls}>Ссылка на видео (YouTube)</label><input value={videoForm.video_url} onChange={e => setVideoForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." className={inputCls} required /></div>
            <div><label className={labelCls}>Описание</label><textarea value={videoForm.description} onChange={e => setVideoForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputCls} resize-none`} /></div>
            <button type="submit" disabled={saving} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              {saving && <Icon name="Loader2" size={16} className="animate-spin" />} Добавить
            </button>
          </form>
        </div>
      )}

      {/* EXAMS */}
      {tab === 'exams' && (
        <div className="animate-fade-in grid lg:grid-cols-2 gap-6">
          {/* Left column: create exam + list */}
          <div className="space-y-6">
            <div className="card-elevated rounded-2xl p-6">
              <h2 className="font-display font-black text-xl mb-5 flex items-center gap-2">
                <Icon name="Plus" size={18} className="text-primary" /> Новый экзамен
              </h2>
              <form onSubmit={createExam} className="space-y-4">
                <div><label className={labelCls}>Название</label><input value={examForm.title} onChange={e => setExamForm(f => ({ ...f, title: e.target.value }))} placeholder="Например: Основы программирования" className={inputCls} required /></div>
                <div><label className={labelCls}>Описание</label><textarea value={examForm.description} onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Проходной балл, %</label><input type="number" value={examForm.pass_score} onChange={e => setExamForm(f => ({ ...f, pass_score: Number(e.target.value) }))} min={1} max={100} className={inputCls} /></div>
                  <div><label className={labelCls}>Время, мин</label><input type="number" value={examForm.time_limit_min} onChange={e => setExamForm(f => ({ ...f, time_limit_min: Number(e.target.value) }))} min={1} className={inputCls} /></div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {saving && <Icon name="Loader2" size={14} className="animate-spin" />} Создать экзамен
                </button>
              </form>
            </div>

            <div className="card-elevated rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <Icon name="ListChecks" size={18} className="text-primary" />
                <h2 className="font-display font-black text-lg">Экзамены ({exams.length})</h2>
              </div>
              <div className="divide-y divide-border max-h-96 overflow-y-auto scrollbar-thin">
                {exams.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">Экзаменов пока нет</div>
                ) : exams.map(e => (
                  <div
                    key={e.id}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${selectedExamId === e.id ? 'bg-orange-50' : 'hover:bg-orange-50/50'}`}
                    onClick={() => setSelectedExamId(e.id)}
                  >
                    <div className="w-9 h-9 rounded-xl gradient-orange flex items-center justify-center text-white font-display font-bold text-sm shrink-0">
                      {e.questions_count}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-sm truncate">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.questions_count} вопросов · {e.time_limit_min}м · {e.pass_score}%</div>
                    </div>
                    <button
                      onClick={ev => { ev.stopPropagation(); deleteExam(e.id); }}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: add questions */}
          <div>
            {selectedExamId ? (
              <div className="space-y-5">
                <div className="card-elevated rounded-2xl p-6">
                  <h2 className="font-display font-black text-xl mb-1 flex items-center gap-2">
                    <Icon name="Plus" size={18} className="text-primary" /> Добавить вопрос
                  </h2>
                  <p className="text-xs text-muted-foreground mb-5">
                    В экзамен: <strong>{exams.find(x => x.id === selectedExamId)?.title}</strong>
                  </p>
                  <form onSubmit={addQuestion} className="space-y-3">
                    <div><label className={labelCls}>Вопрос</label><textarea value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))} rows={2} placeholder="Текст вопроса..." className={`${inputCls} resize-none`} required /></div>
                    {(['a', 'b', 'c', 'd'] as const).map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQForm(f => ({ ...f, correct_option: opt }))}
                          className={`w-11 h-11 rounded-xl font-display font-black shrink-0 transition-all ${
                            qForm.correct_option === opt ? 'gradient-orange text-white shadow-lg' : 'bg-orange-50 border-2 border-border text-orange-700 hover:border-orange-300'
                          }`}
                          title="Правильный ответ"
                        >
                          {opt.toUpperCase()}
                        </button>
                        <input
                          value={qForm[`option_${opt}` as keyof typeof qForm] as string}
                          onChange={e => setQForm(f => ({ ...f, [`option_${opt}`]: e.target.value }))}
                          placeholder={`Вариант ${opt.toUpperCase()}${opt === 'a' || opt === 'b' ? '' : ' (необязательно)'}`}
                          className={`${inputCls} py-2.5`}
                          required={opt === 'a' || opt === 'b'}
                        />
                      </div>
                    ))}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs flex items-center gap-2 text-foreground/80">
                      <Icon name="Info" size={14} className="text-orange-600 shrink-0" />
                      Нажми на букву слева чтобы выбрать <strong>правильный ответ</strong>. Сейчас: <strong className="text-orange-600">{qForm.correct_option.toUpperCase()}</strong>
                    </div>
                    <button type="submit" disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                      {saving && <Icon name="Loader2" size={14} className="animate-spin" />} Добавить вопрос
                    </button>
                  </form>
                </div>

                <div className="card-elevated rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <Icon name="FileQuestion" size={16} className="text-primary" />
                    <h3 className="font-display font-bold text-sm">Вопросов в экзамене: {examQuestions.length}</h3>
                  </div>
                  <div className="divide-y divide-border max-h-80 overflow-y-auto scrollbar-thin">
                    {examQuestions.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">Нет вопросов. Добавь первый!</div>
                    ) : examQuestions.map((q, i) => (
                      <div key={q.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-display font-black text-xs flex items-center justify-center shrink-0">{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-bold text-sm mb-2">{q.question}</div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {(['a', 'b', 'c', 'd'] as const).map(opt => {
                                const text = q.options[opt];
                                if (!text) return null;
                                const isCorrect = q.correct_option === opt;
                                return (
                                  <div key={opt} className={`text-xs px-2 py-1 rounded-lg ${isCorrect ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-muted text-foreground/70'}`}>
                                    <strong>{opt.toUpperCase()}:</strong> {text}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <button onClick={() => deleteQuestion(q.id)} className="p-2 rounded-lg hover:bg-red-100 text-red-500">
                            <Icon name="Trash2" size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-elevated rounded-3xl p-10 text-center">
                <div className="text-6xl mb-4">🎓</div>
                <p className="font-display font-bold">Выбери экзамен слева</p>
                <p className="text-sm text-muted-foreground mt-2">...или создай новый, чтобы добавить в него вопросы</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="animate-fade-in card-elevated rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Icon name="Users" size={18} className="text-primary" />
            <h2 className="font-display font-black">Пользователи ({users.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {users.map(u => (
              <div key={u.id} className="p-4 flex items-center gap-3 hover:bg-orange-50/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-white shrink-0 ${u.role === 'admin' ? 'gradient-orange-dark' : 'gradient-orange'}`}>
                  {u.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-sm">{u.username}</span>
                    {u.role === 'admin' && <span className="text-[10px] gradient-orange-dark text-white px-1.5 py-0.5 rounded font-display font-bold uppercase">ADMIN</span>}
                    {!u.is_active && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-display font-bold">ЗАБЛОКИРОВАН</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleRole(u)} className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 font-display font-bold px-3 py-1.5 rounded-lg">
                    {u.role === 'admin' ? 'Снять' : 'Сделать админом'}
                  </button>
                  <button onClick={() => toggleUser(u)} className={`text-xs font-display font-bold px-3 py-1.5 rounded-lg ${u.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                    {u.is_active ? 'Блок.' : 'Разблок.'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
