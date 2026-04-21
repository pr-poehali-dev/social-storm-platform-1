"""
Задания и экзамены Социальной Грозы.
Tasks: tasks_list | tasks_complete | tasks_create | tasks_delete
Exams: exams_list | exam_get | exam_submit | exam_create | exam_delete | exam_attempts
Questions: question_add | question_delete
"""
import json
import os
import psycopg2


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400'
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def json_response(data, status=200):
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False, default=str)
    }


def get_user_from_token(cur, token):
    if not token:
        return None
    cur.execute(
        "SELECT u.id, u.username, u.role FROM sg_users u JOIN sg_sessions s ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()


def require_admin(token):
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
        return None, None
    return conn, cur


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', 'tasks_list')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    if action == 'tasks_list':
        return tasks_list(token)
    elif action == 'tasks_complete':
        return tasks_complete(token, int(body.get('id', 0)))
    elif action == 'tasks_create':
        return tasks_create(token, body)
    elif action == 'tasks_delete':
        return tasks_delete(token, int(body.get('id', 0)))
    elif action == 'exams_list':
        return exams_list(token)
    elif action == 'exam_get':
        return exam_get(int(qs.get('id', 0)))
    elif action == 'exam_submit':
        return exam_submit(token, body)
    elif action == 'exam_create':
        return exam_create(token, body)
    elif action == 'exam_delete':
        return exam_delete(token, int(body.get('id', 0)))
    elif action == 'exam_attempts':
        return exam_attempts(token, int(qs.get('id', 0)))
    elif action == 'question_add':
        return question_add(token, body)
    elif action == 'question_delete':
        return question_delete(token, int(body.get('id', 0)))

    return json_response({'error': 'Unknown action'}, 400)


# ===== TASKS =====

def tasks_list(token):
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token) if token else None
    user_id = user[0] if user else None

    cur.execute("""
        SELECT t.id, t.title, t.description, t.difficulty, t.reward_points, t.created_at
        FROM sg_tasks t WHERE t.is_active = true ORDER BY t.created_at DESC
    """)
    rows = cur.fetchall()

    completed_ids = set()
    if user_id:
        cur.execute("SELECT task_id FROM sg_user_tasks WHERE user_id = %s", (user_id,))
        completed_ids = {r[0] for r in cur.fetchall()}

    conn.close()
    tasks = [{
        'id': r[0], 'title': r[1], 'description': r[2],
        'difficulty': r[3], 'reward_points': r[4], 'created_at': str(r[5]),
        'completed': r[0] in completed_ids
    } for r in rows]
    return json_response({'tasks': tasks})


def tasks_complete(token, task_id):
    if not token:
        return json_response({'error': 'Необходима авторизация'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user:
        conn.close()
        return json_response({'error': 'Сессия истекла'}, 401)
    cur.execute(
        "INSERT INTO sg_user_tasks (user_id, task_id) VALUES (%s, %s) ON CONFLICT DO NOTHING RETURNING id",
        (user[0], task_id)
    )
    result = cur.fetchone()
    conn.commit()
    conn.close()
    if result:
        return json_response({'ok': True, 'message': 'Задание выполнено!'})
    return json_response({'ok': False, 'message': 'Задание уже выполнено'})


def tasks_create(token, body):
    conn, cur = require_admin(token)
    if not conn:
        return json_response({'error': 'Нет доступа'}, 403)
    title = body.get('title', '').strip()
    description = body.get('description', '').strip()
    difficulty = body.get('difficulty', 'medium')
    reward_points = body.get('reward_points', 10)
    if not title or not description:
        conn.close()
        return json_response({'error': 'Заполните название и описание'}, 400)
    cur.execute(
        "INSERT INTO sg_tasks (title, description, difficulty, reward_points) VALUES (%s, %s, %s, %s) RETURNING id",
        (title, description, difficulty, reward_points)
    )
    task_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return json_response({'id': task_id, 'ok': True})


def tasks_delete(token, task_id):
    conn, cur = require_admin(token)
    if not conn:
        return json_response({'error': 'Нет доступа'}, 403)
    cur.execute("UPDATE sg_tasks SET is_active = false WHERE id = %s", (task_id,))
    conn.commit()
    conn.close()
    return json_response({'ok': True})


# ===== EXAMS =====

def exams_list(token):
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token) if token else None

    cur.execute("""
        SELECT e.id, e.title, e.description, e.pass_score, e.time_limit_min, e.created_at,
               (SELECT COUNT(*) FROM sg_exam_questions WHERE exam_id = e.id AND position >= 0) as q_count
        FROM sg_exams e WHERE e.is_active = true ORDER BY e.created_at DESC
    """)
    rows = cur.fetchall()

    best_scores = {}
    if user:
        cur.execute("""
            SELECT exam_id, MAX(score) FROM sg_exam_attempts
            WHERE user_id = %s GROUP BY exam_id
        """, (user[0],))
        for r in cur.fetchall():
            best_scores[r[0]] = r[1]

    conn.close()
    exams = [{
        'id': r[0], 'title': r[1], 'description': r[2],
        'pass_score': r[3], 'time_limit_min': r[4], 'created_at': str(r[5]),
        'questions_count': r[6], 'best_score': best_scores.get(r[0])
    } for r in rows]
    return json_response({'exams': exams})


def exam_get(exam_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, title, description, pass_score, time_limit_min FROM sg_exams WHERE id = %s AND is_active = true",
        (exam_id,)
    )
    exam = cur.fetchone()
    if not exam:
        conn.close()
        return json_response({'error': 'Экзамен не найден'}, 404)

    cur.execute("""
        SELECT id, question, option_a, option_b, option_c, option_d, correct_option, position
        FROM sg_exam_questions WHERE exam_id = %s AND position >= 0 ORDER BY position, id
    """, (exam_id,))
    rows = cur.fetchall()
    conn.close()

    questions = [{
        'id': r[0], 'question': r[1],
        'options': {'a': r[2], 'b': r[3], 'c': r[4], 'd': r[5]},
        'correct_option': r[6],
        'position': r[7]
    } for r in rows]

    return json_response({
        'exam': {
            'id': exam[0], 'title': exam[1], 'description': exam[2],
            'pass_score': exam[3], 'time_limit_min': exam[4],
        },
        'questions': questions
    })


def exam_submit(token, body):
    if not token:
        return json_response({'error': 'Необходима авторизация'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user:
        conn.close()
        return json_response({'error': 'Сессия истекла'}, 401)

    exam_id = int(body.get('exam_id', 0))
    answers = body.get('answers', {})

    cur.execute("SELECT pass_score FROM sg_exams WHERE id = %s", (exam_id,))
    exam_row = cur.fetchone()
    if not exam_row:
        conn.close()
        return json_response({'error': 'Экзамен не найден'}, 404)
    pass_score = exam_row[0]

    cur.execute(
        "SELECT id, correct_option FROM sg_exam_questions WHERE exam_id = %s AND position >= 0",
        (exam_id,)
    )
    qs = cur.fetchall()
    total = len(qs)
    if total == 0:
        conn.close()
        return json_response({'error': 'В экзамене нет вопросов'}, 400)

    correct = 0
    for qid, correct_opt in qs:
        if str(answers.get(str(qid), '')).lower() == correct_opt.lower():
            correct += 1

    score = round(correct / total * 100)
    passed = score >= pass_score

    answers_json = json.dumps(answers).replace("'", "''")
    cur.execute(
        "INSERT INTO sg_exam_attempts (user_id, exam_id, score, total_questions, correct_count, passed, answers) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (user[0], exam_id, score, total, correct, passed, answers_json)
    )
    attempt_id = cur.fetchone()[0]
    conn.commit()
    conn.close()

    return json_response({
        'attempt_id': attempt_id,
        'score': score, 'total': total, 'correct': correct,
        'passed': passed, 'pass_score': pass_score
    })


def exam_create(token, body):
    conn, cur = require_admin(token)
    if not conn:
        return json_response({'error': 'Нет доступа'}, 403)
    title = body.get('title', '').strip()
    description = body.get('description', '').strip()
    pass_score = int(body.get('pass_score', 70))
    time_limit_min = int(body.get('time_limit_min', 30))
    if not title:
        conn.close()
        return json_response({'error': 'Укажите название экзамена'}, 400)
    cur.execute(
        "INSERT INTO sg_exams (title, description, pass_score, time_limit_min) VALUES (%s, %s, %s, %s) RETURNING id",
        (title, description, pass_score, time_limit_min)
    )
    exam_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return json_response({'id': exam_id, 'ok': True})


def exam_delete(token, exam_id):
    conn, cur = require_admin(token)
    if not conn:
        return json_response({'error': 'Нет доступа'}, 403)
    cur.execute("UPDATE sg_exams SET is_active = false WHERE id = %s", (exam_id,))
    conn.commit()
    conn.close()
    return json_response({'ok': True})


def exam_attempts(token, exam_id):
    if not token:
        return json_response({'error': 'Необходима авторизация'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user:
        conn.close()
        return json_response({'error': 'Сессия истекла'}, 401)
    cur.execute("""
        SELECT id, score, total_questions, correct_count, passed, completed_at
        FROM sg_exam_attempts WHERE user_id = %s AND exam_id = %s
        ORDER BY completed_at DESC LIMIT 20
    """, (user[0], exam_id))
    rows = cur.fetchall()
    conn.close()
    attempts = [{
        'id': r[0], 'score': r[1], 'total': r[2],
        'correct': r[3], 'passed': r[4], 'completed_at': str(r[5])
    } for r in rows]
    return json_response({'attempts': attempts})


def question_add(token, body):
    conn, cur = require_admin(token)
    if not conn:
        return json_response({'error': 'Нет доступа'}, 403)

    exam_id = int(body.get('exam_id', 0))
    question = body.get('question', '').strip()
    option_a = body.get('option_a', '').strip()
    option_b = body.get('option_b', '').strip()
    option_c = body.get('option_c', '').strip() or None
    option_d = body.get('option_d', '').strip() or None
    correct_option = body.get('correct_option', 'a').lower()
    position = int(body.get('position', 0))

    if not question or not option_a or not option_b:
        conn.close()
        return json_response({'error': 'Заполните вопрос и минимум 2 варианта ответа'}, 400)
    if correct_option not in ('a', 'b', 'c', 'd'):
        conn.close()
        return json_response({'error': 'Неверный вариант ответа'}, 400)

    cur.execute(
        "INSERT INTO sg_exam_questions (exam_id, question, option_a, option_b, option_c, option_d, correct_option, position) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (exam_id, question, option_a, option_b, option_c, option_d, correct_option, position)
    )
    qid = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return json_response({'id': qid, 'ok': True})


def question_delete(token, qid):
    conn, cur = require_admin(token)
    if not conn:
        return json_response({'error': 'Нет доступа'}, 403)
    cur.execute("UPDATE sg_exam_questions SET position = -999 WHERE id = %s", (qid,))
    conn.commit()
    conn.close()
    return json_response({'ok': True})
