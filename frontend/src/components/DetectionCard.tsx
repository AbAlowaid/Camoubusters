import { useLanguage } from '@/contexts/LanguageContext';
import { DetectionReport } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MapPin, User, Clock, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DetectionCardProps {
  report: DetectionReport;
  onClick?: () => void;
}

export function DetectionCard({ report, onClick }: DetectionCardProps) {
  const { t, isRTL } = useLanguage();

  const severityConfig = {
    High: { icon: AlertTriangle, color: 'bg-tactical-red/20 text-tactical-red border-tactical-red/50', label: t('high') },
    Medium: { icon: AlertCircle, color: 'bg-tactical-amber/20 text-tactical-amber border-tactical-amber/50', label: t('medium') },
    Low: { icon: Info, color: 'bg-military-glow/20 text-military-glow border-military-glow/50', label: t('low') },
  };

  const severity = severityConfig[report.severity];
  const SeverityIcon = severity.icon;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border border-border bg-card/50 backdrop-blur-sm cursor-pointer",
        "transition-all duration-300 hover:bg-card/80 hover:border-military-glow/50 hover:shadow-glow",
        "group"
      )}
    >
      <div className={cn("flex items-start justify-between mb-3", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <span className="font-mono text-sm text-military-glow">#{report.report_id}</span>
          <Badge variant="outline" className={cn("text-xs border", severity.color)}>
            <SeverityIcon className="w-3 h-3 mr-1" />
            {severity.label}
          </Badge>
        </div>
        <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
          <Clock className="w-3 h-3" />
          {formatTime(report.timestamp)}
        </div>
      </div>

      <div className="space-y-2">
        <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
          <User className="w-4 h-4 text-tactical-amber" />
          <span className="text-foreground font-semibold">{report.soldier_count}</span>
          <span className="text-muted-foreground">{t('soldiers')}</span>
        </div>

        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
          <MapPin className="w-3 h-3" />
          <span>
            {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
          </span>
        </div>

        {report.environment && (
          <div className="text-xs">
            <span className="text-muted-foreground">{t('environment')}: </span>
            <span className="text-foreground">{report.environment}</span>
          </div>
        )}

        {report.attire_and_camouflage && (
          <div className="text-xs">
            <span className="text-muted-foreground">{t('camouflage')}: </span>
            <span className="text-foreground line-clamp-1">{report.attire_and_camouflage}</span>
          </div>
        )}

        {report.equipment && (
          <div className="text-xs">
            <span className="text-muted-foreground">{t('equipment')}: </span>
            <span className="text-foreground line-clamp-1">{report.equipment}</span>
          </div>
        )}
      </div>

      {/* Hover Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-military-glow to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
