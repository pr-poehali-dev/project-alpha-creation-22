import json
import os
import base64
from openai import OpenAI


def handler(event: dict, context) -> dict:
    """Синтез речи: преобразует текст в аудио женским голосом (nova)."""
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
    text = body.get('text', '').strip()

    if not text:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Текст не указан'})
        }

    client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

    response = client.audio.speech.create(
        model='tts-1',
        voice='nova',
        input=text[:4096],
    )

    audio_bytes = response.read()
    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'audio': audio_b64})
    }
