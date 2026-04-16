import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import { runAgent, ConversationHistory } from './ai/agent';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory session storage: sessionId → conversation history
const sessions = new Map<string, ConversationHistory>();

// POST /api/chat — send a message
app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body as { message?: string; sessionId?: string };

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'message and sessionId are required' });
  }

  const history = sessions.get(sessionId) ?? [];

  try {
    const { reply, updatedHistory } = await runAgent(history, message);
    sessions.set(sessionId, updatedHistory);
    return res.json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Agent error:', message);
    return res.status(500).json({ error: message });
  }
});

// DELETE /api/chat/:sessionId — clear conversation
app.delete('/api/chat/:sessionId', (req, res) => {
  sessions.delete(req.params.sessionId);
  return res.json({ cleared: true });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', sessions: sessions.size });
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`Kramer Agent backend running on http://localhost:${PORT}`);
});
