import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import type { Message } from '../App';
import './ChatWindow.css';

interface Props {
  messages: Message[];
  loading: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onClear: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Detect if text contains Hebrew characters
function isRTL(text: string): boolean {
  return /[\u0590-\u05FF\uFB1D-\uFB4F]/.test(text);
}

export default function ChatWindow({ messages, loading, error, onSend, onClear }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [input]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    onSend(text);
  }

  return (
    <div className="chat-layout">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <div className="chat-logo">K</div>
          <div>
            <div className="chat-title">KRAMER</div>
            <div className="chat-subtitle">Priority ERP Assistant</div>
          </div>
        </div>
        <button className="btn-clear" onClick={onClear} title="New conversation">
          New chat
        </button>
      </header>

      {/* Messages */}
      <main className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p>Ask anything about your orders, invoices, or documents.</p>
            <p dir="rtl" lang="he">שאל כל שאלה על ההזמנות, החשבוניות או המסמכים שלך.</p>
            <div className="chat-suggestions">
              <button className="suggestion" onClick={() => onSend('How many open sales orders do we have?')}>
                Open sales orders?
              </button>
              <button className="suggestion" onClick={() => onSend('כמה הזמנות רכש פתוחות יש לנו?')}>
                הזמנות רכש פתוחות?
              </button>
              <button className="suggestion" onClick={() => onSend('Show me the 5 largest invoices this year')}>
                Largest invoices this year
              </button>
              <button className="suggestion" onClick={() => onSend('מה סך כל החשבוניות שלא שולמו?')}>
                חשבוניות שלא שולמו
              </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message message-${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? 'U' : 'K'}
            </div>
            <div className="message-body">
              <div
                className="message-bubble"
                dir={isRTL(msg.text) ? 'rtl' : 'ltr'}
              >
                {msg.text.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
              <div className="message-time">{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message message-assistant">
            <div className="message-avatar">K</div>
            <div className="message-body">
              <div className="message-bubble message-typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="chat-error">
            Error: {error}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="chat-input-area">
        <div className="chat-input-box">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question... / שאל שאלה..."
            rows={1}
            dir={isRTL(input) ? 'rtl' : 'ltr'}
          />
          <button
            className="btn-send"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            ➤
          </button>
        </div>
        <div className="chat-input-hint">Enter to send · Shift+Enter for new line</div>
      </footer>
    </div>
  );
}
