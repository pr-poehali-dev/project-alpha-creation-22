const TTS_URL = "https://functions.poehali.dev/0fc8a8b2-0512-46a4-ae68-ad340b05a406";

let currentSource: AudioBufferSourceNode | null = null;
let audioCtx: AudioContext | null = null;

export function stopSpeaking() {
  try {
    currentSource?.stop();
  } catch {
    // уже остановлен
  }
  currentSource = null;
}

export function isSpeaking(): boolean {
  return currentSource !== null;
}

export async function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
): Promise<void> {
  stopSpeaking();

  try {
    const res = await fetch(TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error("TTS error");

    const data = await res.json();
    const audioBytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));

    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    const buffer = await audioCtx.decodeAudioData(audioBytes.buffer);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);

    currentSource = source;
    onStart?.();

    source.onended = () => {
      currentSource = null;
      onEnd?.();
    };

    source.start();
  } catch {
    currentSource = null;
    onEnd?.();
  }
}
