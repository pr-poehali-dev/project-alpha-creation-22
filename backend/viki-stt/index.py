import json
import os
import base64
from openai import OpenAI


def handler(event: dict, context) -> dict:
    """Распознавание речи: преобразует аудио (base64) в текст через Whisper."""
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
    audio_b64 = body.get('audio', '').strip()

    if not audio_b64:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Аудио не передано'})
        }

    audio_bytes = base64.b64decode(audio_b64)

    client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

    import io
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = 'audio.webm'

    transcript = client.audio.transcriptions.create(
        model='whisper-1',
        file=audio_file,
        language='ru',
    )

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'text': transcript.text}, ensure_ascii=False)
    }
