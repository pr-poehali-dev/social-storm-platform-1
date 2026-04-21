"""
Авторизация, профиль и администрирование Социальной Грозы.
action передаётся через query: ?action=register|login|logout|me|profile|admin_stats|admin_users|admin_update_user
"""
import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timedelta


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
    'Access-Control-Max-Age': '86400'
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token() -> str:
    return secrets.token_hex(32)


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
        """SELECT u.id, u.username, u.role, u.avatar_url, u.bio, u.email
           FROM sg_users u JOIN sg_sessions s ON s.user_id = u.id
           WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = true""",
        (token,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', '')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    if action == 'register':
        return register(body)
    elif action == 'login':
        return login(body)
    elif action == 'logout':
        return logout(token)
    elif action == 'me':
        return get_me(token)
    elif action == 'profile':
        return update_profile(token, body)
    elif action == 'admin_stats':
        return admin_stats(token)
    elif action == 'admin_users':
        return admin_get_users(token)
    elif action == 'admin_update_user':
        user_id = int(body.get('user_id', 0))
        return admin_update_user(token, user_id, body)

    return json_response({'error': 'Unknown action'}, 400)


def register(body):
    username = body.get('username', '').strip()
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')

    if not username or not email or not password:
        return json_response({'error': 'Заполните все поля'}, 400)
    if len(username) < 3:
        return json_response({'error': 'Имя пользователя минимум 3 символа'}, 400)
    if len(password) < 6:
        return json_response({'error': 'Пароль минимум 6 символов'}, 400)

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM sg_users WHERE email = %s OR username = %s", (email, username))
    if cur.fetchone():
        conn.close()
        return json_response({'error': 'Пользователь с таким email или именем уже существует'}, 409)

    pwd_hash = hash_password(password)
    cur.execute(
        "INSERT INTO sg_users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, email, role",
        (username, email, pwd_hash)
    )
    user = cur.fetchone()
    token = generate_token()
    expires = datetime.now() + timedelta(days=30)
    cur.execute("INSERT INTO sg_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user[0], token, expires))
    conn.commit()
    conn.close()
    return json_response({'token': token, 'user': {'id': user[0], 'username': user[1], 'email': user[2], 'role': user[3]}})


def login(body):
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')
    if not email or not password:
        return json_response({'error': 'Введите email и пароль'}, 400)

    conn = get_conn()
    cur = conn.cursor()
    pwd_hash = hash_password(password)
    cur.execute(
        "SELECT id, username, email, role, avatar_url, bio FROM sg_users WHERE email = %s AND password_hash = %s AND is_active = true",
        (email, pwd_hash)
    )
    user = cur.fetchone()
    if not user:
        conn.close()
        return json_response({'error': 'Неверный email или пароль'}, 401)

    cur.execute("UPDATE sg_users SET last_seen = NOW() WHERE id = %s", (user[0],))
    token = generate_token()
    expires = datetime.now() + timedelta(days=30)
    cur.execute("INSERT INTO sg_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user[0], token, expires))
    conn.commit()
    conn.close()
    return json_response({'token': token, 'user': {'id': user[0], 'username': user[1], 'email': user[2], 'role': user[3], 'avatar_url': user[4], 'bio': user[5]}})


def get_me(token):
    if not token:
        return json_response({'error': 'Не авторизован'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    conn.close()
    if not user:
        return json_response({'error': 'Сессия истекла'}, 401)
    return json_response({'id': user[0], 'username': user[1], 'role': user[2], 'avatar_url': user[3], 'bio': user[4], 'email': user[5]})


def logout(token):
    if not token:
        return json_response({'ok': True})
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE sg_sessions SET expires_at = NOW() WHERE token = %s", (token,))
    conn.commit()
    conn.close()
    return json_response({'ok': True})


def update_profile(token, body):
    if not token:
        return json_response({'error': 'Не авторизован'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user:
        conn.close()
        return json_response({'error': 'Не авторизован'}, 401)
    bio = body.get('bio', '')
    username = body.get('username', user[1]).strip()
    if username and len(username) >= 3:
        cur.execute("UPDATE sg_users SET username = %s, bio = %s WHERE id = %s", (username, bio, user[0]))
    else:
        cur.execute("UPDATE sg_users SET bio = %s WHERE id = %s", (bio, user[0]))
    conn.commit()
    cur.execute("SELECT id, username, role, avatar_url, bio, email FROM sg_users WHERE id = %s", (user[0],))
    u = cur.fetchone()
    conn.close()
    return json_response({'id': u[0], 'username': u[1], 'role': u[2], 'avatar_url': u[3], 'bio': u[4], 'email': u[5]})


def admin_stats(token):
    if not token:
        return json_response({'error': 'Нет доступа'}, 403)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
        return json_response({'error': 'Доступ запрещён'}, 403)
    cur.execute("SELECT COUNT(*) FROM sg_users")
    users_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM sg_posts")
    posts_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM sg_messages")
    messages_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM sg_videos WHERE is_active = true")
    videos_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM sg_tasks WHERE is_active = true")
    tasks_count = cur.fetchone()[0]
    conn.close()
    return json_response({'users': users_count, 'posts': posts_count, 'messages': messages_count, 'videos': videos_count, 'tasks': tasks_count})


def admin_get_users(token):
    if not token:
        return json_response({'error': 'Нет доступа'}, 403)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
        return json_response({'error': 'Доступ запрещён'}, 403)
    cur.execute("SELECT id, username, email, role, is_active, created_at, last_seen FROM sg_users ORDER BY created_at DESC LIMIT 100")
    rows = cur.fetchall()
    conn.close()
    users = [{'id': r[0], 'username': r[1], 'email': r[2], 'role': r[3], 'is_active': r[4], 'created_at': str(r[5]), 'last_seen': str(r[6])} for r in rows]
    return json_response({'users': users})


def admin_update_user(token, user_id, body):
    if not token:
        return json_response({'error': 'Нет доступа'}, 403)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
        return json_response({'error': 'Доступ запрещён'}, 403)
    role = body.get('role')
    is_active = body.get('is_active')
    if role is not None:
        cur.execute("UPDATE sg_users SET role = %s WHERE id = %s", (role, user_id))
    if is_active is not None:
        cur.execute("UPDATE sg_users SET is_active = %s WHERE id = %s", (is_active, user_id))
    conn.commit()
    conn.close()
    return json_response({'ok': True})
