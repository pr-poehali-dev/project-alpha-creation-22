import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import Icon from "@/components/ui/icon";
import { speakText, stopSpeaking } from "@/lib/tts";

const CHAT_URL = "https://functions.poehali.dev/2893fb7c-9041-491c-8699-bd0dc07fa5c7";

interface Message {
  role: "user" | "assistant";
  text: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleStopSpeaking() {
    stopSpeaking();
    setSpeaking(false);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    handleStopSpeaking();

    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const answer = data.answer || "Что-то пошло не так...";
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
      speakText(answer, () => setSpeaking(true), () => setSpeaking(false));
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Не удалось получить ответ. Проверь подключение." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startRecording() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Голосовой ввод не поддерживается в этом браузере. Используй Chrome или Edge.");
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setRecording(false);
      sendMessage(transcript);
    };

    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);

    recognition.start();
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
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
                <div className="size-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_12px] shadow-primary/40">
                  <span className="text-xs font-bold text-black">В</span>
                </div>
              )}
              <div
                className={cn(
                  "font-mono text-sm rounded-sm px-4 py-3 max-w-[80%] leading-relaxed text-left",
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
              <div className="size-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_12px] shadow-primary/40">
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
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              title={recording ? "Остановить запись" : "Голосовой ввод"}
              className={cn(
                "size-8 rounded-full flex items-center justify-center transition-all duration-200",
                recording
                  ? "bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse"
                  : "bg-[#262626] border border-border text-foreground/50 hover:text-foreground hover:border-foreground/30"
              )}
            >
              <Icon name={recording ? "MicOff" : "Mic"} size={14} />
            </button>

            {speaking && (
              <button
                onClick={handleStopSpeaking}
                title="Остановить озвучку"
                className="size-8 rounded-full flex items-center justify-center bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-all duration-200"
              >
                <Icon name="VolumeX" size={14} />
              </button>
            )}
            {speaking && (
              <span className="font-mono text-xs text-primary/60 animate-pulse">озвучиваю...</span>
            )}
            {recording && (
              <span className="font-mono text-xs text-red-400/80 animate-pulse">слушаю...</span>
            )}
          </div>

          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            title="Отправить (Enter)"
            className={cn(
              "size-8 rounded-full flex items-center justify-center transition-all duration-200",
              input.trim() && !loading
                ? "bg-primary text-black hover:bg-primary/80"
                : "bg-[#262626] border border-border text-foreground/20"
            )}
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
