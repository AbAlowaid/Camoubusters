import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { queryMoraqib, MoraqibResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  reports?: MoraqibResponse['reports_used'];
}

const exampleQueries = {
  en: [
    "How many detections in the last 24 hours?",
    "Show high-severity alerts from today",
    "What's the average soldier count per detection?",
    "List all detections with more than 3 soldiers",
  ],
  ar: [
    "كم عدد الاكتشافات في آخر 24 ساعة؟",
    "أظهر التنبيهات عالية الخطورة من اليوم",
    "ما هو متوسط عدد الجنود لكل اكتشاف؟",
    "اعرض جميع الاكتشافات بأكثر من 3 جنود",
  ],
};

export function AssistantPage() {
  const { t, lang, isRTL } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (query?: string) => {
    const text = query || input.trim();
    if (!text) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await queryMoraqib(text);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        reports: response.reports_used,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('errorOccurred') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentExamples = exampleQueries[lang];

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col hud-grid">
      {/* Header */}
      <div className={cn("mb-4", isRTL && "text-right")}>
        <h1 className="text-2xl font-tactical font-bold tracking-wider text-foreground flex items-center gap-2">
          <Bot className="w-6 h-6 text-military-glow" />
          {t('assistant')} - مراقب
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('askMoraqib')}
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Messages */}
        <div className="flex-1 flex flex-col rounded-lg border border-border bg-card/50">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="p-6 rounded-full bg-primary/10 mb-6">
                  <Sparkles className="w-12 h-12 text-military-glow" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('askMoraqib')}</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {lang === 'ar' 
                    ? 'اسأل مراقب عن تقارير الكشف، الإحصائيات، والتحليلات'
                    : 'Ask Moraqib about detection reports, statistics, and analysis'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      msg.role === 'user' ? (isRTL ? "flex-row" : "flex-row-reverse") : (isRTL ? "flex-row-reverse" : "flex-row")
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      msg.role === 'user' ? "bg-tactical-amber/20" : "bg-military-glow/20"
                    )}>
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-tactical-amber" />
                      ) : (
                        <Bot className="w-4 h-4 text-military-glow" />
                      )}
                    </div>
                    <div className={cn(
                      "flex-1 p-3 rounded-lg",
                      msg.role === 'user' 
                        ? "bg-tactical-amber/10 border border-tactical-amber/20" 
                        : "bg-primary/10 border border-military-glow/20"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.reports && msg.reports.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Referenced Reports:</p>
                          <div className="flex flex-wrap gap-1">
                            {msg.reports.slice(0, 5).map((r) => (
                              <span key={r.report_id} className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">
                                #{r.report_id}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className={cn("flex gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <div className="w-8 h-8 rounded-full bg-military-glow/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-military-glow" />
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-military-glow/20">
                      <Loader2 className="w-4 h-4 animate-spin text-military-glow" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className={cn("flex gap-2", isRTL && "flex-row-reverse")}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('typeQuestion')}
                className="flex-1 bg-secondary/50 border-border"
                disabled={loading}
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="bg-primary hover:bg-primary/80 glow-green"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Examples Sidebar */}
        <div className="w-64 shrink-0 rounded-lg border border-border bg-card/50 p-4 hidden lg:block">
          <h3 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <MessageSquare className="w-4 h-4 text-military-glow" />
            {t('exampleQueries')}
          </h3>
          <div className="space-y-2">
            {currentExamples.map((query, i) => (
              <button
                key={i}
                onClick={() => handleSend(query)}
                disabled={loading}
                className={cn(
                  "w-full p-2 text-xs text-left rounded border border-border bg-secondary/30",
                  "hover:border-military-glow/50 hover:bg-primary/10 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isRTL && "text-right"
                )}
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
