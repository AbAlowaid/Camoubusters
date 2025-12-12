import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'warning' | 'danger';
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, variant = 'default', className }: StatsCardProps) {
  const variants = {
    default: 'border-border hover:border-military-glow/50',
    warning: 'border-tactical-amber-dim hover:border-tactical-amber',
    danger: 'border-tactical-red/50 hover:border-tactical-red',
  };

  const iconVariants = {
    default: 'text-military-glow',
    warning: 'text-tactical-amber',
    danger: 'text-tactical-red',
  };

  return (
    <div 
      className={cn(
        "relative p-5 rounded-lg border bg-card/50 backdrop-blur-sm transition-all duration-300",
        "hover:bg-card/80 hover:shadow-glow corner-brackets group",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className={cn(
            "text-3xl font-tactical font-bold tracking-wider",
            variant === 'danger' && "text-tactical-red",
            variant === 'warning' && "text-tactical-amber",
            variant === 'default' && "text-foreground"
          )}>
            {value}
          </p>
        </div>
        <div className={cn(
          "p-2 rounded-lg bg-secondary/50 transition-colors group-hover:bg-primary/20",
          iconVariants[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* HUD Lines */}
      <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg">
        <div className={cn(
          "h-full transition-all duration-500",
          variant === 'default' && "bg-gradient-to-r from-transparent via-military-glow/50 to-transparent",
          variant === 'warning' && "bg-gradient-to-r from-transparent via-tactical-amber/50 to-transparent",
          variant === 'danger' && "bg-gradient-to-r from-transparent via-tactical-red/50 to-transparent"
        )} />
      </div>
    </div>
  );
}
