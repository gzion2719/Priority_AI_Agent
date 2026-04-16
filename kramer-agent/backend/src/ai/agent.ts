import Anthropic from '@anthropic-ai/sdk';
import { PRIORITY_TOOLS, executeTool } from './tools';
import { buildSystemPrompt } from './prompts';

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_ITERATIONS = 10;

export type ConversationHistory = Anthropic.Messages.MessageParam[];

export interface AgentResult {
  reply: string;
  updatedHistory: ConversationHistory;
}

export async function runAgent(
  history: ConversationHistory,
  userMessage: string
): Promise<AgentResult> {
  const messages: ConversationHistory = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  let reply = '';
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await claude.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: buildSystemPrompt(),
      tools: PRIORITY_TOOLS,
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(
        (b): b is Anthropic.Messages.TextBlock => b.type === 'text'
      );
      reply = textBlock?.text ?? '';
      messages.push({ role: 'assistant', content: response.content });
      break;
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
      );

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => {
          console.log(`[tool] ${block.name}`, JSON.stringify(block.input));
          const result = await executeTool(block.name, block.input as Record<string, unknown>);
          console.log(`[tool result] ${result.slice(0, 200)}...`);
          return {
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: result,
          };
        })
      );

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Unexpected stop reason
    console.warn('Unexpected stop_reason:', response.stop_reason);
    break;
  }

  if (iterations >= MAX_ITERATIONS) {
    reply = 'I reached the maximum number of queries. Please try a more specific question.';
  }

  return { reply, updatedHistory: messages };
}
