import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p6725301_project_alpha_creati')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """Управление пользователями: получение профиля и сохранение имени/ника."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')

    if not session_id:
        return {
            'statusCode': 400,
            'headers': CORS,
            'body': json.dumps({'error': 'Нет session_id'})
        }

    method = event.get('httpMethod', 'GET')

    conn = get_conn()
    cur = conn.cursor()

    if method == 'GET':
        cur.execute(
            f'SELECT id, name, nickname FROM {SCHEMA}.users WHERE session_id = %s',
            (session_id,)
        )
        row = cur.fetchone()
        conn.close()
        if row:
            return {
                'statusCode': 200,
                'headers': CORS,
                'body': json.dumps({
                    'registered': True,
                    'id': row[0],
                    'name': row[1],
                    'nickname': row[2],
                }, ensure_ascii=False)
            }
        else:
            # Создаём анонимную сессию
            cur2 = psycopg2.connect(os.environ['DATABASE_URL']).cursor()
            conn2 = psycopg2.connect(os.environ['DATABASE_URL'])
            cur2 = conn2.cursor()
            cur2.execute(
                f'INSERT INTO {SCHEMA}.users (session_id) VALUES (%s) ON CONFLICT (session_id) DO NOTHING',
                (session_id,)
            )
            conn2.commit()
            conn2.close()
            return {
                'statusCode': 200,
                'headers': CORS,
                'body': json.dumps({'registered': False, 'name': None, 'nickname': None}, ensure_ascii=False)
            }

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        name = (body.get('name') or '').strip()[:100]
        nickname = (body.get('nickname') or '').strip()[:50]

        if not name and not nickname:
            conn.close()
            return {
                'statusCode': 400,
                'headers': CORS,
                'body': json.dumps({'error': 'Укажи имя или ник'})
            }

        cur.execute(
            f'''UPDATE {SCHEMA}.users
                SET name = %s, nickname = %s
                WHERE session_id = %s
                RETURNING id, name, nickname''',
            (name or None, nickname or None, session_id)
        )
        row = cur.fetchone()
        if not row:
            cur.execute(
                f'INSERT INTO {SCHEMA}.users (session_id, name, nickname) VALUES (%s, %s, %s) RETURNING id, name, nickname',
                (session_id, name or None, nickname or None)
            )
            row = cur.fetchone()
        conn.commit()
        conn.close()
        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({'registered': True, 'id': row[0], 'name': row[1], 'nickname': row[2]}, ensure_ascii=False)
        }

    conn.close()
    return {'statusCode': 405, 'headers': CORS, 'body': ''}
