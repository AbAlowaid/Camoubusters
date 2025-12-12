import { useLanguage } from '@/contexts/LanguageContext';
import { StatsCard } from '@/components/StatsCard';
import { DetectionCard } from '@/components/DetectionCard';
import { useEffect, useState, useMemo } from 'react';
import { getDetectionStats, getDetectionReports, Stats, DetectionReport, getStorageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  AlertTriangle, 
  Clock, 
  Timer, 
  Activity,
  RefreshCw,
  Users,
  MapPin,
  FileText,
  Map as MapIcon,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Dashboard() {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<DetectionReport[]>([]);
  const [allDetections, setAllDetections] = useState<DetectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [totalSoldiers, setTotalSoldiers] = useState<number>(0);
  const [selectedReport, setSelectedReport] = useState<DetectionReport | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, allReportsRes] = await Promise.all([
        getDetectionStats(timeRange),
        getDetectionReports(timeRange, 6),
        getDetectionReports(timeRange, 1000), // Fetch all detections to calculate total soldiers
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (reportsRes.success) setReports(reportsRes.detections);
      if (allReportsRes.success) {
        setAllDetections(allReportsRes.detections);
        // Calculate total soldiers from all detections
        const total = allReportsRes.detections.reduce((sum, report) => sum + (report.soldier_count || 0), 0);
        setTotalSoldiers(total);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const timeRangeOptions = [
    { value: '24h', label: t('last24h') },
    { value: '7d', label: t('last7d') },
    { value: '30d', label: t('last30d') },
    { value: 'all', label: t('allTime') },
  ];

  // Process detection data for chart
  const chartData = useMemo(() => {
    if (!allDetections.length) return [];

    // Group detections by time interval
    const timeMap = new Map<string, number>();
    
    allDetections.forEach(report => {
      const date = new Date(report.timestamp);
      let timeKey: string;
      
      if (timeRange === '24h') {
        // Group by hour
        timeKey = `${date.getHours().toString().padStart(2, '0')}:00`;
      } else if (timeRange === '7d') {
        // Group by day
        timeKey = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (timeRange === '30d') {
        // Group by day
        timeKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        // Group by month
        timeKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      timeMap.set(timeKey, (timeMap.get(timeKey) || 0) + 1);
    });

    return Array.from(timeMap.entries())
      .map(([time, count]) => ({ time, detections: count }))
      .sort((a, b) => {
        // Sort chronologically
        if (timeRange === '24h') {
          return a.time.localeCompare(b.time);
        }
        return 0; // Keep map order for other ranges
      });
  }, [allDetections, timeRange]);

  const chartConfig = {
    detections: {
      label: t('detections'),
      color: 'hsl(var(--military-glow))',
    },
  };

  return (
    <div className="p-6 space-y-6 hud-grid min-h-full">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
          <h1 className="text-2xl font-tactical font-bold tracking-wider text-foreground">
            {t('dashboard')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('appTagline')}
          </p>
        </div>
        
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-40 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            className="border-border hover:border-military-glow hover:bg-primary/20"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('totalDetections')}
          value={stats?.totalDetections ?? '-'}
          icon={Target}
          variant="default"
        />
        <StatsCard
          title={t('totalSoldiersDetected')}
          value={totalSoldiers}
          icon={Users}
          variant="default"
        />
        <StatsCard
          title={t('meanTimeToDetect')}
          value={stats?.mttd ?? '-'}
          icon={Clock}
          variant="default"
        />
        <StatsCard
          title={t('meanTimeToRespond')}
          value={stats?.mttr ?? '-'}
          icon={Timer}
          variant="warning"
        />
      </div>

      {/* Status Breakdown */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-military-glow/30 bg-card/50 text-center">
            <p className="text-2xl font-tactical font-bold text-military-glow">{stats.alertsByStatus.new}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t('new')}</p>
          </div>
          <div className="p-4 rounded-lg border border-tactical-amber/30 bg-card/50 text-center">
            <p className="text-2xl font-tactical font-bold text-tactical-amber">{stats.alertsByStatus.inProgress}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t('inProgress')}</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50 text-center">
            <p className="text-2xl font-tactical font-bold text-muted-foreground">{stats.alertsByStatus.closed}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t('closed')}</p>
          </div>
        </div>
      )}

      {/* Detections Over Time Chart */}
      <div className="p-6 rounded-lg border border-border bg-card/50 backdrop-blur-sm">
        <div className={cn("flex items-center justify-between mb-6", isRTL && "flex-row-reverse")}>
          <h2 className={cn("text-lg font-semibold", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
            {t('detectionsOverTime')}
          </h2>
          <span className="text-sm text-muted-foreground">
            {timeRangeOptions.find(opt => opt.value === timeRange)?.label}
          </span>
        </div>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis 
                dataKey="time" 
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="detections" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>{t('noData')}</p>
          </div>
        )}
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {t('chartHint')}
          </p>
        </div>
      </div>

      {/* Recent Detections */}
      <div className="space-y-4">
        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <h2 className={cn("text-lg font-semibold flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Activity className="w-5 h-5 text-military-glow" />
            {t('recentDetections')}
          </h2>
          <Button 
            variant="link" 
            className="text-military-glow hover:text-military-light"
            onClick={() => navigate('/reports')}
          >
            {t('viewAll')} →
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-card/30 animate-pulse" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <DetectionCard key={report.report_id} report={report} onClick={() => setSelectedReport(report)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('noData')}</p>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-tactical text-military-glow flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('reportId')}: #{selectedReport?.report_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              {/* Location and Map Section */}
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
                          <span className="text-xs">{new Date(selectedReport.timestamp).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</span>
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
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedReport.location.longitude - 0.01},${selectedReport.location.latitude - 0.01},${selectedReport.location.longitude + 0.01},${selectedReport.location.latitude + 0.01}&layer=mapnik&marker=${selectedReport.location.latitude},${selectedReport.location.longitude}`}
                      style={{ border: 0 }}
                    />
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="grid grid-cols-2 gap-4">
                {selectedReport.image_snapshot_url && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase">{t('originalImage')}</p>
                    <img 
                      src={getStorageUrl(selectedReport.image_snapshot_url)} 
                      alt="Original" 
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
                      className="rounded-lg border border-border w-full"
                    />
                  </div>
                )}
              </div>
              
              {/* Details Section */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-muted-foreground text-xs uppercase mb-1">{t('soldierCount')}</p>
                  <p className="text-lg font-semibold text-tactical-amber">{selectedReport.soldier_count}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-muted-foreground text-xs uppercase mb-1">{t('severity')}</p>
                  <Badge variant="outline" className={cn("text-xs", 
                    selectedReport.severity === 'High' ? 'bg-tactical-red/20 text-tactical-red border-tactical-red/50' :
                    selectedReport.severity === 'Medium' ? 'bg-tactical-amber/20 text-tactical-amber border-tactical-amber/50' :
                    'bg-military-glow/20 text-military-glow border-military-glow/50'
                  )}>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
