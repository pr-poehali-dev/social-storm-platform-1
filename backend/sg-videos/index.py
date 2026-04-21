"""
Видеотека Социальной Грозы. GET / — список видео, POST / — добавить видео (только admin).
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
    video_id = None
    for p in path_parts:
        if p.isdigit():
            video_id = int(p)

    if method == 'GET' and not video_id:
        return get_videos()
    elif method == 'POST' and 'view' in path_parts and video_id:
        return add_view(video_id)
    elif method == 'POST':
        return create_video(token, body)
    elif method == 'DELETE' and video_id:
        return delete_video(token, video_id)

    return json_response({'error': 'Not found'}, 404)


def get_videos():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT v.id, v.title, v.description, v.video_url, v.thumbnail_url, v.views, v.created_at,
               u.id as uid, u.username
        FROM sg_videos v
        JOIN sg_users u ON u.id = v.author_id
        WHERE v.is_active = true
        ORDER BY v.created_at DESC
        LIMIT 50
    """)
    rows = cur.fetchall()
    conn.close()
    videos = []
    for r in rows:
        videos.append({
            'id': r[0], 'title': r[1], 'description': r[2],
            'video_url': r[3], 'thumbnail_url': r[4], 'views': r[5], 'created_at': str(r[6]),
            'author': {'id': r[7], 'username': r[8]}
        })
    return json_response({'videos': videos})


def add_view(video_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE sg_videos SET views = views + 1 WHERE id = %s", (video_id,))
    conn.commit()
    conn.close()
    return json_response({'ok': True})


def create_video(token, body):
    if not token:
        return json_response({'error': 'Не авторизован'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
        return json_response({'error': 'Только администраторы могут добавлять видео'}, 403)

    title = body.get('title', '').strip()
    video_url = body.get('video_url', '').strip()
    description = body.get('description', '').strip()
    thumbnail_url = body.get('thumbnail_url', None)

    if not title or not video_url:
        conn.close()
        return json_response({'error': 'Укажите название и ссылку на видео'}, 400)

    cur.execute(
        "INSERT INTO sg_videos (author_id, title, description, video_url, thumbnail_url) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (user[0], title, description, video_url, thumbnail_url)
    )
    vid_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return json_response({'id': vid_id, 'ok': True})


def delete_video(token, video_id):
    if not token:
        return json_response({'error': 'Не авторизован'}, 401)
    conn = get_conn()
    cur = conn.cursor()
    user = get_user_from_token(cur, token)
    if not user or user[2] != 'admin':
        conn.close()
        return json_response({'error': 'Нет доступа'}, 403)
    cur.execute("UPDATE sg_videos SET is_active = false WHERE id = %s", (video_id,))
    conn.commit()
    conn.close()
    return json_response({'ok': True})
