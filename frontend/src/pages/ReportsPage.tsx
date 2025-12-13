import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo } from 'react';
import { getDetectionReports, DetectionReport, getStorageUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { generatePDF } from '@/utils/pdfGenerator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  RefreshCw, 
  FileText,
  MapPin,
  User,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  Search,
  Filter,
  X,
  Map as MapIcon,
  Download
} from 'lucide-react';

export function ReportsPage() {
  const { t, isRTL } = useLanguage();
  const [reports, setReports] = useState<DetectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [selectedReport, setSelectedReport] = useState<DetectionReport | null>(null);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'In Progress' | 'Closed'>('all');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await getDetectionReports(timeRange, 50);
      if (response.success) {
        setReports(response.detections);
        setTotal(response.total);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [timeRange]);

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

  const timeRangeOptions = [
    { value: '24h', label: t('last24h') },
    { value: '7d', label: t('last7d') },
    { value: '30d', label: t('last30d') },
    { value: 'all', label: t('allTime') },
  ];

  // Filter reports based on search and filters
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        report.report_id.toLowerCase().includes(searchLower) ||
        report.location.latitude.toString().includes(searchLower) ||
        report.location.longitude.toString().includes(searchLower) ||
        report.soldier_count.toString().includes(searchLower) ||
        report.environment?.toLowerCase().includes(searchLower) ||
        report.equipment?.toLowerCase().includes(searchLower);
      
      // Severity filter
      const matchesSeverity = severityFilter === 'all' || report.severity === severityFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [reports, searchQuery, severityFilter, statusFilter]);

  const hasActiveFilters = searchQuery || severityFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSeverityFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="p-6 space-y-6 hud-grid min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between" dir={isRTL ? "rtl" : "ltr"}>
        <div className={cn(isRTL && "text-right")}>
          <h1 className={cn("text-2xl font-sans font-bold tracking-wider text-foreground flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <FileText className="w-6 h-6 text-military-glow" />
            {t('reports')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredReports.length} {t('of')} {total} {t('totalDetections')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
            onClick={fetchReports}
            disabled={loading}
            className="border-border hover:border-military-glow hover:bg-primary/20"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={cn("flex flex-col md:flex-row gap-4", isRTL && "md:flex-row-reverse")}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchReports')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as any)}>
            <SelectTrigger className="w-[140px] bg-card border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('severity')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allSeverities')}</SelectItem>
              <SelectItem value="High">{t('high')}</SelectItem>
              <SelectItem value="Medium">{t('medium')}</SelectItem>
              <SelectItem value="Low">{t('low')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[140px] bg-card border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="New">{t('new')}</SelectItem>
              <SelectItem value="In Progress">{t('inProgress')}</SelectItem>
              <SelectItem value="Closed">{t('closed')}</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={clearFilters}
              className="border-border hover:border-tactical-red hover:bg-tactical-red/20"
              title={t('clearFilters')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr className={cn("text-xs uppercase tracking-wider text-muted-foreground", isRTL && "text-right")}>
                <th className="p-4">{t('reportId')}</th>
                <th className="p-4">{t('timestamp')}</th>
                <th className="p-4">{t('location')}</th>
                <th className="p-4">{t('soldierCount')}</th>
                <th className="p-4">{t('severity')}</th>
                <th className="p-4">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <div className="h-8 bg-secondary/30 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const severity = severityConfig[report.severity];
                  const SeverityIcon = severity.icon;
                  
                  return (
                    <tr 
                      key={report.report_id}
                      className="hover:bg-primary/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedReport(report)}
                    >
                      <td className="p-4">
                        <span className="font-mono text-military-glow">#{report.report_id}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {formatTime(report.timestamp)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {report.location.latitude.toFixed(2)}, {report.location.longitude.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 font-semibold">
                          <User className="w-4 h-4 text-tactical-amber" />
                          {report.soldier_count}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={cn("text-xs", severity.color)}>
                          <SeverityIcon className="w-3 h-3 mr-1" />
                          {report.severity === 'High' ? t('high') : report.severity === 'Medium' ? t('medium') : t('low')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs border-military-glow/30 text-military-glow">
                          {report.status === 'New' ? t('new') : report.status === 'In Progress' ? t('inProgress') : t('closed')}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                    // Get base64 from already loaded img elements in the dialog
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

                    // Find the img elements in the current dialog
                    const dialogImages = document.querySelectorAll('.grid.grid-cols-2.gap-4 img');
                    const originalImg = dialogImages[0] as HTMLImageElement | undefined;
                    const segmentedImg = dialogImages[1] as HTMLImageElement | undefined;

                    const original_base64 = originalImg ? getBase64FromImgElement(originalImg) : '';
                    const masked_base64 = segmentedImg ? getBase64FromImgElement(segmentedImg) : '';

                    console.log('Original image base64 length:', original_base64.length);
                    console.log('Segmented image base64 length:', masked_base64.length);

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
