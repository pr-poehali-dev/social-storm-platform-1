import { useEffect, useState } from 'react';
import { api, User, Exam, Question } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface ExamsPageProps {
  user: User | null;
  onAuthOpen: () => void;
}

type Mode = 'list' | 'intro' | 'taking' | 'result';

interface AttemptResult {
  score: number;
  total: number;
  correct: number;
  passed: boolean;
  pass_score: number;
}

export default function ExamsPage({ user, onAuthOpen }: ExamsPageProps) {
  const [mode, setMode] = useState<Mode>('list');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);

  useEffect(() => {
    api.exams.list().then(r => { setExams(r.exams || []); setLoading(false); });
  }, [user, mode]);

  // Timer
  useEffect(() => {
    if (mode !== 'taking' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, timeLeft > 0]);

  const openExam = async (exam: Exam) => {
    if (!user) { onAuthOpen(); return; }
    const res = await api.exams.get(exam.id);
    if (res.error) return;
    setSelectedExam(res.exam);
    setQuestions(res.questions || []);
    setAnswers({});
    setCurrentQ(0);
    setMode('intro');
  };

  const startExam = () => {
    if (!selectedExam) return;
    setTimeLeft(selectedExam.time_limit_min * 60);
    setMode('taking');
  };

  const handleSubmit = async () => {
    if (!selectedExam || submitting) return;
    setSubmitting(true);
    const payload: Record<string, string> = {};
    for (const k in answers) payload[k] = answers[k];
    const res = await api.exams.submit({ exam_id: selectedExam.id, answers: payload });
    if (!res.error) {
      setResult(res);
      setMode('result');
    }
    setSubmitting(false);
  };

  const backToList = () => {
    setMode('list');
    setSelectedExam(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // ===== LIST =====
  if (mode === 'list') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="text-xs font-display font-bold uppercase tracking-wider text-orange-600 mb-1">Проверь себя</div>
          <h1 className="font-display text-4xl font-black">Экзамены 🎓</h1>
          <p className="text-muted-foreground mt-2">Пройди тесты и проверь свои знания</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card-elevated rounded-2xl p-6 shimmer">
                <div className="h-6 bg-orange-100 rounded w-2/3 mb-3" />
                <div className="h-4 bg-orange-100 rounded w-full mb-4" />
                <div className="h-10 bg-orange-100 rounded" />
              </div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="card-elevated rounded-3xl text-center py-20 px-6">
            <div className="text-6xl mb-4">🎓</div>
            <p className="font-display font-bold text-lg">Экзаменов пока нет</p>
            <p className="text-sm text-muted-foreground mt-2">Админы скоро добавят первые тесты</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {exams.map((exam, i) => (
              <div
                key={exam.id}
                className="card-elevated rounded-2xl overflow-hidden animate-slide-up group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="gradient-orange p-5 text-white relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <Icon name="GraduationCap" size={28} className="mb-2 opacity-90" />
                      <h3 className="font-display font-black text-xl leading-tight">{exam.title}</h3>
                    </div>
                    {exam.best_score !== undefined && exam.best_score !== null && (
                      <div className="text-right">
                        <div className="text-xs text-white/80 font-display font-semibold">Лучший</div>
                        <div className="text-2xl font-display font-black">{exam.best_score}%</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  {exam.description && (
                    <p className="text-sm text-foreground/70 mb-4 line-clamp-2 leading-relaxed">{exam.description}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <div className="bg-orange-50 rounded-xl p-2.5 text-center border border-orange-100">
                      <div className="text-lg font-display font-black text-orange-600">{exam.questions_count}</div>
                      <div className="text-[10px] text-muted-foreground font-display uppercase tracking-wide">Вопросов</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-2.5 text-center border border-orange-100">
                      <div className="text-lg font-display font-black text-orange-600">{exam.time_limit_min}м</div>
                      <div className="text-[10px] text-muted-foreground font-display uppercase tracking-wide">Время</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-2.5 text-center border border-orange-100">
                      <div className="text-lg font-display font-black text-orange-600">{exam.pass_score}%</div>
                      <div className="text-[10px] text-muted-foreground font-display uppercase tracking-wide">Проход</div>
                    </div>
                  </div>
                  <button
                    onClick={() => openExam(exam)}
                    disabled={exam.questions_count === 0}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                  >
                    <Icon name="Zap" size={16} />
                    {exam.questions_count === 0 ? 'Нет вопросов' : 'Начать экзамен'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== INTRO =====
  if (mode === 'intro' && selectedExam) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card-elevated rounded-3xl overflow-hidden animate-scale-in">
          <div className="gradient-orange-dark p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 lightning-bg opacity-50" />
            <div className="relative">
              <div className="text-6xl mb-3 float">🎓</div>
              <h1 className="font-display font-black text-3xl mb-2">{selectedExam.title}</h1>
              <p className="text-white/90 text-sm max-w-md mx-auto">{selectedExam.description || 'Проверь свои знания!'}</p>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: 'FileQuestion', label: 'Вопросов', value: questions.length },
                { icon: 'Clock', label: 'Минут', value: selectedExam.time_limit_min },
                { icon: 'Target', label: 'Для прохождения', value: `${selectedExam.pass_score}%` },
              ].map(item => (
                <div key={item.label} className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
                  <Icon name={item.icon as 'Home'} size={20} className="text-orange-500 mx-auto mb-1.5" />
                  <div className="font-display font-black text-xl text-gradient-orange">{item.value}</div>
                  <div className="text-[10px] text-muted-foreground font-display uppercase tracking-wide mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-2.5">
                <Icon name="Info" size={16} className="text-orange-600 shrink-0 mt-0.5" />
                <div className="text-sm text-foreground/80 leading-relaxed">
                  <strong className="font-display font-bold">Правила:</strong> После начала таймер запустится. По истечении времени экзамен завершится автоматически. Ответы можно менять до отправки.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={backToList} className="btn-ghost px-6 py-3.5 flex-shrink-0">
                Отмена
              </button>
              <button onClick={startExam} className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2 text-base">
                <Icon name="Play" size={18} />
                Начать экзамен
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== TAKING =====
  if (mode === 'taking' && selectedExam && questions.length > 0) {
    const q = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;
    const allAnswered = questions.every(qu => answers[qu.id]);
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Timer bar */}
        <div className="card-elevated rounded-2xl p-4 mb-5 flex items-center gap-4 sticky top-20 z-10">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-display font-black text-lg ${
            timeLeft < 60 ? 'bg-red-100 text-red-700 pulse-ring' : 'bg-orange-100 text-orange-700'
          }`}>
            <Icon name="Clock" size={18} />
            {formatTime(timeLeft)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-display font-bold text-muted-foreground">
                ВОПРОС {currentQ + 1} / {questions.length}
              </span>
              <span className="text-xs font-display font-bold text-orange-600">
                Отвечено: {answeredCount}/{questions.length}
              </span>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-2 overflow-hidden">
              <div className="gradient-orange h-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="card-elevated rounded-3xl p-8 mb-5 animate-fade-in" key={q.id}>
          <div className="text-xs font-display font-bold uppercase tracking-wider text-orange-600 mb-2">
            Вопрос {currentQ + 1}
          </div>
          <h2 className="font-display font-black text-2xl leading-tight mb-6">{q.question}</h2>

          <div className="space-y-3">
            {(['a', 'b', 'c', 'd'] as const).map(opt => {
              const text = q.options[opt];
              if (!text) return null;
              const selected = answers[q.id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                    selected
                      ? 'border-primary bg-orange-50 shadow-md shadow-orange-500/20'
                      : 'border-border bg-card hover:border-orange-300 hover:bg-orange-50/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-lg transition-colors ${
                    selected ? 'gradient-orange text-white shadow-lg shadow-orange-500/40' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {opt.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium leading-relaxed flex-1">{text}</span>
                  {selected && <Icon name="CheckCircle2" size={20} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
            disabled={currentQ === 0}
            className="btn-ghost px-5 py-3 flex items-center gap-2"
          >
            <Icon name="ChevronLeft" size={16} />
            Назад
          </button>

          <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-thin py-1">
            {questions.map((qu, i) => (
              <button
                key={qu.id}
                onClick={() => setCurrentQ(i)}
                className={`w-9 h-9 shrink-0 rounded-lg text-xs font-display font-bold transition-all ${
                  i === currentQ
                    ? 'gradient-orange text-white shadow-md scale-110'
                    : answers[qu.id]
                    ? 'bg-orange-200 text-orange-800'
                    : 'bg-orange-50 text-muted-foreground hover:bg-orange-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ(c => c + 1)}
              className="btn-primary px-5 py-3 flex items-center gap-2"
            >
              Далее
              <Icon name="ChevronRight" size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`btn-primary px-5 py-3 flex items-center gap-2 ${!allAnswered ? 'bg-red-500' : ''}`}
            >
              {submitting ? (
                <Icon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <Icon name="Flag" size={16} />
              )}
              Завершить
            </button>
          )}
        </div>

        {!allAnswered && currentQ === questions.length - 1 && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-2.5 text-center font-display font-semibold">
            Не все вопросы отвечены. При завершении засчитаются только отвеченные.
          </div>
        )}
      </div>
    );
  }

  // ===== RESULT =====
  if (mode === 'result' && result && selectedExam) {
    const isPassed = result.passed;
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="card-elevated rounded-3xl overflow-hidden animate-scale-in">
          <div className={`p-10 text-white text-center relative overflow-hidden ${
            isPassed ? 'gradient-orange' : 'bg-gradient-to-br from-red-500 to-red-700'
          }`}>
            <div className="absolute inset-0 lightning-bg opacity-40" />
            <div className="relative">
              <div className="text-7xl mb-4 float">{isPassed ? '🎉' : '😔'}</div>
              <h1 className="font-display font-black text-3xl mb-2">
                {isPassed ? 'Поздравляем!' : 'Не сдано'}
              </h1>
              <p className="text-white/90">
                {isPassed ? 'Ты успешно прошёл экзамен!' : 'В следующий раз получится!'}
              </p>
            </div>
          </div>
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="text-7xl font-display font-black text-gradient-orange leading-none">
                {result.score}<span className="text-3xl">%</span>
              </div>
              <div className="text-sm text-muted-foreground mt-2 font-display">
                Правильных ответов: <strong className="text-foreground">{result.correct}</strong> из <strong className="text-foreground">{result.total}</strong>
              </div>
            </div>

            <div className="bg-orange-50 rounded-2xl p-4 mb-6 border border-orange-100">
              <div className="flex items-center justify-between text-sm">
                <span className="font-display font-semibold">Проходной балл:</span>
                <span className="font-display font-black text-orange-600">{result.pass_score}%</span>
              </div>
              <div className="mt-2 w-full bg-white rounded-full h-3 overflow-hidden border border-orange-200">
                <div
                  className={`h-full transition-all duration-1000 ${isPassed ? 'gradient-orange' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={backToList} className="btn-ghost flex-1 py-3.5 flex items-center justify-center gap-2">
                <Icon name="ArrowLeft" size={16} />
                К списку
              </button>
              <button
                onClick={() => { if (selectedExam) openExam(selectedExam); }}
                className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2"
              >
                <Icon name="RotateCcw" size={16} />
                Ещё раз
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
