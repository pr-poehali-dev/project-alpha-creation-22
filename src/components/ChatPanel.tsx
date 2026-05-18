import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Icon from "@/components/ui/icon";

const CHAT_URL = "https://functions.poehali.dev/2893fb7c-9041-491c-8699-bd0dc07fa5c7";
const TTS_URL = "https://functions.poehali.dev/9e7e379a-051a-4882-8a25-16c1241a5ca1";
const STT_URL = "https://functions.poehali.dev/4186db87-e703-459f-8348-8ef2427c0dea";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const answer = data.answer || "Что-то пошло не так...";
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
      speakText(answer);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Не удалось получить ответ. Проверь подключение." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function speakText(text: string) {
    try {
      setSpeaking(true);
      const res = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.audio) return;
      const bytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      audio.play();
    } catch {
      setSpeaking(false);
    }
  }

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const buffer = await blob.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        try {
          const res = await fetch(STT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: b64 }),
          });
          const data = await res.json();
          if (data.text) {
            sendMessage(data.text);
          }
        } catch {
          // ignore
        }
      };
      recorder.start();
      setRecording(true);
    } catch {
      alert("Нет доступа к микрофону");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 px-4">
      {/* История сообщений */}
      {messages.length > 0 && (
        <div className="mb-4 max-h-80 overflow-y-auto flex flex-col gap-3 pr-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 items-start",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="size-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-glow shadow-primary/40">
                  <span className="text-xs font-bold text-black">В</span>
                </div>
              )}
              <div
                className={cn(
                  "font-mono text-sm rounded-sm px-4 py-3 max-w-[80%] leading-relaxed",
                  msg.role === "user"
                    ? "bg-[#262626]/80 text-foreground/80 border border-border"
                    : "bg-primary/10 text-foreground border border-primary/20"
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 items-start">
              <div className="size-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-glow shadow-primary/40">
                <span className="text-xs font-bold text-black">В</span>
              </div>
              <div className="font-mono text-sm bg-primary/10 border border-primary/20 rounded-sm px-4 py-3 text-foreground/50">
                <span className="animate-pulse">Вики думает...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Панель ввода */}
      <div className="relative border border-border bg-[#111]/80 backdrop-blur-sm rounded-sm">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Спроси Вики что угодно..."
          rows={1}
          className="w-full bg-transparent font-mono text-sm text-foreground placeholder:text-foreground/30 px-4 pt-4 pb-12 resize-none outline-none leading-relaxed"
        />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Кнопка микрофона */}
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              className={cn(
                "size-8 rounded-full flex items-center justify-center transition-all duration-200",
                recording
                  ? "bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse"
                  : "bg-[#262626] border border-border text-foreground/50 hover:text-foreground hover:border-foreground/30"
              )}
              title={recording ? "Остановить запись" : "Голосовой ввод"}
            >
              <Icon name={recording ? "MicOff" : "Mic"} size={14} />
            </button>

            {/* Кнопка остановить голос */}
            {speaking && (
              <button
                onClick={stopSpeaking}
                className="size-8 rounded-full flex items-center justify-center bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-all duration-200"
                title="Остановить озвучку"
              >
                <Icon name="VolumeX" size={14} />
              </button>
            )}

            {speaking && (
              <span className="font-mono text-xs text-primary/60 animate-pulse">
                озвучиваю...
              </span>
            )}
            {recording && (
              <span className="font-mono text-xs text-red-400/80 animate-pulse">
                слушаю...
              </span>
            )}
          </div>

          {/* Кнопка отправить */}
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className={cn(
              "size-8 rounded-full flex items-center justify-center transition-all duration-200",
              input.trim() && !loading
                ? "bg-primary text-black hover:bg-primary/80"
                : "bg-[#262626] border border-border text-foreground/20"
            )}
            title="Отправить (Enter)"
          >
            <Icon name="ArrowUp" size={14} />
          </button>
        </div>
      </div>

      <p className="text-center font-mono text-xs text-foreground/20 mt-3">
        Enter — отправить · Shift+Enter — перенос строки
      </p>
    </div>
  );
}
