import json
import os
import base64
from groq import Groq

# Голос Вики: женский 28-33 лет, средний тембр, тёплый с лёгкой бархатистостью,
# доброжелательный, умеренный темп. Контекст: ИИ-ассистент в тихом офисе.
# Модель: canopylabs/orpheus-v1-english, голос: hannah
# Vocal direction: [warm] — тёплая, спокойная подача
MODEL = "canopylabs/orpheus-v1-english"
VOICE = "hannah"
MAX_CHARS = 180  # лимит модели 200, берём с запасом

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def split_text(text: str, max_len: int) -> list[str]:
    """Разбивает текст на части по границам предложений/запятых."""
    if len(text) <= max_len:
        return [text]

    chunks = []
    while text:
        if len(text) <= max_len:
            chunks.append(text)
            break
        # Ищем ближайшую точку/запятую слева от лимита
        split_at = max_len
        for sep in (". ", "! ", "? ", ", ", " "):
            pos = text.rfind(sep, 0, max_len)
            if pos > max_len // 2:
                split_at = pos + len(sep)
                break
        chunks.append(text[:split_at].strip())
        text = text[split_at:].strip()

    return chunks


def handler(event: dict, context) -> dict:
    """Синтез речи Вики через Groq Orpheus TTS. Возвращает аудио WAV в base64."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    text = (body.get("text") or "").strip()

    if not text:
        return {
            "statusCode": 400,
            "headers": CORS,
            "body": json.dumps({"error": "Текст не указан"}),
        }

    # Добавляем vocal direction для тёплой подачи
    text_with_direction = f"[warm] {text}"

    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    chunks = split_text(text_with_direction, MAX_CHARS)

    audio_parts = []
    for chunk in chunks:
        response = client.audio.speech.create(
            model=MODEL,
            voice=VOICE,
            input=chunk,
            response_format="wav",
        )
        audio_parts.append(response.read())

    # Объединяем WAV-части: берём заголовок первого, данные всех
    if len(audio_parts) == 1:
        combined = audio_parts[0]
    else:
        # WAV-заголовок = 44 байта, объединяем PCM-данные
        header = audio_parts[0][:44]
        pcm_data = b"".join(part[44:] for part in audio_parts)
        total_size = len(pcm_data) + 36
        data_size = len(pcm_data)
        # Обновляем размеры в заголовке
        header = bytearray(header)
        header[4:8] = total_size.to_bytes(4, "little")
        header[40:44] = data_size.to_bytes(4, "little")
        combined = bytes(header) + pcm_data

    audio_b64 = base64.b64encode(combined).decode("utf-8")

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"audio": audio_b64, "format": "wav"}),
    }
