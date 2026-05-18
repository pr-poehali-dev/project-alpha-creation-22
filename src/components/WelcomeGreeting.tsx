import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/icon';
import { speakText } from '@/lib/tts';

export function WelcomeGreeting() {
  const { user, loading, saveProfile, getDisplayName } = useUser();
  const [greeting, setGreeting] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);
  const spokenRef = useRef(false);

  useEffect(() => {
    if (loading || !user) return;

    const displayName = getDisplayName();
    let text = '';

    if (user.registered && displayName) {
      text = `Привет, ${displayName}! Рада тебя видеть.`;
    } else {
      text = 'Привет, незнакомец! Я — Вики. Чем могу помочь?';
    }

    setGreeting(text);

    // Анимация появления
    const t = setTimeout(() => setVisible(true), 300);

    // Озвучиваем один раз через Groq TTS
    if (!spokenRef.current) {
      spokenRef.current = true;
      const tSpeak = setTimeout(() => speakText(text), 600);
      return () => { clearTimeout(t); clearTimeout(tSpeak); };
    }

    return () => clearTimeout(t);
  }, [user, loading]);

  async function handleSave() {
    if (!name.trim() && !nickname.trim()) return;
    setSaving(true);
    await saveProfile(name.trim(), nickname.trim());
    setSaving(false);
    setShowModal(false);
  }

  if (loading) return null;

  return (
    <>
      {/* Приветствие */}
      <div
        className={cn(
          'flex items-center gap-3 justify-center transition-all duration-700',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        <div className="size-6 rounded-full bg-primary flex items-center justify-center shadow-[0_0_10px] shadow-primary/50 flex-shrink-0">
          <span className="text-[10px] font-bold text-black">В</span>
        </div>
        <span className="font-mono text-sm text-foreground/70">{greeting}</span>

        {/* Кнопка представиться для незнакомца */}
        {!user?.registered && (
          <button
            onClick={() => setShowModal(true)}
            className="font-mono text-xs text-primary/70 hover:text-primary transition-colors underline underline-offset-2"
          >
            представиться
          </button>
        )}

        {/* Кнопка сменить имя для зарегистрированных */}
        {user?.registered && (
          <button
            onClick={() => {
              setName(user.name || '');
              setNickname(user.nickname || '');
              setShowModal(true);
            }}
            title="Изменить профиль"
            className="text-foreground/30 hover:text-foreground/60 transition-colors"
          >
            <Icon name="Pencil" size={12} />
          </button>
        )}
      </div>

      {/* Модальник регистрации */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-10 w-full max-w-sm border border-border bg-[#0f0f0f] rounded-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[9px] font-bold text-black">В</span>
                </div>
                <span className="font-mono text-sm text-foreground/80">Как тебя зовут?</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-foreground/30 hover:text-foreground/60 transition-colors"
              >
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="font-mono text-xs text-foreground/40 mb-1.5 block">Имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Алексей"
                  maxLength={100}
                  className="w-full bg-[#1a1a1a] border border-border rounded-sm px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-foreground/25 outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-foreground/40 mb-1.5 block">Ник</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Например: alex99"
                  maxLength={50}
                  className="w-full bg-[#1a1a1a] border border-border rounded-sm px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-foreground/25 outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <p className="font-mono text-xs text-foreground/30 mt-3">
              Можно заполнить только одно поле. Вики запомнит тебя на этом устройстве.
            </p>

            <button
              onClick={handleSave}
              disabled={saving || (!name.trim() && !nickname.trim())}
              className={cn(
                'w-full mt-5 py-2.5 font-mono text-sm rounded-sm transition-all duration-200',
                name.trim() || nickname.trim()
                  ? 'bg-primary text-black hover:bg-primary/80'
                  : 'bg-[#262626] text-foreground/20 cursor-not-allowed'
              )}
            >
              {saving ? 'Сохраняю...' : '[Сохранить]'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}