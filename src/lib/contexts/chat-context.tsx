"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useFileSystem } from "./file-system-context";
import { setHasAnonWork } from "@/lib/anon-work-tracker";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: UIMessage[];
}

interface ChatContextType {
  messages: UIMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall } = useFileSystem();

  const chatOptions: any = {
    initialMessages,
    experimental_prepareRequestBody: ({ messages }: any) => {
      console.log('[Chat] 🎒 Preparing request body with', messages.length, 'messages');
      return {
        messages,
        files: fileSystem.serialize(),
        projectId,
      };
    },
    onToolCall: ({ toolCall }: any) => {
      console.log('[Chat] 🔧 Tool call received:', toolCall.toolName);
      handleToolCall(toolCall);
    },
    onError: (error: any) => {
      console.error('[Chat] ❌ Error:', error);
    },
    onFinish: ({ message }: any) => {
      console.log('[Chat] ✅ Message finished:', message.role, 'parts:', message.parts?.length);
    },
    transport: new DefaultChatTransport({
      api: "/api/chat"
    })
  };

  const {
    messages,
    sendMessage,
    status
  } = useAIChat(chatOptions);
  
  const [input, setInput] = useState('');
  
  console.log('[Chat] Current status:', status, 'messages:', messages.length, 'input:', input);

  // Track anonymous work
  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('[ChatContext] ✍️ Input change handler called:', e.target.value.length);
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('[ChatContext] 🚀 Submit handler called!');
    console.log('[ChatContext] Input value:', input);
    console.log('[ChatContext] Current status:', status);
    console.log('[ChatContext] Messages count:', messages.length);
    
    // Check if input is empty
    if (!input.trim()) {
      console.warn('[ChatContext] ⚠️ Input is empty, not submitting');
      return;
    }
    
    try {
      console.log('[ChatContext] ✅ Calling sendMessage');
      
      // In AI SDK 5, use sendMessage instead of handleSubmit
      sendMessage({ text: input });
      
      console.log('[ChatContext] 🧹 Clearing input');
      setInput('');
      
      console.log('[ChatContext] 🎬 Message sent successfully');
    } catch (error) {
      console.error('[ChatContext] ❌ Error in sendMessage:', error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages: messages as UIMessage[],
        input,
        handleInputChange,
        handleSubmit,
        status,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}