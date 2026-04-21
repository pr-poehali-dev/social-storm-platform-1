"""
Общий чат Социальной Грозы. GET / — список сообщений, POST / — отправить сообщение.
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
        "SELECT u.id, u.username, u.role, u.avatar_url FROM sg_users u JOIN sg_sessions s ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    path_parts = [p for p in path.split('/') if p]
    msg_id = None
    for p in path_parts:
        if p.isdigit():
            msg_id = int(p)

    if method == 'GET':
        return get_messages()
    elif method == 'POST':
        return send_message(token, body)
    elif method == 'DELETE' and msg_id:
        return delete_message(token, msg_id)

    return json_response({'error': 'Not found'}, 404)


def get_messages():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT m.id, m.content, m.created_at,
               u.id as uid, u.username, u.avatar_url, u.role
        FROM sg_messages m
        JOIN sg_users u ON u.id = m.user_id
        ORDER BY m.created_at DESC
        LIMIT 100
    """)
    rows = cur.fetchall()
    conn.close()
    messages = []
    for r in rows:
        messages.append({
            'id': r[0], 'content': r[1], 'created_at': str(r[2]),
            'user': {'id': r[3], 'username': r[4], 'avatar_url': r[5], 'role': r[6]}
        })
    messages.reverse()
    return json_response({'messages': messages})


def send_message(token, body):
    if not token:
        return json_response({'error': 'Необходима авторизация'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user:
        conn.close()
        return json_response({'error': 'Сессия истекла'}, 401)

    content = body.get('content', '').strip()
    if not content:
        conn.close()
        return json_response({'error': 'Сообщение не может быть пустым'}, 400)
    if len(content) > 1000:
        conn.close()
        return json_response({'error': 'Сообщение слишком длинное'}, 400)

    cur.execute(
        "INSERT INTO sg_messages (user_id, content) VALUES (%s, %s) RETURNING id, created_at",
        (user[0], content)
    )
    row = cur.fetchone()
    conn.commit()
    conn.close()

    return json_response({
        'id': row[0], 'content': content, 'created_at': str(row[1]),
        'user': {'id': user[0], 'username': user[1], 'avatar_url': user[3], 'role': user[2]}
    })


def delete_message(token, msg_id):
    if not token:
        return json_response({'error': 'Не авторизован'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
        return json_response({'error': 'Нет доступа'}, 403)
    cur.execute("UPDATE sg_messages SET content = '[удалено администратором]' WHERE id = %s", (msg_id,))
    conn.commit()
    conn.close()
    return json_response({'ok': True})
