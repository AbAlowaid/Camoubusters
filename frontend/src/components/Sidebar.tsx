import { NavLink } from '@/components/NavLink';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ScanSearch, 
  FileText, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Radar,
  Globe
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/' },
  { key: 'analyze', icon: ScanSearch, path: '/analyze' },
  { key: 'reports', icon: FileText, path: '/reports' },
  { key: 'assistant', icon: MessageSquare, path: '/assistant' },
] as const;

export function Sidebar() {
  const { t, isRTL, lang, setLang } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-full border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 flex flex-col shrink-0",
        collapsed ? "w-16" : "w-56"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
              "text-muted-foreground hover:text-foreground hover:bg-primary/20",
              "border border-transparent hover:border-military-glow/30",
              collapsed && "justify-center"
            )}
            activeClassName="bg-primary/30 text-foreground border-military-glow/50 glow-green"
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <span className="font-medium text-sm">
                {t(item.key as any)}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Radar Animation */}
      {!collapsed && (
        <div className="p-4 flex justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border border-military-glow/30" />
            <div className="absolute inset-2 rounded-full border border-military-glow/20" />
            <div className="absolute inset-4 rounded-full border border-military-glow/10" />
            <Radar className="absolute inset-0 m-auto w-6 h-6 text-military-glow animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>
      )}

      {/* Language Toggle */}
      <button
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className={cn(
          "p-3 border-t border-border flex items-center justify-center gap-2",
          "text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
        )}
        title={lang === 'ar' ? 'English' : 'عربي'}
      >
        <Globe className="w-5 h-5" />
        {!collapsed && (
          <span className="text-sm font-medium">
            {lang === 'ar' ? 'EN' : 'عربي'}
          </span>
        )}
      </button>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "p-3 border-t border-border flex items-center justify-center",
          "text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
        )}
      >
        {collapsed ? (
          isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
        ) : (
          isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
}
