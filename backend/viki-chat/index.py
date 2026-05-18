import json
import os
from groq import Groq


def handler(event: dict, context) -> dict:
    """Отвечает на текстовый запрос пользователя от имени Вики через Groq."""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    message = body.get('message', '').strip()

    if not message:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Сообщение не указано'})
        }

    client = Groq(api_key=os.environ['GROQ_API_KEY'])

    response = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=[
            {
                'role': 'system',
                'content': (
                    'Ты — Вики, умный и дружелюбный ИИ-ассистент. '
                    'Отвечай на русском языке, кратко и по делу. '
                    'Ты можешь помочь с генерацией текста, ответами на вопросы, '
                    'поиском информации и творческими задачами.'
                )
            },
            {'role': 'user', 'content': message}
        ],
        max_tokens=1000,
    )

    answer = response.choices[0].message.content

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'answer': answer}, ensure_ascii=False)
    }