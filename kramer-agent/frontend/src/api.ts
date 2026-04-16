const API_BASE = '/api';

export async function sendMessage(
  message: string,
  sessionId: string
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const data = await res.json() as { reply: string };
  return data.reply;
}

export async function clearSession(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/chat/${sessionId}`, { method: 'DELETE' });
}
