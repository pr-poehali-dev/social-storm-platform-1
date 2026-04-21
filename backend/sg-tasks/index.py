"""
Задания Социальной Грозы.
action=list|complete|create|delete через query
"""
import json
import os
import psycopg2


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', 'list')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    if action == 'list':
        return get_tasks(token)
    elif action == 'complete':
        task_id = int(body.get('id', 0))
        return complete_task(token, task_id)
    elif action == 'create':
        return create_task(token, body)
    elif action == 'delete':
        task_id = int(body.get('id', 0))
        return delete_task(token, task_id)

    return json_response({'error': 'Unknown action'}, 400)


def get_tasks(token):
    conn = get_conn()
    cur = conn.cursor()

    user = get_user_from_token(cur, token) if token else None
    user_id = user[0] if user else None

    cur.execute("""
        SELECT t.id, t.title, t.description, t.difficulty, t.reward_points, t.created_at
        FROM sg_tasks t
        WHERE t.is_active = true
        ORDER BY t.created_at DESC
    """)
    rows = cur.fetchall()

    completed_ids = set()
    if user_id:
        cur.execute("SELECT task_id FROM sg_user_tasks WHERE user_id = %s", (user_id,))
        completed_ids = {r[0] for r in cur.fetchall()}

    conn.close()
    tasks = []
    for r in rows:
        tasks.append({
            'id': r[0], 'title': r[1], 'description': r[2],
            'difficulty': r[3], 'reward_points': r[4], 'created_at': str(r[5]),
            'completed': r[0] in completed_ids
        })
    return json_response({'tasks': tasks})


def complete_task(token, task_id):
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


def create_task(token, body):
    if not token:
        return json_response({'error': 'Не авторизован'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
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


def delete_task(token, task_id):
    if not token:
        return json_response({'error': 'Не авторизован'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
        return json_response({'error': 'Нет доступа'}, 403)
    cur.execute("UPDATE sg_tasks SET is_active = false WHERE id = %s", (task_id,))
    conn.commit()
    conn.close()
    return json_response({'ok': True})
