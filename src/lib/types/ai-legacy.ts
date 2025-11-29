/**
 * Type definitions for AI SDK v4 (legacy) messages
 * These types are used for backward compatibility with stored messages
 * Originally from 'ai' package v4.3.x
 */

export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: 'partial-call' | 'call' | 'result';
  result?: unknown;
}

export interface Message {
  id?: string;
  role: 'system' | 'user' | 'assistant' | 'data';
  content?: string;
  data?: unknown;
  reasoning?: string;
  toolInvocations?: ToolInvocation[];
  parts?: Array<
    | { type: 'text'; text: string }
    | { type: 'tool-invocation'; toolInvocation: ToolInvocation }
    | { type: 'reasoning'; reasoning: string; details: Array<{ type: 'text'; text: string }> }
    | { type: 'source'; source: { id: string; url: string; title?: string; sourceType: 'url' } }
    | { type: 'file'; mimeType: string; data: string }
  >;
}

export interface UIMessage extends Message {
  id: string;
  parts: NonNullable<Message['parts']>;
}
