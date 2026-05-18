import { useState, useEffect } from 'react';

const USER_URL = 'https://functions.poehali.dev/99d22a12-db97-4dd9-bc43-4ba8bf00baac';

export interface UserProfile {
  registered: boolean;
  id?: number;
  name?: string | null;
  nickname?: string | null;
}

function getSessionId(): string {
  let sid = localStorage.getItem('viki_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('viki_session_id', sid);
  }
  return sid;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionId = getSessionId();

  useEffect(() => {
    fetch(USER_URL, {
      headers: { 'X-Session-Id': sessionId },
    })
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => setUser({ registered: false }))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(name: string, nickname: string): Promise<UserProfile> {
    const res = await fetch(USER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({ name, nickname }),
    });
    const data = await res.json();
    setUser(data);
    return data;
  }

  function getDisplayName(): string | null {
    if (!user) return null;
    return user.nickname || user.name || null;
  }

  return { user, loading, saveProfile, getDisplayName, sessionId };
}
