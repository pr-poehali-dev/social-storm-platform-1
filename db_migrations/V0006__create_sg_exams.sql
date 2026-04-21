CREATE TABLE sg_exams (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  pass_score INTEGER DEFAULT 70,
  time_limit_min INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sg_exam_questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT DEFAULT NULL,
  option_d TEXT DEFAULT NULL,
  correct_option VARCHAR(1) NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sg_exam_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  exam_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  passed BOOLEAN DEFAULT false,
  answers TEXT DEFAULT NULL,
  completed_at TIMESTAMP DEFAULT NOW()
);