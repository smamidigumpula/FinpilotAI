'use client';

import { useState, useEffect, useRef } from 'react';
import UIRenderer from './UIRenderer';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  uiComponents?: any[];
  data?: any;
  agentTrace?: string[];
}

interface ChatInterfaceProps {
  householdId: string;
  variant?: 'full' | 'compact';
  className?: string;
}

export default function ChatInterface({ householdId, variant = 'full', className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history
    fetch(`/api/chat?householdId=${householdId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(
            data.messages.map((msg: any) => ({
              role: msg.role,
              text: msg.text,
              uiComponents: msg.metadata?.uiComponents,
              data: msg.metadata?.data,
            }))
          );
        }
      })
      .catch(console.error);
  }, [householdId]);

  const handleClear = async () => {
    try {
      await fetch(`/api/chat?householdId=${householdId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    } finally {
      setMessages([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          query: input,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        text: data.message,
        uiComponents: data.uiComponents,
        data: data.data,
        agentTrace: data.agentTrace,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        text: `Error: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQueries = [
    "How can I reduce my expenses?",
    "Show me my complete financial picture",
    "What are my highest interest rates?",
    "Where can I save money?",
    "How much am I spending on food?",
  ];

  const containerHeight =
    variant === 'compact' ? 'h-[480px] max-h-[60vh]' : 'h-[calc(100vh-200px)]';

  return (
    <div
      className={`flex flex-col ${containerHeight} bg-white rounded-2xl shadow-lg border border-slate-100 ${className || ''}`}
    >
      {variant === 'compact' && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-sky-50 via-white to-indigo-50">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Assistant</div>
            <div className="text-lg font-semibold text-slate-900">Ask FinpilotAI</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
              disabled={loading}
            >
              Clear chat
            </button>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>
        </div>
      )}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              
              {msg.uiComponents && msg.uiComponents.length > 0 && (
                <div className="mt-4">
                  <UIRenderer components={msg.uiComponents} data={msg.data} />
                </div>
              )}

              {msg.agentTrace && msg.agentTrace.length > 0 && (
                <details className="mt-2 text-xs opacity-75">
                  <summary className="cursor-pointer">View agent trace</summary>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    {msg.agentTrace.map((trace, i) => (
                      <li key={i}>{trace}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="mb-3">
          <p className="text-xs text-slate-500 text-center mb-2">
            Ask me questions like:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((query, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(query)}
                className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs hover:bg-indigo-100"
              >
                {query}
              </button>
            ))}
            {variant !== 'compact' && (
              <button
                type="button"
                onClick={handleClear}
                className="ml-auto text-xs font-medium text-slate-500 hover:text-slate-700"
                disabled={loading}
              >
                Clear chat
              </button>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your finances..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
