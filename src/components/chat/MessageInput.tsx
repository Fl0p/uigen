"use client";

import { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: MessageInputProps) {
  console.log('[MessageInput] 🎨 Rendered - input length:', input.length, 'isLoading:', isLoading);
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    console.log('[MessageInput] ⌨️ Key pressed:', e.key, 'shiftKey:', e.shiftKey);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      console.log('[MessageInput] 📤 Enter pressed, submitting form');
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    console.log('[MessageInput] 📮 Form submit triggered, input:', input);
    e.preventDefault();
    console.log('[MessageInput] 🚀 Calling handleSubmit');
    handleSubmit(e);
  };

  return (
    <form onSubmit={onSubmit} className="relative p-4 bg-white border-t border-neutral-200/60">
      <div className="relative max-w-4xl mx-auto">
        <textarea
          value={input}
          onChange={(e) => {
            console.log('[MessageInput] ✍️ Input changed:', e.target.value.length, 'chars');
            handleInputChange(e);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Describe the React component you want to create..."
          disabled={isLoading}
          className="w-full min-h-[80px] max-h-[200px] pl-4 pr-14 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-neutral-400 text-[15px] font-normal shadow-sm"
          rows={3}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          onClick={(e) => {
            console.log('[MessageInput] 🖱️ Button clicked, disabled:', isLoading || !input.trim());
          }}
          className="absolute right-3 bottom-3 p-2.5 rounded-lg transition-all hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
        >
          <Send className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isLoading || !input.trim() ? 'text-neutral-300' : 'text-blue-600'}`} />
        </button>
      </div>
    </form>
  );
}