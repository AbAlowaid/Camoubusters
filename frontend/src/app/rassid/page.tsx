'use client';

import { useState, useRef, useEffect } from 'react';
import AILoadingAnimation from '@/components/AILoadingAnimation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    reports_count?: number;
    reports_used?: string[];
  };
}

export default function RassidPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "RASSID AI SYSTEM ONLINE. I'm your tactical AI assistant for the CamouBusters detection system. Query detection reports using natural language.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const exampleQuestions = [
    "How many detections today?",
    "Show high-severity detections",
    "List forest environment reports",
    "Summarize last 24 hours"
  ];

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
      setShouldAutoScroll(false);
    }
  }, [messages, shouldAutoScroll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShouldAutoScroll(true);

    try {
      const formData = new FormData();
      formData.append('query', input);

      const response = await fetch('http://localhost:8000/api/moraqib_query', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || "ERROR: Unable to process query.",
        timestamp: new Date(),
        metadata: {
          reports_count: data.reports_count,
          reports_used: data.reports_used
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setShouldAutoScroll(true);
    } catch (error) {
      console.error('Rassid query error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "❌ CONNECTION ERROR. Backend server unreachable. Verify server status.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setShouldAutoScroll(true);
    } finally {
      setIsLoading(false);
    }
  };

  const askExample = (question: string) => {
    setInput(question);
  };

  if (!isHydrated) {
    return <AILoadingAnimation />;
  }

  return (
    <div className="min-h-screen bg-tactical-black">
      {/* HUD Header */}
      <div className="bg-tactical-dark border-b-2 border-hud-border">
        <div className="container mx-auto px-4 py-6">
          <div className="hud-header">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-tactical-olive flex items-center justify-center border-2 border-radar-green">
                <span className="text-2xl text-radar-green font-bold">◈</span>
              </div>
              <div>
                <h1 className="text-3xl font-stencil font-black text-radar-green uppercase tracking-wider">Rassid Assistant</h1>
                <p className="text-gray-400 font-mono text-sm uppercase tracking-wide">AI-powered detection report analysis</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="status-indicator"></span>
                <span className="text-radar-green font-mono text-xs uppercase">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command & Control Chat Container */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="hud-card scanline">
          {/* Messages Area */}
          <div className="h-[600px] overflow-y-auto p-6 space-y-4 grid-overlay">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-6 py-4 border-2 font-mono ${
                    message.role === 'user'
                      ? 'bg-tactical-olive border-radar-green text-white shadow-tactical'
                      : 'bg-tactical-slate border-hud-border text-gray-200'
                  }`}
                >
                  {/* Role Indicator */}
                  <p className="text-xs font-stencil uppercase tracking-widest mb-2 opacity-70">
                    {message.role === 'user' ? '▸ OPERATOR' : '◂ RASSID'}
                  </p>

                  {/* Message Content */}
                  <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>

                  {/* Metadata */}
                  {message.metadata && message.metadata.reports_count !== undefined && (
                    <div className="mt-3 pt-3 border-t border-hud-border">
                      <p className="text-xs text-radar-green font-mono uppercase">
                        ▣ Analyzed {message.metadata.reports_count} report{message.metadata.reports_count !== 1 ? 's' : ''}
                      </p>
                      {message.metadata.reports_used && message.metadata.reports_used.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                          ▢ Used: {message.metadata.reports_used.slice(0, 3).join(', ')}
                          {message.metadata.reports_used.length > 3 && ` +${message.metadata.reports_used.length - 3} more`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-tactical-slate border-2 border-hud-border px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-radar-green animate-pulse" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-radar-green animate-pulse" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-radar-green animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-radar-green ml-2 font-mono uppercase">Processing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Example Questions */}
          {messages.length === 1 && (
            <div className="px-6 py-4 bg-tactical-dark border-t-2 border-hud-border">
              <p className="text-sm text-radar-green mb-3 font-stencil uppercase tracking-wider">▣ Quick Commands:</p>
              <div className="flex flex-wrap gap-2">
                {exampleQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => askExample(question)}
                    className="text-xs px-3 py-2 bg-tactical-slate border border-hud-border hover:border-radar-green text-gray-300 hover:text-radar-green transition-all font-mono uppercase"
                  >
                    ▸ {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area - Tactical Command Line */}
          <form onSubmit={handleSubmit} className="p-6 bg-tactical-dark border-t-2 border-hud-border">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ENTER QUERY..."
                className="input-tactical flex-1"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="btn-tactical px-8 py-4"
              >
                {isLoading ? '...' : '▸ SEND'}
              </button>
            </div>
          </form>
        </div>

        {/* System Status Footer */}
        <div className="mt-4 p-3 bg-tactical-dark border border-hud-border font-mono text-xs text-gray-400 flex justify-between">
          <span>STATUS: OPERATIONAL</span>
          <span>QUERIES: {messages.filter(m => m.role === 'user').length}</span>
          <span>SYSTEM: RASSID v1.0</span>
        </div>
      </div>
    </div>
  );
}
