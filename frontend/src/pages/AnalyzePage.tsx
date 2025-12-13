import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useState, useRef, useCallback } from 'react';
import { analyzeMedia, AnalyzeMediaResponse, testSegmentation } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Loader2, 
  CheckCircle, 
  XCircle,
  MapPin,
  Users,
  Shield,
  Crosshair,
  Navigation
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AnalyzePage() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeMediaResponse | null>(null);
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: t('errorOccurred'),
        description: t('geolocationNotSupported'),
        variant: 'destructive',
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        setGettingLocation(false);
      }
    );
  }, [t, toast]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
    
    // Automatically get location when file is selected
    getCurrentLocation();
  }, [getCurrentLocation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type.startsWith('video/'))) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleAnalyze = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const loc = location.lat && location.lng ? location : undefined;
      const response = await analyzeMedia(file, loc);
      setResult(response);
      
      if (response.success && response.detection) {
        toast({
          title: t('detectionFound'),
          description: `${response.soldier_count} ${t('soldiers')}`,
        });
      } else if (response.success) {
        toast({
          title: t('analysisComplete'),
          description: t('noDetection'),
        });
      }
    } catch (error) {
      toast({
        title: t('errorOccurred'),
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const response = await testSegmentation(file);
      if (response.success && response.overlay_image) {
        setResult({
          success: true,
          overlay_image: response.overlay_image,
          detection: false,
        });
      }
    } catch (error) {
      toast({
        title: t('errorOccurred'),
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 hud-grid min-h-full">
      {/* Header */}
      <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
        <h1 className="text-2xl font-sans font-bold tracking-wider text-foreground">
          {t('analyze')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('uploadImage')} / {t('uploadVideo')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer",
              "transition-all duration-300 hover:border-military-glow hover:bg-primary/5",
              "min-h-[300px] flex flex-col items-center justify-center",
              preview && "border-military-glow"
            )}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-64 max-w-full rounded-lg object-contain" />
            ) : (
              <>
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Upload className="w-8 h-8 text-military-glow" />
                </div>
                <p className="text-foreground font-medium mb-2">{t('dragDrop')}</p>
                <p className="text-muted-foreground text-sm">{t('or')}</p>
                <Button variant="outline" className="mt-3 border-military-glow/50 hover:bg-primary/20">
                  {t('browse')}
                </Button>
              </>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Location Status Indicator */}
          {file && (
            <div className="p-3 rounded-lg border border-border bg-card/50">
              <div className="flex items-center gap-2 text-sm">
                {gettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 text-military-glow animate-spin" />
                    <span className="text-muted-foreground">{t('detectingLocation')}</span>
                  </>
                ) : location.lat && location.lng ? (
                  <>
                    <MapPin className="w-4 h-4 text-military-glow" />
                    <span className="text-muted-foreground">{t('location')}:</span>
                    <span className="font-mono text-xs text-military-glow">
                      {parseFloat(location.lat).toFixed(4)}, {parseFloat(location.lng).toFixed(4)}
                    </span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">{t('locationNotAvailable')}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
            <Button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground glow-green"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Crosshair className="w-4 h-4 mr-2" />
              )}
              {loading ? t('analyzing') : t('analyze')}
            </Button>
            <Button
              variant="outline"
              onClick={handleQuickTest}
              disabled={!file || loading}
              className="border-border hover:border-military-glow hover:bg-primary/10"
            >
              <Shield className="w-4 h-4 mr-2" />
              {t('quickTest')}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border bg-card/50 min-h-[400px]">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-military-glow animate-spin mb-4" />
                <p className="text-muted-foreground font-mono">{t('processingImage')}</p>
                <div className="mt-4 w-48 h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-military-glow animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Detection Status */}
                <div className={cn(
                  "p-4 rounded-lg border flex items-center gap-3",
                  result.detection 
                    ? "border-tactical-red bg-tactical-red/10" 
                    : "border-military-glow bg-primary/10",
                  isRTL && "flex-row-reverse"
                )}>
                  {result.detection ? (
                    <XCircle className="w-6 h-6 text-tactical-red" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-military-glow" />
                  )}
                  <div>
                    <p className={cn(
                      "font-semibold",
                      result.detection ? "text-tactical-red" : "text-military-glow"
                    )}>
                      {result.detection ? t('detectionFound') : t('noDetection')}
                    </p>
                    {result.soldier_count !== undefined && result.soldier_count > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {result.soldier_count} {t('soldiers')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Overlay Image */}
                {result.overlay_image && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img 
                      src={result.overlay_image} 
                      alt="Segmentation Overlay" 
                      className="w-full"
                    />
                  </div>
                )}

                {/* Report Details */}
                {result.report && (
                  <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border">
                    <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                      <span className="text-xs text-muted-foreground">{t('reportId')}</span>
                      <span className="font-mono text-military-glow">#{result.report.report_id}</span>
                    </div>
                    {result.report.analysis && (
                      <>
                        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                          <span className="text-xs text-muted-foreground">{t('environment')}</span>
                          <span className="text-sm">{result.report.analysis.environment}</span>
                        </div>
                        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                          <span className="text-xs text-muted-foreground">{t('camouflage')}</span>
                          <span className="text-sm">{result.report.analysis.attire_and_camouflage}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {result.report.analysis.summary}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-center">
                  {t('uploadImage')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
