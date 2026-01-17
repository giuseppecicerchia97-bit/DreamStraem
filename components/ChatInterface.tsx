import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, DreamAnalysis } from '../types';
import { DreamChatSession } from '../services/geminiService';

interface ChatInterfaceProps {
  analysis: DreamAnalysis;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ analysis }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<DreamChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const systemInstruction = `
      You are a helpful, empathetic, and insightful dream interpretation assistant.
      The user has shared a dream with the following transcription: "${analysis.transcription}".
      The initial psychological interpretation provided was: "${analysis.interpretation}".
      The core emotional theme is: "${analysis.emotionalTheme}".
      
      Your goal is to answer the user's follow-up questions about specific symbols, feelings, or meanings in their dream.
      Use Jungian concepts where appropriate but remain accessible.
      Do not repeat the initial interpretation unless asked.
    `;
    chatSessionRef.current = new DreamChatSession(systemInstruction);
  }, [analysis]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await chatSessionRef.current.sendMessage(input);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting to the dream realm right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="p-4 bg-slate-800/80 border-b border-slate-700">
        <h3 className="text-lg font-serif text-indigo-300">Dream Guide</h3>
        <p className="text-xs text-slate-400">Ask about symbols, archetypes, or meanings.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-10 italic">
            "What does the water signify?"<br/>
            "Why was I flying?"<br/>
            <span className="text-sm not-italic mt-2 block">Ask me anything about your dream.</span>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800/80 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a follow-up question..."
            className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 transition-colors"
          >
            <svg className="w-6 h-6 transform -rotate-45 translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
