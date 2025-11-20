"use client";

import { useEffect, useRef } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/lib/contexts/chat-context";

export function ChatInterface() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit, status } = useChat();

  console.log('[ChatInterface] 🎯 Rendered - messages:', messages.length, 'status:', status, 'input:', input.length);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    console.log('[ChatInterface] 📜 Messages changed, scrolling to bottom');
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const wrappedHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log('[ChatInterface] 📨 Submit intercepted, passing to handleSubmit');
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <div className="pr-4">
          <MessageList messages={messages} isLoading={status === "streaming"} />
        </div>
      </ScrollArea>
      <div className="mt-4 flex-shrink-0">
        <MessageInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={wrappedHandleSubmit}
          isLoading={status === "submitted" || status === "streaming"}
        />
      </div>
    </div>
  );
}
