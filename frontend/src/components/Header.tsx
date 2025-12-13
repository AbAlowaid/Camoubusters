import { Shield, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { checkHealth, HealthResponse } from '@/lib/api';

export function Header() {
  const { lang, setLang, t, isRTL } = useLanguage();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await checkHealth();
        setHealth(data);
      } catch {
        setHealth(null);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = health?.status === 'healthy';

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <div className="relative">
            <Shield className="w-10 h-10 text-military-glow" />
            <div className="absolute inset-0 animate-pulse-glow rounded-full" />
          </div>
          <div className={cn("flex flex-col", isRTL && "items-end")}>
            <h1 className="font-tactical text-xl font-bold tracking-wider text-foreground">
              {t('appName')}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              {t('appTagline')}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
          {/* System Status */}
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-secondary/50", isRTL && "flex-row-reverse")}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isOnline ? "status-online" : "status-offline"
            )} />
            <span className={cn(
              "text-xs font-mono font-semibold",
              isOnline ? "text-hud-green" : "text-tactical-red"
            )}>
              {isOnline ? t('online') : t('offline')}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {t('systemStatus')}: 
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
