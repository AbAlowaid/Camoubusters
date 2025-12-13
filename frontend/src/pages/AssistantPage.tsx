import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { queryMoraqib, MoraqibResponse, getDetectionReport, DetectionReport, getStorageUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  MessageSquare,
  Sparkles,
  MapPin,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  Download,
  Map as MapIcon
} from 'lucide-react';
import { generatePDF } from '@/utils/pdfGenerator';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  reports?: string[]; // Array of report IDs
}

// Simple markdown to JSX converter
const parseMarkdown = (text: string) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Match **bold** text
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add bold text
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

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
  const [selectedReport, setSelectedReport] = useState<DetectionReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const severityConfig = {
    High: { icon: AlertTriangle, color: 'bg-tactical-red/20 text-tactical-red border-tactical-red/50' },
    Medium: { icon: AlertCircle, color: 'bg-tactical-amber/20 text-tactical-amber border-tactical-amber/50' },
    Low: { icon: Info, color: 'bg-military-glow/20 text-military-glow border-military-glow/50' },
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReportClick = async (reportId: string) => {
    setLoadingReport(true);
    try {
      const response = await getDetectionReport(reportId);
      if (response.success && response.report) {
        setSelectedReport(response.report);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoadingReport(false);
    }
  };

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
      <div className={cn("mb-4", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
        <h1 className={cn("text-2xl font-sans font-bold tracking-wider text-foreground flex items-center gap-2", isRTL && "flex-row-reverse")}>
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
                      "flex items-start",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "flex gap-3 max-w-[85%]",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
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
                    )}
                    dir={isRTL ? "rtl" : "ltr"}
                    >
                      <p className={cn("text-sm whitespace-pre-wrap", isRTL && "text-right")}>
                        {msg.role === 'assistant' ? parseMarkdown(msg.content) : msg.content}
                      </p>
                      {msg.reports && msg.reports.length > 0 && (
                        <div className={cn("mt-2 pt-2 border-t border-border", isRTL && "text-right")}>
                          <p className="text-xs text-muted-foreground mb-1">
                            {t('referencedReports')} ({msg.reports.length}):
                          </p>
                          <div className={cn("flex flex-wrap gap-1", isRTL && "justify-end")}>
                            {msg.reports.map((reportId) => (
                              <button
                                key={reportId}
                                onClick={() => handleReportClick(reportId)}
                                disabled={loadingReport}
                                className="text-xs font-mono bg-secondary hover:bg-military-glow/20 hover:border-military-glow/50 border border-border px-2 py-0.5 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                #{reportId}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-tactical text-military-glow flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Report: #{selectedReport?.report_id}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MapPin className="w-4 h-4 text-military-glow" />
                  {t('location')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="p-4 rounded-lg border border-border bg-secondary/30">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('latitude')}:</span>
                          <span className="font-mono text-military-glow">{selectedReport.location.latitude.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('longitude')}:</span>
                          <span className="font-mono text-military-glow">{selectedReport.location.longitude.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="text-muted-foreground">{t('timestamp')}:</span>
                          <span className="text-xs">{formatTime(selectedReport.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedReport.location.latitude},${selectedReport.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full border-military-glow/30 hover:border-military-glow hover:bg-military-glow/10">
                        <MapIcon className="w-4 h-4 mr-2" />
                        {t('openInMaps')}
                      </Button>
                    </a>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden bg-secondary/30 h-[250px]">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedReport.location.longitude - 0.01},${selectedReport.location.latitude - 0.01},${selectedReport.location.longitude + 0.01},${selectedReport.location.latitude + 0.01}&layer=mapnik&marker=${selectedReport.location.latitude},${selectedReport.location.longitude}`}
                      style={{ border: 0 }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selectedReport.image_snapshot_url && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase">{t('originalImage')}</p>
                    <img 
                      src={getStorageUrl(selectedReport.image_snapshot_url)} 
                      alt="Original" 
                      crossOrigin="anonymous"
                      className="rounded-lg border border-border w-full"
                    />
                  </div>
                )}
                {selectedReport.segmented_image_url && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase">{t('segmentedImage')}</p>
                    <img 
                      src={getStorageUrl(selectedReport.segmented_image_url)} 
                      alt="Segmented" 
                      crossOrigin="anonymous"
                      className="rounded-lg border border-border w-full"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-muted-foreground text-xs uppercase mb-1">{t('soldierCount')}</p>
                  <p className="text-lg font-semibold text-tactical-amber">{selectedReport.soldier_count}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-muted-foreground text-xs uppercase mb-1">{t('severity')}</p>
                  <Badge variant="outline" className={cn("text-xs", severityConfig[selectedReport.severity].color)}>
                    {selectedReport.severity === 'High' ? t('high') : selectedReport.severity === 'Medium' ? t('medium') : t('low')}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-muted-foreground text-xs uppercase mb-1">{t('environment')}</p>
                  <p className="font-medium">{selectedReport.environment || '-'}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-muted-foreground text-xs uppercase mb-1">{t('camouflage')}</p>
                  <p className="font-medium">{selectedReport.attire_and_camouflage || '-'}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-muted-foreground text-xs uppercase mb-1">{t('equipment')}</p>
                  <p className="font-medium">{selectedReport.equipment || '-'}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-muted-foreground text-xs uppercase mb-1">{t('sourceDevice')}</p>
                  <p className="font-mono text-xs">{selectedReport.source_device_id}</p>
                </div>
              </div>
              
              <div className="flex justify-center pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="border-military-glow/30 hover:border-military-glow hover:bg-military-glow/10"
                  onClick={async () => {
                    const getBase64FromImgElement = (imgElement: HTMLImageElement | null): string => {
                      if (!imgElement) return '';
                      try {
                        const canvas = document.createElement('canvas');
                        canvas.width = imgElement.naturalWidth || imgElement.width;
                        canvas.height = imgElement.naturalHeight || imgElement.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(imgElement, 0, 0);
                          return canvas.toDataURL('image/png');
                        }
                      } catch (error) {
                        console.error('Error converting image to base64:', error);
                      }
                      return '';
                    };

                    const dialogImages = document.querySelectorAll('.grid.grid-cols-2.gap-4 img');
                    const originalImg = dialogImages[0] as HTMLImageElement | undefined;
                    const segmentedImg = dialogImages[1] as HTMLImageElement | undefined;

                    const original_base64 = originalImg ? getBase64FromImgElement(originalImg) : '';
                    const masked_base64 = segmentedImg ? getBase64FromImgElement(segmentedImg) : '';

                    const reportForPDF = {
                      report_id: selectedReport.report_id,
                      timestamp: selectedReport.timestamp,
                      location: selectedReport.location,
                      analysis: {
                        summary: `${selectedReport.soldier_count} soldiers detected in ${selectedReport.environment || 'unknown environment'}`,
                        environment: selectedReport.environment || '',
                        soldier_count: selectedReport.soldier_count,
                        attire_and_camouflage: selectedReport.attire_and_camouflage || '',
                        equipment: selectedReport.equipment || '',
                      },
                      images: {
                        original_base64,
                        masked_base64,
                      },
                    };
                    generatePDF(reportForPDF);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('exportAsPDF')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
