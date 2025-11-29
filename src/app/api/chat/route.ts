import type { FileNode } from "@/lib/file-system";
import { VirtualFileSystem } from "@/lib/file-system";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLanguageModel } from "@/lib/provider";
import { generationPrompt } from "@/lib/prompts/generation";
import { convertV5MessageToV4 } from "@/lib/convert-messages";
import { supportsPromptCaching, getProviderType } from "@/lib/ai/config";

export async function POST(req: Request) {
  console.log('[API] 🚀 Chat request received');
  
  const body = await req.json();
  console.log('[API] 📦 Request body keys:', Object.keys(body));
  
  const {
    messages,
    files,
    projectId,
  }: { messages: UIMessage[]; files?: Record<string, FileNode>; projectId?: string } = body;

  console.log('[API] 📝 Messages count:', messages.length);
  console.log('[API] 📁 Files:', files ? Object.keys(files).length : 'undefined');
  console.log('[API] 🔑 Project ID:', projectId || 'none');

  // Reconstruct the VirtualFileSystem from serialized data
  const fileSystem = new VirtualFileSystem();
  if (files) {
    fileSystem.deserializeFromNodes(files);
  }
  console.log('[API] 💾 File system reconstructed');

  // Prepare system message with conditional cache control
  const systemMessage = supportsPromptCaching()
    ? {
        role: "system" as const,
        content: generationPrompt,
        providerOptions: {
          anthropic: { cacheControl: { type: "ephemeral" } },
        },
      }
    : {
        role: "system" as const,
        content: generationPrompt,
      };

  // Convert UIMessages to model messages and add system message
  const modelMessages = convertToModelMessages(messages);
  modelMessages.unshift(systemMessage);

  const model = getLanguageModel();
  const providerType = getProviderType();
  const isMockProvider = providerType === "mock";

  console.log('[API] 🤖 Active provider:', providerType.toUpperCase());
  console.log('[API] 📤 Starting stream with', modelMessages.length, 'messages');
  
  const result = streamText({
    model,
    messages: modelMessages,
    maxOutputTokens: 10_000,
    stopWhen: stepCountIs(isMockProvider ? 4 : 40),
    onError: (err: any) => {
      console.error('[API] ❌ Stream error:', err);
    },
    tools: {
      str_replace_editor: buildStrReplaceTool(fileSystem),
      file_manager: buildFileManagerTool(fileSystem),
    },
  });
  
  console.log('[API] ✅ Stream initialized, returning response');

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: allMessages }) => {
      console.log('[API] 🏁 Stream finished, total messages:', allMessages.length);
      
      // Save to project if projectId is provided and user is authenticated
      if (projectId) {
        console.log('[API] 💾 Attempting to save project:', projectId);
        try {
          // Check if user is authenticated
          const session = await getSession();
          if (!session) {
            console.error("[API] ❌ User not authenticated, cannot save project");
            return;
          }

          console.log('[API] ✅ User authenticated, converting messages...');
          // Convert v5 messages to v4 format for database storage
          const v4Messages = allMessages.map((msg) => convertV5MessageToV4(msg as any));

          console.log('[API] 💾 Saving to database...');
          await prisma.project.update({
            where: {
              id: projectId,
              userId: session.userId,
            },
            data: {
              messages: JSON.stringify(v4Messages),
              data: JSON.stringify(fileSystem.serialize()),
            },
          });
          console.log('[API] ✅ Project saved successfully');
        } catch (error) {
          console.error("[API] ❌ Failed to save project data:", error);
        }
      }
    },
  });
}

export const maxDuration = 120;
