import { GL } from "./gl";
import { Pill } from "./Pill";
import { useCallback } from "react";
import { Header } from "./Header";
import { ChatPanel } from "./ChatPanel";
import { WelcomeGreeting } from "./WelcomeGreeting";

export function Hero() {
  const handleSpeak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.pitch = 1.1;

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((v) => v.lang.startsWith('ru') && /female|woman|жен/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith('ru')) ||
        voices.find((v) => /female|woman/i.test(v.name)) ||
        voices[0];
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        trySpeak();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  return (
    <div className="flex flex-col min-h-svh justify-between relative z-10">
      <GL hovering={false} />
      <Header />

      <div className="pb-16 mt-auto text-center relative">
        <Pill className="mb-6">САМООБУЧАЮЩИЙСЯ ИИ</Pill>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient">
          Познакомьтесь <br />
          с <i className="font-light">Вики</i>
        </h1>
        <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-8 max-w-[440px] mx-auto">
          Искусственный интеллект, который учится с каждым взаимодействием. Генерация текста, фото, видео и музыки — всё в одном месте.
        </p>

        <div className="mt-8">
          <WelcomeGreeting onSpeak={handleSpeak} />
        </div>

        <ChatPanel />
      </div>
    </div>
  );
}
