"""
Посты Социальной Грозы. GET /, POST /, PUT /:id, DELETE /:id
"""
import json
import os
import psycopg2


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
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
    post_id = None
    for p in path_parts:
        if p.isdigit():
            post_id = int(p)

    if method == 'GET':
        return get_posts()
    elif method == 'POST':
        return create_post(token, body)
    elif method == 'PUT' and post_id:
        return update_post(token, post_id, body)
    elif method == 'DELETE' and post_id:
        return delete_post(token, post_id)

    return json_response({'error': 'Not found'}, 404)


def get_posts():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.id, p.title, p.content, p.image_url, p.is_pinned, p.views, p.created_at,
               u.id as uid, u.username, u.avatar_url, u.role
        FROM sg_posts p
        JOIN sg_users u ON u.id = p.author_id
        ORDER BY p.is_pinned DESC, p.created_at DESC
        LIMIT 50
    """)
    rows = cur.fetchall()
    conn.close()
    posts = []
    for r in rows:
        posts.append({
            'id': r[0], 'title': r[1], 'content': r[2], 'image_url': r[3],
            'is_pinned': r[4], 'views': r[5], 'created_at': str(r[6]),
            'author': {'id': r[7], 'username': r[8], 'avatar_url': r[9], 'role': r[10]}
        })
    return json_response({'posts': posts})


def create_post(token, body):
    if not token:
        return json_response({'error': 'Не авторизован'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
        return json_response({'error': 'Только администраторы могут создавать посты'}, 403)

    title = body.get('title', '').strip()
    content = body.get('content', '').strip()
    image_url = body.get('image_url', None)
    is_pinned = body.get('is_pinned', False)

    if not title or not content:
        conn.close()
        return json_response({'error': 'Заголовок и содержание обязательны'}, 400)

    cur.execute(
        "INSERT INTO sg_posts (author_id, title, content, image_url, is_pinned) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (user[0], title, content, image_url, is_pinned)
    )
    post_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return json_response({'id': post_id, 'ok': True})


def update_post(token, post_id, body):
    if not token:
        return json_response({'error': 'Не авторизован'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
        return json_response({'error': 'Нет доступа'}, 403)

    title = body.get('title', '').strip()
    content = body.get('content', '').strip()
    is_pinned = body.get('is_pinned', False)

    cur.execute(
        "UPDATE sg_posts SET title=%s, content=%s, is_pinned=%s, updated_at=NOW() WHERE id=%s",
        (title, content, is_pinned, post_id)
    )
    conn.commit()
    conn.close()
    return json_response({'ok': True})


def delete_post(token, post_id):
    if not token:
        return json_response({'error': 'Не авторизован'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
        return json_response({'error': 'Нет доступа'}, 403)
    cur.execute("UPDATE sg_posts SET is_pinned = false WHERE id = %s", (post_id,))
    cur.execute("UPDATE sg_posts SET views = 0 WHERE id = %s", (post_id,))
    cur.execute("UPDATE sg_posts SET content = '[удалено]' WHERE id = %s", (post_id,))
    conn.commit()
    conn.close()
    return json_response({'ok': True})
