import { useState, useCallback } from 'react';
import ChatWindow from './components/ChatWindow';
import { sendMessage, clearSession } from './api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

// Persistent session ID for this browser tab
const SESSION_ID = `kramer-${Math.random().toString(36).slice(2, 10)}`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const reply = await sendMessage(text, SESSION_ID);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = useCallback(async () => {
    await clearSession(SESSION_ID);
    setMessages([]);
    setError(null);
  }, []);

  return (
    <ChatWindow
      messages={messages}
      loading={loading}
      error={error}
      onSend={handleSend}
      onClear={handleClear}
    />
  );
}
